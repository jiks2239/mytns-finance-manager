import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transactions.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

import { ChequeTransactionDetails } from './cheque-transaction-details.entity';
import { OnlineTransferDetails } from './online-transfer-details.entity';
import { BankChargeDetails } from './bank-charge-details.entity';

import { Account } from '../accounts/accounts.entity';
import { Recipient } from '../recipients/recipients.entity';

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
    const account = await this.accountRepository.findOne({ where: { id: createDto.account_id } });
    if (!account) throw new NotFoundException('Account not found.');

    let recipient: Recipient | undefined;
    if (createDto.recipient_id) {
      recipient = await this.recipientRepository.findOne({ where: { id: createDto.recipient_id } });
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
    if (createDto.transaction_type === 'online' && createDto.online_transfer_details) {
      const onlineDetails = this.onlineDetailsRepository.create({
        ...createDto.online_transfer_details,
        transaction,
      });
      transaction.online_transfer_details = onlineDetails;
    }
    // (c) Bank charge
    if (createDto.transaction_type === 'bank_charge' && createDto.bank_charge_details) {
      const chargeDetails = this.chargeDetailsRepository.create({
        ...createDto.bank_charge_details,
        transaction,
      });
      transaction.bank_charge_details = chargeDetails;
    }

    // 1.4 Save transaction (cascade saves child details)
    return await this.transactionRepository.save(transaction);
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
  async update(id: number, updateDto: UpdateTransactionDto): Promise<Transaction> {
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
    await this.transactionRepository.remove(transaction); // cascades to child details
  }

  // Optionally: Add filters, search, by type, by account, etc.
}