import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from './accounts.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

// If you have a Transaction entity, import it for relation checks
// import { Transaction } from '../transactions/transaction.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    // If you want to restrict delete, inject transaction repo too:
    // @InjectRepository(Transaction)
    // private readonly transactionRepository: Repository<Transaction>,
  ) {}

  /** 1. Create a new account */
  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const existing = await this.accountRepository.findOne({ where: { account_number: createAccountDto.account_number } });
    if (existing) {
      throw new BadRequestException('Account with this number already exists.');
    }
    const account = this.accountRepository.create(createAccountDto);
    return await this.accountRepository.save(account);
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
  async update(id: number, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Account not found.');
    }
    Object.assign(account, updateAccountDto);
    return await this.accountRepository.save(account);
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

    // For now, just delete (remove above comments later)
    await this.accountRepository.delete(id);
  }

  /** 6. Find account by account number */
  async findByAccountNumber(account_number: string): Promise<Account | undefined> {
    return await this.accountRepository.findOne({ where: { account_number } });
  }

  /** 7. Calculate/display current balance (to be enhanced with transactions later) */
  async getCurrentBalance(id: number): Promise<number> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Account not found.');
    }
    // Future: Add/subtract all transaction amounts to/from opening_balance
    return Number(account.opening_balance);
  }

  /** 8. Get all accounts by type */
  async findByType(accountType: AccountType): Promise<Account[]> {
    return await this.accountRepository.find({ where: { account_type: accountType } });
  }
}