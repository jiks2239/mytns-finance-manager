import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from './accounts.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Transaction } from '../transactions/transactions.entity';
import { TransactionStatus } from '../transactions/transactions.enums';
import { RecipientsService } from '../recipients/recipients.service';
import { RecipientType } from '../recipients/recipients.entity';

// If you have a Transaction entity, import it for relation checks
// import { Transaction } from '../transactions/transaction.entity';

@Injectable()
export class AccountsService implements OnModuleInit {
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

  // Initialize current balances when the module starts
  async onModuleInit() {
    try {
      await this.initializeCurrentBalances();
    } catch (error) {
      console.error('[ERROR] Failed to initialize current balances:', error);
    }
  }

  /** 1. Create a new account */
  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    // Check for duplicate account names
    const existingByName = await this.accountRepository.findOne({
      where: { account_name: createAccountDto.account_name },
    });
    if (existingByName) {
      throw new BadRequestException(
        `An account with the name "${createAccountDto.account_name}" already exists. Please use a different account name.`,
      );
    }

    // Only check for duplicate account numbers if an account number is provided
    if (createAccountDto.account_number) {
      const existing = await this.accountRepository.findOne({
        where: { account_number: createAccountDto.account_number },
      });
      if (existing) {
        throw new BadRequestException(
          `This account number is already in use by another account. Please use a different account number.`,
        );
      }
    }

    const account = this.accountRepository.create({
      ...createAccountDto,
      current_balance: createAccountDto.opening_balance || 0,
    });
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

    // Check for duplicate account names if name is being updated
    if (
      updateAccountDto.account_name &&
      updateAccountDto.account_name !== account.account_name
    ) {
      const existingByName = await this.accountRepository.findOne({
        where: { account_name: updateAccountDto.account_name },
      });
      if (existingByName) {
        throw new BadRequestException(
          `An account with the name "${updateAccountDto.account_name}" already exists. Please use a different account name.`,
        );
      }
    }

    // Check if opening balance is being updated
    const isOpeningBalanceUpdated =
      updateAccountDto.opening_balance !== undefined;
    const newOpeningBalance = updateAccountDto.opening_balance;

    // Check if there are any transactions for this account
    const transactionCount = await this.transactionRepository.count({
      where: { account: { id } },
    });

    // Store the old opening balance before updating
    const oldOpeningBalance = Number(account.opening_balance) || 0;

    Object.assign(account, updateAccountDto);

    // Update current balance logic based on the requirements:
    if (isOpeningBalanceUpdated) {
      if (transactionCount === 0) {
        // No transactions: current balance should equal opening balance
        account.current_balance = newOpeningBalance;
      } else {
        // Transactions exist: update current balance by the difference
        const balanceDifference = Number(newOpeningBalance) - oldOpeningBalance;
        const currentBalance = Number(account.current_balance) || 0;
        account.current_balance = currentBalance + balanceDifference;
      }
    }

    const updatedAccount = await this.accountRepository.save(account);

    // Update corresponding recipient if it exists
    await this.updateAccountRecipient(updatedAccount);

    return updatedAccount;
  }

  /** 5. Delete account by ID with cascade deletion of transactions and recipients */
  async remove(id: number): Promise<any> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['transactions', 'destination_transactions', 'recipient'],
    });

    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    // Optional: Check for specific conditions before deletion
    // For example, you might want to prevent deletion if account has pending transactions
    const pendingTxCount = await this.transactionRepository.count({
      where: [
        { account: { id }, status: TransactionStatus.PENDING },
        { to_account: { id }, status: TransactionStatus.PENDING },
      ],
    });
    if (pendingTxCount > 0) {
      throw new BadRequestException(
        'Cannot delete account with pending transactions. Please complete or cancel pending transactions first.',
      );
    }

    // Store account details before deletion for return value
    const deletedAccountInfo = {
      id: account.id,
      account_name: account.account_name,
      account_type: account.account_type,
      account_number: account.account_number,
      bank_name: account.bank_name,
      opening_balance: account.opening_balance,
      current_balance: account.current_balance,
      notes: account.notes,
    };

    // Delete the account - TypeORM cascade will handle:
    // 1. All transactions where this account is the main account
    // 2. All transactions where this account is the destination (to_account)
    // 3. The associated recipient (if exists)
    // 4. All transaction detail entities (due to cascade: true in Transaction entity)
    await this.accountRepository.remove(account);

    return deletedAccountInfo;
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

    // Return the current balance which is automatically updated by transactions
    return Number(account.current_balance);
  }

  /** 8. Initialize current balance for existing accounts */
  async initializeCurrentBalances(): Promise<void> {
    const accounts = await this.accountRepository.find();

    for (const account of accounts) {
      // Initialize current_balance if it's null, undefined, or if it should equal opening_balance
      const currentBalance = Number(account.current_balance) || 0;
      const openingBalance = Number(account.opening_balance) || 0;

      if (currentBalance === 0 && openingBalance !== 0) {
        account.current_balance = openingBalance;
        await this.accountRepository.save(account);
      }
    }
  }

  /** 9. Get all accounts by type */
  async findByType(accountType: AccountType): Promise<Account[]> {
    return await this.accountRepository.find({
      where: { account_type: accountType },
    });
  }

  /** 10. Get global pending transactions count */
  async getPendingTransactionsCount(): Promise<number> {
    return await this.transactionRepository.count({
      where: { status: TransactionStatus.PENDING },
    });
  }

  /** 11. Get pending transactions count for a specific account */
  async getPendingTransactionsCountByAccount(
    accountId: number,
  ): Promise<number> {
    // For pending transactions, only count transactions where this account is the SOURCE account
    // (the account initiating the transaction), not the destination account
    return await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.account', 'account')
      .where('account.id = :accountId AND transaction.status = :status', {
        accountId,
        status: TransactionStatus.PENDING,
      })
      .getCount();
  }

  // Helper methods for automatic recipient management

  /** Create automatic recipient for account */
  private async createAccountRecipient(account: Account): Promise<void> {
    try {
      // Create the regular account recipient
      const recipientName = account.account_name;
      const recipientData = {
        name: recipientName,
        recipient_type: RecipientType.ACCOUNT,
        account_id: account.id,
        bank_account_no: account.account_number || null,
        notes: `Auto-generated recipient for account: ${account.account_name}`,
      };

      await this.recipientsService.create(recipientData);

      // Create "Self" recipient for current and savings accounts
      if (
        account.account_type === AccountType.CURRENT ||
        account.account_type === AccountType.SAVINGS
      ) {
        const selfRecipientData = {
          name: 'Self',
          recipient_type: RecipientType.OWNER,
          account_id: account.id,
          notes: `Auto-generated owner recipient for cash deposits to ${account.account_name}`,
        };

        await this.recipientsService.create(selfRecipientData);
      }
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
      
      // Update the account recipient
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

      // Update the self recipient notes for current/savings accounts
      const selfRecipient = recipients.find(
        (r) => r.recipient_type === RecipientType.OWNER,
      );

      if (
        selfRecipient &&
        (account.account_type === AccountType.CURRENT ||
          account.account_type === AccountType.SAVINGS)
      ) {
        const updateData = {
          notes: `Auto-generated owner recipient for cash deposits to ${account.account_name}`,
        };
        await this.recipientsService.update(selfRecipient.id, updateData);
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
      
      // Delete the account recipient
      const accountRecipient = recipients.find(
        (r) => r.recipient_type === RecipientType.ACCOUNT,
      );
      if (accountRecipient) {
        await this.recipientsService.remove(accountRecipient.id);
      }

      // Delete the self recipient if it exists
      const selfRecipient = recipients.find(
        (r) => r.recipient_type === RecipientType.OWNER,
      );
      if (selfRecipient) {
        await this.recipientsService.remove(selfRecipient.id);
      }
    } catch (error) {
      console.error('Failed to delete account recipient:', error);
      // Don't throw error to avoid failing account deletion
    }
  }
}
