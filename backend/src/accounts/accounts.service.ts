import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from './accounts.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Transaction } from 'src/transactions/transactions.entity';
import { RecipientsService } from '../recipients/recipients.service';
import { RecipientType } from '../recipients/recipients.entity';

// If you have a Transaction entity, import it for relation checks
// import { Transaction } from '../transactions/transaction.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    // If you want to restrict delete, inject transaction repo too:
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    // Inject RecipientsService for automatic recipient management
    @Inject(forwardRef(() => RecipientsService))
    private readonly recipientsService: RecipientsService,
  ) {}

  /** 1. Create a new account */
  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    // Only check for duplicate account numbers if an account number is provided
    if (createAccountDto.account_number) {
      const existing = await this.accountRepository.findOne({
        where: { account_number: createAccountDto.account_number },
      });
      if (existing) {
        throw new BadRequestException(
          'Account with this number already exists.',
        );
      }
    }

    const account = this.accountRepository.create(createAccountDto);
    const savedAccount = await this.accountRepository.save(account);

    // Automatically create corresponding recipient
    await this.createAccountRecipient(savedAccount);

    return savedAccount;
  }

  /** 2. List all accounts */
  async findAll(): Promise<Account[]> {
    return await this.accountRepository.find();
  }

  /** 3. Get single account by ID */
  async findOne(id: number): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Account not found.');
    }
    return account;
  }

  /** 4. Update account by ID */
  async update(
    id: number,
    updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    Object.assign(account, updateAccountDto);
    const updatedAccount = await this.accountRepository.save(account);

    // Update corresponding recipient if it exists
    await this.updateAccountRecipient(updatedAccount);

    return updatedAccount;
  }

  /** 5. Delete account by ID (restrict if linked transactions) */
  async remove(id: number): Promise<void> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    // --- Uncomment below when Transaction entity is implemented ---
    // const linkedTxCount = await this.transactionRepository.count({ where: { account_id: id } });
    // if (linkedTxCount > 0) {
    //   throw new BadRequestException('Cannot delete account with linked transactions.');
    // }

    // Delete corresponding recipient first
    await this.deleteAccountRecipient(account);

    // For now, just delete (remove above comments later)
    await this.accountRepository.delete(id);
  }

  /** 6. Find account by account number */
  async findByAccountNumber(
    account_number: string,
  ): Promise<Account | undefined> {
    return await this.accountRepository.findOne({ where: { account_number } });
  }

  async getCurrentBalance(accountId: number): Promise<number> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Account not found.');

    // Fetch all transactions where this account is either main account or "to_account" (for credits)
    const transactions = await this.transactionRepository.find({
      where: [
        { account: { id: accountId } },
        { to_account: { id: accountId } },
      ],
      relations: ['account', 'to_account'],
    });

    let balance = Number(account.opening_balance);

    for (const tx of transactions) {
      // Skip cancelled/failed/bounced/pending for balance
      if (['cancelled', 'failed', 'bounced', 'pending'].includes(tx.status)) {
        continue;
      }

      // Money going out (debit)
      if (
        tx.account.id === accountId &&
        [
          'cheque',
          'online',
          'bank_charge',
          'other',
          'internal_transfer',
        ].includes(tx.transaction_type)
      ) {
        balance -= Number(tx.amount);
      }

      // Money coming in (credit)
      if (
        (tx.to_account &&
          tx.to_account.id === accountId &&
          ['internal_transfer'].includes(tx.transaction_type)) ||
        (tx.account.id === accountId &&
          ['cash_deposit'].includes(tx.transaction_type))
      ) {
        balance += Number(tx.amount);
      }
    }

    return balance;
  }

  /** 8. Get all accounts by type */
  async findByType(accountType: AccountType): Promise<Account[]> {
    return await this.accountRepository.find({
      where: { account_type: accountType },
    });
  }

  // Helper methods for automatic recipient management

  /** Create automatic recipient for account */
  private async createAccountRecipient(account: Account): Promise<void> {
    try {
      const recipientName = account.account_name;
      const recipientData = {
        name: recipientName,
        recipient_type: RecipientType.ACCOUNT,
        account_id: account.id,
        bank_account_no: account.account_number || null,
        notes: `Auto-generated recipient for account: ${account.account_name}`,
      };

      await this.recipientsService.create(recipientData);
    } catch (error) {
      console.error('Failed to create account recipient:', error);
      // Don't throw error to avoid failing account creation
    }
  }

  /** Update automatic recipient when account is updated */
  private async updateAccountRecipient(account: Account): Promise<void> {
    try {
      const recipients = await this.recipientsService.findByAccountId(
        account.id,
      );
      const accountRecipient = recipients.find(
        (r) => r.recipient_type === RecipientType.ACCOUNT,
      );

      if (accountRecipient) {
        const updateData = {
          name: account.account_name,
          bank_account_no: account.account_number || null,
          notes: `Auto-generated recipient for account: ${account.account_name}`,
        };
        await this.recipientsService.update(accountRecipient.id, updateData);
      }
    } catch (error) {
      console.error('Failed to update account recipient:', error);
      // Don't throw error to avoid failing account update
    }
  }

  /** Delete automatic recipient when account is deleted */
  private async deleteAccountRecipient(account: Account): Promise<void> {
    try {
      const recipients = await this.recipientsService.findByAccountId(
        account.id,
      );
      const accountRecipient = recipients.find(
        (r) => r.recipient_type === RecipientType.ACCOUNT,
      );
      if (accountRecipient) {
        await this.recipientsService.remove(accountRecipient.id);
      }
    } catch (error) {
      console.error('Failed to delete account recipient:', error);
      // Don't throw error to avoid failing account deletion
    }
  }
}
