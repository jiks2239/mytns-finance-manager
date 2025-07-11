import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Transaction } from './transactions.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

import { ChequeTransactionDetails } from './cheque-transaction-details.entity';
import { OnlineTransferDetails } from './online-transfer-details.entity';
import { BankChargeDetails } from './bank-charge-details.entity';

import { Account } from '../accounts/accounts.entity';
import { Recipient } from '../recipients/recipients.entity';
import { TransactionType, TransactionStatus } from './transactions.enums';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ChequeTransactionDetails)
    private readonly chequeDetailsRepository: Repository<ChequeTransactionDetails>,
    @InjectRepository(OnlineTransferDetails)
    private readonly onlineDetailsRepository: Repository<OnlineTransferDetails>,
    @InjectRepository(BankChargeDetails)
    private readonly chargeDetailsRepository: Repository<BankChargeDetails>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Recipient)
    private readonly recipientRepository: Repository<Recipient>,
  ) {}

  // 1. Create a new transaction (with optional child details)
  async create(createDto: CreateTransactionDto): Promise<Transaction> {
    // 1.1 Validate required related entities (account, recipient, etc.)
    const account = await this.accountRepository.findOne({
      where: { id: createDto.account_id },
    });
    if (!account) throw new NotFoundException('Account not found.');

    let recipient: Recipient | undefined;
    if (createDto.recipient_id) {
      recipient = await this.recipientRepository.findOne({
        where: { id: createDto.recipient_id },
      });
      if (!recipient) throw new NotFoundException('Recipient not found.');
    }

    // 1.2 Create transaction entity
    const transaction = this.transactionRepository.create({
      transaction_type: createDto.transaction_type,
      amount: createDto.amount,
      account,
      recipient,
      status: createDto.status,
      description: createDto.description,
      transaction_date: createDto.transaction_date,
    });

    // 1.3 Handle child detail entities based on type
    // (a) Cheque
    if (createDto.transaction_type === 'cheque' && createDto.cheque_details) {
      const chequeDetails = this.chequeDetailsRepository.create({
        ...createDto.cheque_details,
        transaction,
      });
      transaction.cheque_details = chequeDetails;
    }
    // (b) Online transfer
    if (
      createDto.transaction_type === 'online' &&
      createDto.online_transfer_details
    ) {
      const { transfer_date } = createDto.online_transfer_details;
      // Only create online_transfer_details if transfer_date is present and not empty
      if (transfer_date && String(transfer_date).trim() !== '') {
        const onlineDetails = this.onlineDetailsRepository.create({
          transfer_date,
          transaction,
        });
        transaction.online_transfer_details = onlineDetails;
      }
    }
    // (c) Bank charge
    if (
      createDto.transaction_type === 'bank_charge' &&
      createDto.bank_charge_details
    ) {
      const chargeDetails = this.chargeDetailsRepository.create({
        ...createDto.bank_charge_details,
        transaction,
      });
      transaction.bank_charge_details = chargeDetails;
    }

    // 1.4 Save transaction (cascade saves child details)
    const savedTransaction = await this.transactionRepository.save(transaction);

    // --- Internal Transfer Logic ---
    if (
      createDto.transaction_type === TransactionType.INTERNAL_TRANSFER &&
      createDto.to_account_id &&
      createDto.status === TransactionStatus.COMPLETED
    ) {
      // Create a cash_deposit transaction in the "to_account"
      const toAccount = await this.accountRepository.findOne({
        where: { id: createDto.to_account_id },
      });
      if (toAccount) {
        const depositTx = this.transactionRepository.create({
          transaction_type: TransactionType.CASH_DEPOSIT,
          amount: createDto.amount,
          account: toAccount,
          status: TransactionStatus.COMPLETED,
          description: `[Internal Transfer] from account ${account.account_name || account.id}`,
          transaction_date: createDto.transaction_date,
        });
        await this.transactionRepository.save(depositTx);
      }
    }

    return savedTransaction;
  }

  // 2. List all transactions
  async findAll(): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      relations: [
        'account',
        'recipient',
        'to_account',
        'cheque_details',
        'online_transfer_details',
        'bank_charge_details',
      ],
    });
  }

  // 3. Find one by ID
  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: [
        'account',
        'recipient',
        'to_account',
        'cheque_details',
        'online_transfer_details',
        'bank_charge_details',
      ],
    });
    if (!transaction) throw new NotFoundException('Transaction not found.');
    return transaction;
  }

  // 4. Update a transaction (parent and child)
  async update(
    id: number,
    updateDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id);

    // update parent fields
    Object.assign(transaction, updateDto);

    // Update child details (optional, can expand based on your update DTO design)
    // (left for step-by-step based on your use case)

    return await this.transactionRepository.save(transaction);
  }

  // 5. Remove a transaction
  async remove(id: number): Promise<void> {
    const transaction = await this.findOne(id);

    // If this is an internal transfer, also delete the corresponding cash_deposit in the to_account
    if (
      transaction.transaction_type === TransactionType.INTERNAL_TRANSFER &&
      transaction.to_account &&
      transaction.status === TransactionStatus.COMPLETED
    ) {
      // Find the corresponding cash_deposit transaction in the to_account
      const depositTx = await this.transactionRepository.findOne({
        where: {
          transaction_type: TransactionType.CASH_DEPOSIT,
          account: { id: transaction.to_account.id },
          amount: transaction.amount,
          status: TransactionStatus.COMPLETED,
          transaction_date: transaction.transaction_date,
          // Use a LIKE query to match the description prefix (in case account name changes)
          description: Like(
            `[Internal Transfer]%${transaction.account.account_name || transaction.account.id}%`,
          ),
        },
        relations: ['account'],
      });
      if (depositTx) {
        await this.transactionRepository.remove(depositTx);
      }
    }

    await this.transactionRepository.remove(transaction); // cascades to child details
  }

  // Optionally: Add filters, search, by type, by account, etc.

  /**
   * List transactions for a specific account.
   * @param accountId The ID of the account to filter transactions by.
   */
  async findByAccount(accountId: number): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { account: { id: accountId } },
      relations: [
        'account',
        'recipient',
        'to_account',
        'cheque_details',
        'online_transfer_details',
        'bank_charge_details',
      ],
    });
  }
}
