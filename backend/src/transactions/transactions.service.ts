import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Transaction } from './transactions.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

import { ChequeTransactionDetails } from './cheque-transaction-details.entity';
import { OnlineTransferDetails } from './online-transfer-details.entity';
import { BankChargeDetails } from './bank-charge-details.entity';
import { CashDepositDetails } from './cash-deposit-details.entity';
import { BankTransferDetails } from './bank-transfer-details.entity';
import { UpiSettlementDetails } from './upi-settlement-details.entity';
import { AccountTransferDetails } from './account-transfer-details.entity';

import { Account } from '../accounts/accounts.entity';
import { Recipient } from '../recipients/recipients.entity';
import {
  TransactionType,
  TransactionStatus,
  TransactionDirection,
} from './transactions.enums';

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
    @InjectRepository(CashDepositDetails)
    private readonly cashDepositDetailsRepository: Repository<CashDepositDetails>,
    @InjectRepository(BankTransferDetails)
    private readonly bankTransferDetailsRepository: Repository<BankTransferDetails>,
    @InjectRepository(UpiSettlementDetails)
    private readonly upiSettlementDetailsRepository: Repository<UpiSettlementDetails>,
    @InjectRepository(AccountTransferDetails)
    private readonly accountTransferDetailsRepository: Repository<AccountTransferDetails>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Recipient)
    private readonly recipientRepository: Repository<Recipient>,
  ) {}

  // Helper method to determine transaction direction based on type
  private getTransactionDirection(
    transactionType: TransactionType,
  ): TransactionDirection {
    const creditTypes = [
      TransactionType.CASH_DEPOSIT,
      TransactionType.CHEQUE_RECEIVED,
      TransactionType.BANK_TRANSFER_IN,
      TransactionType.UPI_SETTLEMENT,
    ];

    const debitTypes = [
      TransactionType.CHEQUE_GIVEN,
      TransactionType.BANK_TRANSFER_OUT,
      TransactionType.ACCOUNT_TRANSFER,
      TransactionType.BANK_CHARGE,
    ];

    if (creditTypes.includes(transactionType)) {
      return TransactionDirection.CREDIT;
    } else if (debitTypes.includes(transactionType)) {
      return TransactionDirection.DEBIT;
    }

    // For legacy types, default to debit
    return TransactionDirection.DEBIT;
  }

  // Validation method for transaction creation
  private validateTransactionData(createDto: CreateTransactionDto): void {
    const { transaction_type } = createDto;

    // Validate transaction dates based on status
    this.validateTransactionDate(createDto);

    // Validate required detail objects based on transaction type
    switch (transaction_type) {
      case TransactionType.CASH_DEPOSIT:
        if (!createDto.cash_deposit_details) {
          throw new BadRequestException(
            'Cash deposit details are required for cash deposit transactions',
          );
        }
        // Validate cash deposit date for completed transactions
        this.validateCashDepositDate(createDto);
        break;
      case TransactionType.CHEQUE_RECEIVED:
      case TransactionType.CHEQUE_GIVEN:
        if (!createDto.cheque_details) {
          throw new BadRequestException(
            'Cheque details are required for cheque transactions',
          );
        }
        // Validate recipient is required for cheque transactions
        if (!createDto.recipient_id) {
          throw new BadRequestException(
            'Recipient is required for cheque transactions. Please specify who the cheque is from/to.',
          );
        }
        // Validate cheque dates
        this.validateChequeDates(createDto.cheque_details);
        break;
      case TransactionType.BANK_TRANSFER_IN:
      case TransactionType.BANK_TRANSFER_OUT:
        if (!createDto.bank_transfer_details) {
          throw new BadRequestException(
            'Bank transfer details are required for bank transfer transactions',
          );
        }
        // Validate recipient is required for bank transfer transactions
        if (!createDto.recipient_id) {
          throw new BadRequestException(
            'Recipient is required for bank transfer transactions. Please specify who the transfer is from/to.',
          );
        }
        break;
      case TransactionType.UPI_SETTLEMENT:
        if (!createDto.upi_settlement_details) {
          throw new BadRequestException(
            'UPI settlement details are required for UPI settlement transactions',
          );
        }
        break;
      case TransactionType.ACCOUNT_TRANSFER:
        if (!createDto.account_transfer_details) {
          throw new BadRequestException(
            'Please provide transfer details (transfer date, reference, etc.) for this account transfer',
          );
        }
        if (!createDto.to_account_id) {
          throw new BadRequestException(
            'Please select the destination account where you want to transfer the money',
          );
        }
        break;
      case TransactionType.BANK_CHARGE:
        if (!createDto.bank_charge_details) {
          throw new BadRequestException(
            'Please provide the bank charge details for this transaction',
          );
        }
        break;
    }
  }

  // Validate transaction date based on status
  private validateTransactionDate(createDto: CreateTransactionDto): void {
    const { status, transaction_date } = createDto;

    console.log(
      `[DEBUG] Validating transaction date: ${transaction_date}, status: ${status}`,
    );

    if (!transaction_date || !status) {
      console.log(`[DEBUG] Skipping validation - missing date or status`);
      return; // Let other validators handle missing values
    }

    const transactionDate = new Date(transaction_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    console.log(
      `[DEBUG] Transaction date: ${transactionDate}, Today: ${today}`,
    );

    // Completed statuses should have dates in the past or today
    const completedStatuses = [
      TransactionStatus.DEPOSITED,
      TransactionStatus.CLEARED,
      TransactionStatus.SETTLED,
      TransactionStatus.TRANSFERRED,
      TransactionStatus.DEBITED,
      TransactionStatus.RECEIVED,
      TransactionStatus.CANCELLED,
    ];

    if (completedStatuses.includes(status) && transactionDate > today) {
      console.log(
        `[DEBUG] VALIDATION ERROR: Future date for completed transaction`,
      );
      throw new BadRequestException(
        `Transaction date cannot be in the future when status is "${status}". Completed transactions must have a date in the past or today.`,
      );
    }

    console.log(`[DEBUG] Transaction date validation passed`);
  }

  // Validate cash deposit date for completed transactions
  private validateCashDepositDate(createDto: CreateTransactionDto): void {
    const { status, cash_deposit_details } = createDto;

    if (!cash_deposit_details?.deposit_date || !status) {
      return;
    }

    const depositDate = new Date(cash_deposit_details.deposit_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Completed statuses should have deposit dates in the past or today
    const completedStatuses = [
      TransactionStatus.DEPOSITED,
      TransactionStatus.CLEARED,
      TransactionStatus.SETTLED,
      TransactionStatus.TRANSFERRED,
      TransactionStatus.DEBITED,
      TransactionStatus.RECEIVED,
      TransactionStatus.CANCELLED,
    ];

    if (completedStatuses.includes(status) && depositDate > today) {
      throw new BadRequestException(
        `Deposit date cannot be in the future when transaction status is "${status}". Completed transactions must have deposit dates in the past or today.`,
      );
    }
  }

  // Validate cheque transaction dates and required fields
  private validateChequeDates(chequeDetails: any): void {
    // Validate required fields
    if (
      !chequeDetails.cheque_number ||
      chequeDetails.cheque_number.trim() === ''
    ) {
      throw new BadRequestException(
        'Cheque number is required for cheque transactions',
      );
    }

    if (!chequeDetails.cheque_due_date) {
      throw new BadRequestException(
        'Cheque due date is required for cheque transactions',
      );
    }

    const { cheque_due_date, cheque_cleared_date } = chequeDetails;

    // If both due date and cleared date are provided, validate that cleared date is not before due date
    if (cheque_due_date && cheque_cleared_date) {
      const dueDate = new Date(cheque_due_date);
      const clearedDate = new Date(cheque_cleared_date);

      // Reset time to midnight for date-only comparison
      dueDate.setHours(0, 0, 0, 0);
      clearedDate.setHours(0, 0, 0, 0);

      if (clearedDate < dueDate) {
        throw new BadRequestException(
          'Cheque cleared date cannot be before the due date',
        );
      }
    }
  }

  // Method to validate status transitions based on transaction type and direction
  private validateStatusTransition(
    transactionType: TransactionType,
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus,
  ): boolean {
    const validTransitions: Record<TransactionType, TransactionStatus[]> = {
      // Credit transactions
      [TransactionType.CASH_DEPOSIT]: [
        TransactionStatus.PENDING,
        TransactionStatus.DEPOSITED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.CHEQUE_RECEIVED]: [
        TransactionStatus.PENDING,
        TransactionStatus.CLEARED,
        TransactionStatus.BOUNCED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.BANK_TRANSFER_IN]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.FAILED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.UPI_SETTLEMENT]: [
        TransactionStatus.PENDING,
        TransactionStatus.SETTLED,
        TransactionStatus.FAILED,
        TransactionStatus.CANCELLED,
      ],

      // Debit transactions
      [TransactionType.CHEQUE_GIVEN]: [
        TransactionStatus.PENDING,
        TransactionStatus.CLEARED,
        TransactionStatus.BOUNCED,
        TransactionStatus.STOPPED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.BANK_TRANSFER_OUT]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.FAILED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.ACCOUNT_TRANSFER]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.BANK_CHARGE]: [
        TransactionStatus.PENDING,
        TransactionStatus.DEBITED,
        TransactionStatus.CANCELLED,
      ],

      // Legacy types
      [TransactionType.CHEQUE]: [
        TransactionStatus.PENDING,
        TransactionStatus.CLEARED,
        TransactionStatus.BOUNCED,
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.ONLINE]: [
        TransactionStatus.PENDING,
        TransactionStatus.COMPLETED,
        TransactionStatus.FAILED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.INTERNAL_TRANSFER]: [
        TransactionStatus.PENDING,
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.OTHER]: [
        TransactionStatus.PENDING,
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED,
      ],
    };

    const allowedStatuses = validTransitions[transactionType] || [];
    return allowedStatuses.includes(newStatus);
  }

  // 1. Create a new transaction (with optional child details)
  async create(createDto: CreateTransactionDto): Promise<Transaction> {
    // 1.1 Validate transaction data
    this.validateTransactionData(createDto);

    // 1.2 Validate required related entities (account, recipient, etc.)
    const account = await this.accountRepository.findOne({
      where: { id: createDto.account_id },
    });
    if (!account) throw new NotFoundException('Account not found.');

    console.log(
      `[DEBUG] Found account ${account.id} with current_balance: ${account.current_balance}`,
    );

    let recipient: Recipient | undefined;
    if (createDto.recipient_id) {
      recipient = await this.recipientRepository.findOne({
        where: { id: createDto.recipient_id },
      });
      if (!recipient) throw new NotFoundException('Recipient not found.');

      // CRITICAL: Validate that recipient belongs to the same account as the transaction
      if (recipient.account_id !== createDto.account_id) {
        throw new BadRequestException(
          `Invalid recipient. The selected recipient "${recipient.name}" belongs to a different account. Please select a recipient that belongs to the same account as this transaction.`,
        );
      }
    } else if (createDto.transaction_type === TransactionType.CASH_DEPOSIT) {
      // For cash deposits without a recipient, auto-assign "Self" recipient
      recipient = await this.recipientRepository.findOne({
        where: {
          account_id: createDto.account_id,
          recipient_type: 'owner' as any,
        },
      });
      if (!recipient) {
        throw new BadRequestException(
          'Self recipient not found for this account. Please contact support.',
        );
      }
    }

    // 1.3 For account transfers, validate destination account
    let toAccount: Account | undefined;
    if (createDto.to_account_id) {
      toAccount = await this.accountRepository.findOne({
        where: { id: createDto.to_account_id },
      });
      if (!toAccount)
        throw new NotFoundException('Destination account not found.');

      // Prevent self-transfers
      if (createDto.account_id === createDto.to_account_id) {
        throw new BadRequestException(
          'You cannot transfer money to the same account. Please select a different destination account',
        );
      }
    }

    // 1.4 Determine transaction direction
    const transactionDirection = this.getTransactionDirection(
      createDto.transaction_type,
    );

    // 1.4.1 Validate balance for debit transactions
    if (
      transactionDirection === TransactionDirection.DEBIT &&
      this.shouldUpdateBalance(createDto.status)
    ) {
      const currentBalance = parseFloat(account.current_balance.toString());
      if (createDto.amount > currentBalance) {
        throw new BadRequestException(
          `Insufficient balance. Current balance: ${currentBalance.toFixed(2)}, Transaction amount: ${createDto.amount.toFixed(2)}`,
        );
      }
    }

    // 1.5 Create transaction entity
    const transaction = this.transactionRepository.create({
      transaction_type: createDto.transaction_type,
      transaction_direction: transactionDirection,
      amount: createDto.amount,
      account,
      recipient,
      to_account: toAccount,
      status: createDto.status,
      description: createDto.description,
      transaction_date: createDto.transaction_date || new Date(), // Default to current date if not provided
    });

    // 1.6 Save transaction first
    const savedTransaction = await this.transactionRepository.save(transaction);

    // 1.7 Handle child detail entities based on type
    await this.createTransactionDetails(savedTransaction, createDto);

    // 1.8 Update account balance based on transaction direction (only for completed transactions)
    if (this.shouldUpdateBalance(createDto.status)) {
      await this.updateAccountBalance(
        account,
        transactionDirection,
        createDto.amount,
      );
    }

    // 1.9 Handle account transfer logic (create credit transaction in destination account)
    if (
      createDto.transaction_type === TransactionType.ACCOUNT_TRANSFER &&
      toAccount &&
      (createDto.status === TransactionStatus.TRANSFERRED ||
        createDto.status === TransactionStatus.COMPLETED)
    ) {
      await this.createCreditTransactionForAccountTransfer(
        savedTransaction,
        toAccount,
        account,
      );
    }

    return savedTransaction;
  }

  // Helper method to determine if balance should be updated based on status
  private shouldUpdateBalance(status: TransactionStatus): boolean {
    // Only update balance for confirmed/completed transactions
    const balanceUpdateStatuses = [
      TransactionStatus.DEPOSITED,
      TransactionStatus.CLEARED,
      TransactionStatus.TRANSFERRED,
      TransactionStatus.SETTLED,
      TransactionStatus.DEBITED,
      TransactionStatus.COMPLETED,
    ];
    return balanceUpdateStatuses.includes(status);
  }

  // Helper method to update account balance
  private async updateAccountBalance(
    account: Account,
    transactionDirection: TransactionDirection,
    amount: number,
  ): Promise<void> {
    const currentBalance = Number(account.current_balance) || 0;
    const transactionAmount = Number(amount) || 0;

    if (transactionDirection === TransactionDirection.CREDIT) {
      account.current_balance = currentBalance + transactionAmount;
    } else if (transactionDirection === TransactionDirection.DEBIT) {
      account.current_balance = currentBalance - transactionAmount;
    }

    await this.accountRepository.save(account);
  }

  // Helper method to create transaction detail entities
  private async createTransactionDetails(
    transaction: Transaction,
    createDto: CreateTransactionDto,
  ): Promise<void> {
    switch (createDto.transaction_type) {
      case TransactionType.CASH_DEPOSIT:
        if (createDto.cash_deposit_details) {
          const details = this.cashDepositDetailsRepository.create({
            deposit_date: new Date(createDto.cash_deposit_details.deposit_date),
            notes: createDto.cash_deposit_details.notes,
            transaction,
          });
          await this.cashDepositDetailsRepository.save(details);
        }
        break;

      case TransactionType.CHEQUE_RECEIVED:
      case TransactionType.CHEQUE_GIVEN:
        if (createDto.cheque_details) {
          const details = this.chequeDetailsRepository.create({
            cheque_number: createDto.cheque_details.cheque_number,
            cheque_given_date: createDto.cheque_details.cheque_given_date
              ? new Date(createDto.cheque_details.cheque_given_date)
              : undefined,
            cheque_due_date: createDto.cheque_details.cheque_due_date
              ? new Date(createDto.cheque_details.cheque_due_date)
              : undefined,
            cheque_cleared_date: createDto.cheque_details.cheque_cleared_date
              ? new Date(createDto.cheque_details.cheque_cleared_date)
              : undefined,
            notes: createDto.cheque_details.notes,
            transaction,
          });
          await this.chequeDetailsRepository.save(details);
        }
        break;

      case TransactionType.BANK_TRANSFER_IN:
      case TransactionType.BANK_TRANSFER_OUT:
        if (createDto.bank_transfer_details) {
          const details = this.bankTransferDetailsRepository.create({
            transfer_date: new Date(
              createDto.bank_transfer_details.transfer_date,
            ),
            settlement_date: createDto.bank_transfer_details.settlement_date
              ? new Date(createDto.bank_transfer_details.settlement_date)
              : undefined,
            transfer_mode: createDto.bank_transfer_details.transfer_mode,
            reference_number: createDto.bank_transfer_details.reference_number,
            notes: createDto.bank_transfer_details.notes,
            transaction,
          });
          await this.bankTransferDetailsRepository.save(details);
        }
        break;

      case TransactionType.UPI_SETTLEMENT:
        if (createDto.upi_settlement_details) {
          const details = this.upiSettlementDetailsRepository.create({
            settlement_date: new Date(
              createDto.upi_settlement_details.settlement_date,
            ),
            upi_reference_number:
              createDto.upi_settlement_details.upi_reference_number,
            batch_number: createDto.upi_settlement_details.batch_number,
            notes: createDto.upi_settlement_details.notes,
            transaction,
          });
          await this.upiSettlementDetailsRepository.save(details);
        }
        break;

      case TransactionType.ACCOUNT_TRANSFER:
        if (createDto.account_transfer_details) {
          const details = this.accountTransferDetailsRepository.create({
            transfer_date: new Date(
              createDto.account_transfer_details.transfer_date,
            ),
            transfer_reference:
              createDto.account_transfer_details.transfer_reference,
            purpose: createDto.account_transfer_details.purpose,
            notes: createDto.account_transfer_details.notes,
            transaction,
          });
          await this.accountTransferDetailsRepository.save(details);
        }
        break;

      case TransactionType.BANK_CHARGE:
        if (createDto.bank_charge_details) {
          const details = this.chargeDetailsRepository.create({
            charge_type: createDto.bank_charge_details.charge_type,
            charge_date: new Date(createDto.bank_charge_details.charge_date),
            notes: createDto.bank_charge_details.notes,
            transaction,
          });
          await this.chargeDetailsRepository.save(details);
        }
        break;

      // Legacy support
      case TransactionType.CHEQUE:
        if (createDto.cheque_details) {
          const details = this.chequeDetailsRepository.create({
            ...createDto.cheque_details,
            transaction,
          });
          await this.chequeDetailsRepository.save(details);
        }
        break;

      case TransactionType.ONLINE:
        if (createDto.online_transfer_details) {
          const { transfer_date } = createDto.online_transfer_details;
          if (transfer_date && String(transfer_date).trim() !== '') {
            const details = this.onlineDetailsRepository.create({
              transfer_date,
              transaction,
            });
            await this.onlineDetailsRepository.save(details);
          }
        }
        break;
    }
  }

  // Helper method to update transaction detail entities
  private async updateTransactionDetails(
    transaction: Transaction,
    updateDto: UpdateTransactionDto,
  ): Promise<void> {
    // Update bank transfer details
    if (updateDto.bank_transfer_details && transaction.bank_transfer_details) {
      // Update fields only if provided in updateDto
      if (updateDto.bank_transfer_details.transfer_date !== undefined) {
        transaction.bank_transfer_details.transfer_date = new Date(
          updateDto.bank_transfer_details.transfer_date,
        );
      }
      if (updateDto.bank_transfer_details.settlement_date !== undefined) {
        transaction.bank_transfer_details.settlement_date = new Date(
          updateDto.bank_transfer_details.settlement_date,
        );
      }
      if (updateDto.bank_transfer_details.transfer_mode !== undefined) {
        transaction.bank_transfer_details.transfer_mode =
          updateDto.bank_transfer_details.transfer_mode;
      }
      if (updateDto.bank_transfer_details.reference_number !== undefined) {
        transaction.bank_transfer_details.reference_number =
          updateDto.bank_transfer_details.reference_number;
      }
      if (updateDto.bank_transfer_details.notes !== undefined) {
        transaction.bank_transfer_details.notes =
          updateDto.bank_transfer_details.notes;
      }
      await this.bankTransferDetailsRepository.save(
        transaction.bank_transfer_details,
      );
    }

    // Update cheque details
    if (updateDto.cheque_details && transaction.cheque_details) {
      if (updateDto.cheque_details.cheque_number !== undefined) {
        transaction.cheque_details.cheque_number =
          updateDto.cheque_details.cheque_number;
      }
      if (updateDto.cheque_details.cheque_given_date !== undefined) {
        transaction.cheque_details.cheque_given_date = new Date(
          updateDto.cheque_details.cheque_given_date,
        );
      }
      if (updateDto.cheque_details.cheque_due_date !== undefined) {
        transaction.cheque_details.cheque_due_date = new Date(
          updateDto.cheque_details.cheque_due_date,
        );
      }
      if (updateDto.cheque_details.cheque_cleared_date !== undefined) {
        transaction.cheque_details.cheque_cleared_date = new Date(
          updateDto.cheque_details.cheque_cleared_date,
        );
      }
      if (updateDto.cheque_details.notes !== undefined) {
        transaction.cheque_details.notes = updateDto.cheque_details.notes;
      }
      await this.chequeDetailsRepository.save(transaction.cheque_details);
    }

    // Update cash deposit details
    if (updateDto.cash_deposit_details && transaction.cash_deposit_details) {
      if (updateDto.cash_deposit_details.deposit_date !== undefined) {
        transaction.cash_deposit_details.deposit_date = new Date(
          updateDto.cash_deposit_details.deposit_date,
        );
      }
      if (updateDto.cash_deposit_details.notes !== undefined) {
        transaction.cash_deposit_details.notes =
          updateDto.cash_deposit_details.notes;
      }
      await this.cashDepositDetailsRepository.save(
        transaction.cash_deposit_details,
      );
    }

    // Update UPI settlement details
    if (
      updateDto.upi_settlement_details &&
      transaction.upi_settlement_details
    ) {
      if (updateDto.upi_settlement_details.settlement_date !== undefined) {
        transaction.upi_settlement_details.settlement_date = new Date(
          updateDto.upi_settlement_details.settlement_date,
        );
      }
      if (updateDto.upi_settlement_details.upi_reference_number !== undefined) {
        transaction.upi_settlement_details.upi_reference_number =
          updateDto.upi_settlement_details.upi_reference_number;
      }
      if (updateDto.upi_settlement_details.batch_number !== undefined) {
        transaction.upi_settlement_details.batch_number =
          updateDto.upi_settlement_details.batch_number;
      }
      if (updateDto.upi_settlement_details.notes !== undefined) {
        transaction.upi_settlement_details.notes =
          updateDto.upi_settlement_details.notes;
      }
      await this.upiSettlementDetailsRepository.save(
        transaction.upi_settlement_details,
      );
    }

    // Update account transfer details
    if (
      updateDto.account_transfer_details &&
      transaction.account_transfer_details
    ) {
      if (updateDto.account_transfer_details.transfer_date !== undefined) {
        transaction.account_transfer_details.transfer_date = new Date(
          updateDto.account_transfer_details.transfer_date,
        );
      }
      if (updateDto.account_transfer_details.transfer_reference !== undefined) {
        transaction.account_transfer_details.transfer_reference =
          updateDto.account_transfer_details.transfer_reference;
      }
      if (updateDto.account_transfer_details.purpose !== undefined) {
        transaction.account_transfer_details.purpose =
          updateDto.account_transfer_details.purpose;
      }
      if (updateDto.account_transfer_details.notes !== undefined) {
        transaction.account_transfer_details.notes =
          updateDto.account_transfer_details.notes;
      }
      await this.accountTransferDetailsRepository.save(
        transaction.account_transfer_details,
      );
    }

    // Update bank charge details
    if (updateDto.bank_charge_details && transaction.bank_charge_details) {
      if (updateDto.bank_charge_details.charge_type !== undefined) {
        transaction.bank_charge_details.charge_type =
          updateDto.bank_charge_details.charge_type;
      }
      if (updateDto.bank_charge_details.charge_date !== undefined) {
        transaction.bank_charge_details.charge_date = new Date(
          updateDto.bank_charge_details.charge_date,
        );
      }
      if (updateDto.bank_charge_details.notes !== undefined) {
        transaction.bank_charge_details.notes =
          updateDto.bank_charge_details.notes;
      }
      await this.chargeDetailsRepository.save(transaction.bank_charge_details);
    }
  }

  // Helper method to create credit transaction for account transfer
  private async createCreditTransactionForAccountTransfer(
    originalTransaction: Transaction,
    toAccount: Account,
    fromAccount: Account,
  ): Promise<void> {
    const creditTransaction = this.transactionRepository.create({
      transaction_type: TransactionType.CASH_DEPOSIT,
      transaction_direction: TransactionDirection.CREDIT,
      amount: originalTransaction.amount,
      account: toAccount,
      status: TransactionStatus.DEPOSITED,
      description: `[Account Transfer] from ${fromAccount.account_name || fromAccount.id}`,
      transaction_date: originalTransaction.transaction_date,
      parent_transaction: originalTransaction, // Link to parent transaction
    });

    // Save the credit transaction first
    await this.transactionRepository.save(creditTransaction);

    // Update destination account balance (account transfers are immediately completed)
    await this.updateAccountBalance(
      toAccount,
      TransactionDirection.CREDIT,
      originalTransaction.amount,
    );

    // Add cash deposit details for the credit transaction
    const depositDetails = this.cashDepositDetailsRepository.create({
      deposit_date: originalTransaction.transaction_date || new Date(),
      notes: `Automatic credit from account transfer (Ref: ${originalTransaction.id})`,
      transaction: creditTransaction,
    });
    await this.cashDepositDetailsRepository.save(depositDetails);
  }

  // Helper method to update child transactions when parent is updated
  private async updateChildTransactions(
    parentTransaction: Transaction,
    updateDto: UpdateTransactionDto,
  ): Promise<void> {
    // Find child transactions
    const childTransactions = await this.transactionRepository.find({
      where: { parent_transaction_id: parentTransaction.id },
      relations: ['account', 'cash_deposit_details'],
    });

    for (const child of childTransactions) {
      // Update relevant fields from parent
      const childUpdateData: Partial<Transaction> = {
        amount:
          updateDto.amount !== undefined ? updateDto.amount : child.amount,
        description:
          updateDto.description !== undefined
            ? `[Account Transfer] from ${
                parentTransaction.account.account_name ||
                parentTransaction.account.id
              }`
            : child.description,
        transaction_date:
          updateDto.transaction_date !== undefined
            ? new Date(updateDto.transaction_date)
            : child.transaction_date,
      };

      // Update the child transaction
      Object.assign(child, childUpdateData);
      await this.transactionRepository.save(child);

      // Update cash deposit details if they exist
      if (child.cash_deposit_details) {
        child.cash_deposit_details.deposit_date =
          childUpdateData.transaction_date ||
          child.cash_deposit_details.deposit_date;
        child.cash_deposit_details.notes = `Automatic credit from account transfer (Ref: ${parentTransaction.id})`;
        await this.cashDepositDetailsRepository.save(
          child.cash_deposit_details,
        );
      }

      // Handle balance adjustments if amount changed
      if (updateDto.amount !== undefined && updateDto.amount !== child.amount) {
        const amountDifference = updateDto.amount - (child.amount || 0);
        await this.updateAccountBalance(
          child.account,
          child.transaction_direction,
          amountDifference,
        );
      }
    }
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
        'cash_deposit_details',
        'bank_transfer_details',
        'upi_settlement_details',
        'account_transfer_details',
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
    if (!transaction) throw new NotFoundException('Transaction not found.');
    return transaction;
  }

  // Method to get transactions by account with optional filtering
  async findByAccount(
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

  // Method to get transaction statistics by account
  async getAccountTransactionStats(accountId: number): Promise<{
    totalCredits: number;
    totalDebits: number;
    pendingTransactions: number;
    completedTransactions: number;
    creditsByType: Record<string, number>;
    debitsByType: Record<string, number>;
  }> {
    const transactions = await this.findByAccount(accountId);

    let totalCredits = 0;
    let totalDebits = 0;
    let pendingTransactions = 0;
    let completedTransactions = 0;
    const creditsByType: Record<string, number> = {};
    const debitsByType: Record<string, number> = {};

    transactions.forEach((transaction) => {
      if (transaction.transaction_direction === TransactionDirection.CREDIT) {
        totalCredits += transaction.amount;
        creditsByType[transaction.transaction_type] =
          (creditsByType[transaction.transaction_type] || 0) +
          transaction.amount;
      } else {
        totalDebits += transaction.amount;
        debitsByType[transaction.transaction_type] =
          (debitsByType[transaction.transaction_type] || 0) +
          transaction.amount;
      }

      if (transaction.status === TransactionStatus.PENDING) {
        pendingTransactions++;
      } else {
        completedTransactions++;
      }
    });

    return {
      totalCredits,
      totalDebits,
      pendingTransactions,
      completedTransactions,
      creditsByType,
      debitsByType,
    };
  }

  // 4. Update a transaction (parent and child)
  async update(
    id: number,
    updateDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id);
    const oldStatus = transaction.status;

    // Handle recipient update
    if (updateDto.recipient_id !== undefined) {
      if (updateDto.recipient_id) {
        // Validate new recipient exists
        const recipient = await this.recipientRepository.findOne({
          where: { id: updateDto.recipient_id },
        });
        if (!recipient) {
          throw new BadRequestException('Recipient not found.');
        }

        // CRITICAL: Validate that recipient belongs to the same account as the transaction
        if (recipient.account_id !== transaction.account.id) {
          throw new BadRequestException(
            `Invalid recipient. The selected recipient "${recipient.name}" belongs to a different account. Please select a recipient that belongs to the same account as this transaction.`,
          );
        }

        transaction.recipient = recipient;
      } else {
        // Clear recipient if set to null/undefined
        transaction.recipient = null;
      }
    }

    // Validate transaction data if being updated
    if (updateDto.cheque_details) {
      this.validateChequeDates(updateDto.cheque_details);
    }

    // Validate recipient requirements for transaction types that require them
    const finalTransactionType =
      updateDto.transaction_type || transaction.transaction_type;
    const finalRecipientId =
      updateDto.recipient_id !== undefined
        ? updateDto.recipient_id
        : transaction.recipient?.id;

    if (
      (finalTransactionType === TransactionType.CHEQUE_RECEIVED ||
        finalTransactionType === TransactionType.CHEQUE_GIVEN) &&
      !finalRecipientId
    ) {
      throw new BadRequestException(
        'Recipient is required for cheque transactions. Please specify who the cheque is from/to.',
      );
    }

    if (
      (finalTransactionType === TransactionType.BANK_TRANSFER_IN ||
        finalTransactionType === TransactionType.BANK_TRANSFER_OUT) &&
      !finalRecipientId
    ) {
      throw new BadRequestException(
        'Recipient is required for bank transfer transactions. Please specify who the transfer is from/to.',
      );
    }

    // Validate transaction date against status (for updates)
    if (updateDto.status || updateDto.transaction_date) {
      // Create a merged object for validation that combines existing and updated values
      const mergedData = {
        ...transaction,
        ...updateDto,
        // Use updated status if provided, otherwise use existing status
        status: updateDto.status || transaction.status,
        // Use updated transaction_date if provided, otherwise use existing date
        transaction_date:
          updateDto.transaction_date || transaction.transaction_date,
      };

      // Validate transaction date
      this.validateTransactionDate(mergedData as any);
    }

    // Update parent fields (exclude nested details that are handled separately)
    const excludedFields = [
      'bank_transfer_details',
      'cheque_details',
      'cash_deposit_details',
      'upi_settlement_details',
      'online_transfer_details',
      'bank_charge_details',
      'account_transfer_details',
    ];

    const mainTransactionFields = Object.fromEntries(
      Object.entries(updateDto).filter(
        ([key]) => !excludedFields.includes(key),
      ),
    );

    Object.assign(transaction, mainTransactionFields);

    // Auto-sync cash deposit details with transaction date
    if (updateDto.transaction_date && transaction.cash_deposit_details) {
      transaction.cash_deposit_details.deposit_date = new Date(
        updateDto.transaction_date,
      );
      await this.cashDepositDetailsRepository.save(
        transaction.cash_deposit_details,
      );
    }

    // Handle updating nested transaction details
    await this.updateTransactionDetails(transaction, updateDto);

    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    // Update child transactions if this is a parent transaction
    await this.updateChildTransactions(updatedTransaction, updateDto);

    // Handle balance updates if status changed
    if (oldStatus !== updateDto.status && updateDto.status) {
      const account = transaction.account;

      // If transaction is now complete and wasn't before
      if (
        this.shouldUpdateBalance(updateDto.status) &&
        !this.shouldUpdateBalance(oldStatus)
      ) {
        await this.updateAccountBalance(
          account,
          transaction.transaction_direction,
          transaction.amount,
        );

        // Special handling for account transfers: create credit transaction in destination account
        if (
          transaction.transaction_type === TransactionType.ACCOUNT_TRANSFER &&
          transaction.to_account &&
          updateDto.status === TransactionStatus.TRANSFERRED &&
          oldStatus !== TransactionStatus.TRANSFERRED
        ) {
          await this.createCreditTransactionForAccountTransfer(
            transaction,
            transaction.to_account,
            account,
          );
        }
      }
      // If transaction was complete but now isn't (reversal)
      else if (
        !this.shouldUpdateBalance(updateDto.status) &&
        this.shouldUpdateBalance(oldStatus)
      ) {
        // Reverse the balance update
        const reverseDirection =
          transaction.transaction_direction === TransactionDirection.CREDIT
            ? TransactionDirection.DEBIT
            : TransactionDirection.CREDIT;
        await this.updateAccountBalance(
          account,
          reverseDirection,
          transaction.amount,
        );

        // Special handling for account transfer reversal: remove credit transaction from destination account
        if (
          transaction.transaction_type === TransactionType.ACCOUNT_TRANSFER &&
          transaction.to_account &&
          oldStatus === TransactionStatus.TRANSFERRED
        ) {
          // Find and remove the corresponding cash_deposit transaction
          const depositTx = await this.transactionRepository.findOne({
            where: {
              transaction_type: TransactionType.CASH_DEPOSIT,
              account: { id: transaction.to_account.id },
              amount: transaction.amount,
              status: TransactionStatus.DEPOSITED,
              transaction_date: transaction.transaction_date,
              description: Like(
                `[Account Transfer] from ${transaction.account.account_name || transaction.account.id}%`,
              ),
            },
            relations: ['account'],
          });

          if (depositTx) {
            // Reverse the balance in the destination account
            await this.updateAccountBalance(
              depositTx.account,
              TransactionDirection.DEBIT,
              depositTx.amount,
            );
            await this.transactionRepository.remove(depositTx);
          }
        }
      }
    }

    return updatedTransaction;
  }

  // 5. Remove a transaction
  async remove(id: number): Promise<void> {
    const transaction = await this.findOne(id);

    // First, handle child transactions (must be done before deleting parent)
    await this.removeChildTransactions(transaction);

    // Reverse balance update if transaction was completed
    if (this.shouldUpdateBalance(transaction.status)) {
      const reverseDirection =
        transaction.transaction_direction === TransactionDirection.CREDIT
          ? TransactionDirection.DEBIT
          : TransactionDirection.CREDIT;
      await this.updateAccountBalance(
        transaction.account,
        reverseDirection,
        transaction.amount,
      );
    }

    await this.transactionRepository.remove(transaction); // cascades to child details
  }

  // Helper method to remove child transactions when parent is deleted
  private async removeChildTransactions(
    parentTransaction: Transaction,
  ): Promise<void> {
    // Find and remove child transactions
    const childTransactions = await this.transactionRepository.find({
      where: { parent_transaction_id: parentTransaction.id },
      relations: ['account'],
    });

    for (const child of childTransactions) {
      // Reverse balance update if child transaction was completed
      if (this.shouldUpdateBalance(child.status)) {
        const reverseDirection =
          child.transaction_direction === TransactionDirection.CREDIT
            ? TransactionDirection.DEBIT
            : TransactionDirection.CREDIT;
        await this.updateAccountBalance(
          child.account,
          reverseDirection,
          child.amount,
        );
      }

      // Delete the child transaction (cascades to child details)
      await this.transactionRepository.remove(child);
    }
  }
}
