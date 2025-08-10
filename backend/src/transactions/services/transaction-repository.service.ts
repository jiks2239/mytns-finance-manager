import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Transaction } from '../transactions.entity';
import { Account } from '../../accounts/accounts.entity';
import { Recipient } from '../../recipients/recipients.entity';
import {
  TransactionType,
  TransactionDirection,
  TransactionStatus,
} from '../transactions.enums';

@Injectable()
export class TransactionRepositoryService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Recipient)
    private readonly recipientRepository: Repository<Recipient>,
  ) {}

  // Create a new transaction
  async createTransaction(
    transactionData: Partial<Transaction>,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create(transactionData);
    return await this.transactionRepository.save(transaction);
  }

  // Find all transactions with relations
  async findAllTransactions(): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      relations: [
        'account',
        'recipient',
        'to_account',
        'cheque_details',
        'online_transfer_details',
        'bank_charge_details',
        'cash_deposit_details',
        'bank_transfer_details',
        'upi_settlement_details',
        'account_transfer_details',
      ],
    });
  }

  // Find transaction by ID with all relations
  async findTransactionById(id: number): Promise<Transaction | null> {
    return await this.transactionRepository.findOne({
      where: { id },
      relations: [
        'account',
        'recipient',
        'to_account',
        'parent_transaction',
        'cheque_details',
        'online_transfer_details',
        'bank_charge_details',
        'cash_deposit_details',
        'bank_transfer_details',
        'upi_settlement_details',
        'account_transfer_details',
      ],
    });
  }

  // Find transactions by account with optional filtering
  async findTransactionsByAccount(
    accountId: number,
    filters?: {
      transaction_type?: TransactionType;
      transaction_direction?: TransactionDirection;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Transaction[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.recipient', 'recipient')
      .leftJoinAndSelect('transaction.to_account', 'to_account')
      .leftJoinAndSelect('transaction.parent_transaction', 'parent_transaction')
      .leftJoinAndSelect('transaction.cheque_details', 'cheque_details')
      .leftJoinAndSelect(
        'transaction.online_transfer_details',
        'online_transfer_details',
      )
      .leftJoinAndSelect(
        'transaction.bank_charge_details',
        'bank_charge_details',
      )
      .leftJoinAndSelect(
        'transaction.cash_deposit_details',
        'cash_deposit_details',
      )
      .leftJoinAndSelect(
        'transaction.bank_transfer_details',
        'bank_transfer_details',
      )
      .leftJoinAndSelect(
        'transaction.upi_settlement_details',
        'upi_settlement_details',
      )
      .leftJoinAndSelect(
        'transaction.account_transfer_details',
        'account_transfer_details',
      )
      .where('transaction.account.id = :accountId', { accountId });

    if (filters) {
      if (filters.transaction_type) {
        queryBuilder.andWhere(
          'transaction.transaction_type = :transactionType',
          {
            transactionType: filters.transaction_type,
          },
        );
      }

      if (filters.transaction_direction) {
        queryBuilder.andWhere(
          'transaction.transaction_direction = :transactionDirection',
          {
            transactionDirection: filters.transaction_direction,
          },
        );
      }

      if (filters.status) {
        queryBuilder.andWhere('transaction.status = :status', {
          status: filters.status,
        });
      }

      if (filters.startDate) {
        queryBuilder.andWhere('transaction.transaction_date >= :startDate', {
          startDate: filters.startDate,
        });
      }

      if (filters.endDate) {
        queryBuilder.andWhere('transaction.transaction_date <= :endDate', {
          endDate: filters.endDate,
        });
      }
    }

    return await queryBuilder
      .orderBy('transaction.transaction_date', 'DESC')
      .addOrderBy('transaction.created_at', 'DESC')
      .getMany();
  }

  // Update transaction
  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    return await this.transactionRepository.save(transaction);
  }

  // Remove transaction
  async removeTransaction(transaction: Transaction): Promise<void> {
    await this.transactionRepository.remove(transaction);
  }

  // Find child transactions by parent ID
  async findChildTransactions(
    parentTransactionId: number,
  ): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: { parent_transaction_id: parentTransactionId },
      relations: ['account', 'cash_deposit_details'],
    });
  }

  // Find account by ID
  async findAccountById(accountId: number): Promise<Account | null> {
    return await this.accountRepository.findOne({
      where: { id: accountId },
    });
  }

  // Find recipient by ID
  async findRecipientById(recipientId: number): Promise<Recipient | null> {
    return await this.recipientRepository.findOne({
      where: { id: recipientId },
    });
  }

  // Find owner recipient for account (for cash deposits)
  async findOwnerRecipientForAccount(
    accountId: number,
  ): Promise<Recipient | null> {
    return await this.recipientRepository.findOne({
      where: {
        account_id: accountId,
        recipient_type: 'owner' as any,
      },
    });
  }

  // Update account balance
  async updateAccountBalance(account: Account): Promise<Account> {
    return await this.accountRepository.save(account);
  }

  // Find deposit transaction for account transfer (for deletion)
  async findDepositTransactionForAccountTransfer(
    toAccountId: number,
    amount: number,
    transactionDate: Date,
    fromAccountName: string | number,
  ): Promise<Transaction | null> {
    return await this.transactionRepository.findOne({
      where: {
        transaction_type: TransactionType.CASH_DEPOSIT,
        account: { id: toAccountId },
        amount: amount,
        status: TransactionStatus.DEPOSITED,
        transaction_date: transactionDate,
        description: Like(`[Account Transfer] from ${fromAccountName}%`),
      },
      relations: ['account'],
    });
  }
}
