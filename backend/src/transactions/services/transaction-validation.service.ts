import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { TransactionType, TransactionStatus } from '../transactions.enums';
import { ChequeTransactionDetails } from '../cheque-transaction-details.entity';

@Injectable()
export class TransactionValidationService {
  constructor(
    @InjectRepository(ChequeTransactionDetails)
    private readonly chequeDetailsRepository: Repository<ChequeTransactionDetails>,
  ) {}

  /**
   * Main validation method for transaction creation
   */
  async validateTransactionData(
    createDto: CreateTransactionDto,
  ): Promise<void> {
    const { transaction_type } = createDto;

    // Validate transaction dates based on status
    this.validateTransactionDate(createDto);

    // Validate required detail objects based on transaction type
    switch (transaction_type) {
      // New enum values
      case TransactionType.DEPOSIT:
        if (!createDto.cash_deposit_details) {
          throw new BadRequestException(
            'Deposit details are required for deposit transactions',
          );
        }
        this.validateCashDepositDate(createDto);
        break;
      case TransactionType.TRANSFER:
        if (!createDto.bank_transfer_details) {
          throw new BadRequestException(
            'Transfer details are required for transfer transactions',
          );
        }
        if (!createDto.recipient_id) {
          throw new BadRequestException(
            'Recipient is required for transfer transactions. Please specify who the transfer is from.',
          );
        }
        this.validateBankTransferDates(
          createDto.bank_transfer_details,
          createDto.status,
        );
        break;
      case TransactionType.SETTLEMENT:
        if (!createDto.upi_settlement_details) {
          throw new BadRequestException(
            'Settlement details are required for settlement transactions',
          );
        }
        break;
      case TransactionType.NEFT:
      case TransactionType.IMPS:
      case TransactionType.RTGS:
      case TransactionType.UPI:
        if (!createDto.online_transfer_details) {
          throw new BadRequestException(
            'Online transfer details are required for online transfer transactions',
          );
        }
        if (!createDto.recipient_id) {
          throw new BadRequestException(
            'Recipient is required for transfer transactions. Please specify who the transfer is to.',
          );
        }
        this.validateOnlineTransferDates(
          createDto.online_transfer_details,
          createDto.status,
        );
        break;

      // Legacy enum values (maintained for backward compatibility)
      case TransactionType.CASH_DEPOSIT:
        if (!createDto.cash_deposit_details) {
          throw new BadRequestException(
            'Cash deposit details are required for cash deposit transactions',
          );
        }
        this.validateCashDepositDate(createDto);
        break;
      case TransactionType.CHEQUE_RECEIVED:
      case TransactionType.CHEQUE_GIVEN:
        if (!createDto.cheque_details) {
          throw new BadRequestException(
            'Cheque details are required for cheque transactions',
          );
        }
        if (!createDto.recipient_id) {
          throw new BadRequestException(
            'Recipient is required for cheque transactions. Please specify who the cheque is from/to.',
          );
        }
        this.validateChequeDates(createDto.cheque_details);
        await this.validateDuplicateChequeNumber(
          createDto.cheque_details.cheque_number,
        );
        // Validate status-specific requirements for cheques
        this.validateChequeStatusRequirements(
          createDto.cheque_details,
          createDto.status,
        );
        break;
      case TransactionType.BANK_TRANSFER_IN:
      case TransactionType.BANK_TRANSFER_OUT:
        if (!createDto.bank_transfer_details) {
          throw new BadRequestException(
            'Bank transfer details are required for bank transfer transactions',
          );
        }
        if (!createDto.recipient_id) {
          throw new BadRequestException(
            'Recipient is required for bank transfer transactions. Please specify who the transfer is from/to.',
          );
        }
        this.validateBankTransferDates(
          createDto.bank_transfer_details,
          createDto.status,
        );
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

  /**
   * Validate transaction date based on status
   */
  validateTransactionDate(createDto: CreateTransactionDto): void {
    const { status, transaction_date } = createDto;

    console.log(
      `[DEBUG] Validating transaction date: ${transaction_date}, status: ${status}`,
    );

    if (!transaction_date || !status) {
      console.log(`[DEBUG] Skipping validation - missing date or status`);
      return;
    }

    const transactionDate = new Date(transaction_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    console.log(
      `[DEBUG] Transaction date: ${transactionDate}, Today: ${today}`,
    );

    const completedStatuses = [
      TransactionStatus.DEPOSITED,
      TransactionStatus.CLEARED,
      TransactionStatus.SETTLED,
      TransactionStatus.TRANSFERRED,
      TransactionStatus.DEBITED,
      TransactionStatus.RECEIVED,
      TransactionStatus.SUBMITTED,
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

  /**
   * Validate cash deposit date for completed transactions
   */
  private validateCashDepositDate(createDto: CreateTransactionDto): void {
    const { status, cash_deposit_details } = createDto;

    if (!cash_deposit_details?.deposit_date || !status) {
      return;
    }

    const depositDate = new Date(cash_deposit_details.deposit_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const completedStatuses = [
      TransactionStatus.DEPOSITED,
      TransactionStatus.CLEARED,
      TransactionStatus.SETTLED,
      TransactionStatus.TRANSFERRED,
      TransactionStatus.DEBITED,
      TransactionStatus.RECEIVED,
      TransactionStatus.SUBMITTED,
      TransactionStatus.CANCELLED,
    ];

    if (completedStatuses.includes(status) && depositDate > today) {
      throw new BadRequestException(
        `Deposit date cannot be in the future when transaction status is "${status}". Completed transactions must have deposit dates in the past or today.`,
      );
    }
  }

  /**
   * Validate cheque transaction dates and required fields with enhanced validation
   */
  validateChequeDates(chequeDetails: any): void {
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

    // Enhanced validation for date sequence: issue_date <= due_date <= submitted_date <= cleared_date
    this.validateChequeDateSequence(chequeDetails);
  }

  /**
   * Validate cheque date sequence according to your requirements
   */
  private validateChequeDateSequence(chequeDetails: any): void {
    const {
      cheque_issue_date,
      cheque_due_date,
      cheque_submitted_date,
      cheque_cleared_date,
    } = chequeDetails;

    const dates = {
      issue: cheque_issue_date ? new Date(cheque_issue_date) : null,
      due: cheque_due_date ? new Date(cheque_due_date) : null,
      submitted: cheque_submitted_date ? new Date(cheque_submitted_date) : null,
      cleared: cheque_cleared_date ? new Date(cheque_cleared_date) : null,
    };

    // Reset hours for date-only comparison
    Object.values(dates).forEach((date) => {
      if (date) {
        date.setHours(0, 0, 0, 0);
      }
    });

    // Validation 1: Due date must be on or after issue date
    if (dates.issue && dates.due && dates.due < dates.issue) {
      throw new BadRequestException(
        'Cheque due date cannot be before the issue date',
      );
    }

    // Validation 2: Submitted date must be on or after due date
    if (dates.due && dates.submitted && dates.submitted < dates.due) {
      throw new BadRequestException(
        'Cheque submission date must be on or after the due date',
      );
    }

    // Validation 3: Cleared date must be on or after submitted date
    if (dates.submitted && dates.cleared && dates.cleared < dates.submitted) {
      throw new BadRequestException(
        'Cheque cleared date cannot be before the submission date',
      );
    }

    // Validation 4: If no submitted date but cleared date exists, cleared must be >= due date
    if (
      !dates.submitted &&
      dates.due &&
      dates.cleared &&
      dates.cleared < dates.due
    ) {
      throw new BadRequestException(
        'Cheque cleared date cannot be before the due date',
      );
    }
  }

  /**
   * Validate bank transfer dates and required fields
   */
  validateBankTransferDates(
    bankTransferDetails: any,
    status?: TransactionStatus,
  ): void {
    const { transfer_date, settlement_date } = bankTransferDetails;

    if (!transfer_date) {
      throw new BadRequestException(
        'Transfer date is required for bank transfer transactions',
      );
    }

    // Helper function to check if a date value is valid and meaningful
    const isValidDate = (dateValue: any): boolean => {
      if (!dateValue) return false;
      if (typeof dateValue === 'string') {
        // Check for common placeholder values
        const trimmed = dateValue.trim();
        if (
          trimmed === '' ||
          trimmed === 'dd/mm/yyyy' ||
          trimmed === 'mm/dd/yyyy' ||
          trimmed === 'yyyy-mm-dd' ||
          trimmed === 'null' ||
          trimmed === 'undefined'
        ) {
          return false;
        }
      }

      try {
        const date = new Date(dateValue);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    };

    const hasValidTransferDate = isValidDate(transfer_date);
    const hasValidSettlementDate = isValidDate(settlement_date);

    if (hasValidTransferDate && hasValidSettlementDate) {
      const transferDate = new Date(transfer_date);
      const settlementDate = new Date(settlement_date);

      transferDate.setHours(0, 0, 0, 0);
      settlementDate.setHours(0, 0, 0, 0);

      if (settlementDate < transferDate) {
        throw new BadRequestException(
          'Settlement date cannot be before the transfer date. A transfer must happen before it can be settled.',
        );
      }
    }

    if (status) {
      if (hasValidSettlementDate && status === TransactionStatus.PENDING) {
        throw new BadRequestException(
          'Transaction status cannot be "pending" when settlement date is provided. If the transfer has been settled, please update the status to "transferred".',
        );
      }

      if (!hasValidSettlementDate && status === TransactionStatus.TRANSFERRED) {
        throw new BadRequestException(
          'Settlement date is required when transaction status is "transferred". Please provide the settlement date.',
        );
      }
    }
  }

  /**
   * Validate online transfer dates for UPI/NEFT/IMPS/RTGS transactions
   */
  validateOnlineTransferDates(
    onlineTransferDetails: any,
    status?: TransactionStatus,
  ): void {
    const { transfer_date } = onlineTransferDetails;

    if (!transfer_date) {
      throw new BadRequestException(
        'Transfer date is required for online transfer transactions',
      );
    }

    // Helper function to check if a date value is valid and meaningful
    const isValidDate = (dateValue: any): boolean => {
      if (!dateValue) return false;
      if (typeof dateValue === 'string') {
        // Check for common placeholder values
        const trimmed = dateValue.trim();
        if (
          trimmed === '' ||
          trimmed === 'dd/mm/yyyy' ||
          trimmed === 'mm/dd/yyyy' ||
          trimmed === 'yyyy-mm-dd' ||
          trimmed === 'null' ||
          trimmed === 'undefined'
        ) {
          return false;
        }
      }

      try {
        const date = new Date(dateValue);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    };

    const hasValidTransferDate = isValidDate(transfer_date);

    if (!hasValidTransferDate) {
      throw new BadRequestException(
        'Valid transfer date is required for online transfer transactions',
      );
    }

    // For online transfers, we typically don't need settlement date validation
    // as they are usually instant or processed quickly
    if (status) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const transferDate = new Date(transfer_date);

      // For completed transactions, transfer date should not be in the future
      const completedStatuses = [
        TransactionStatus.TRANSFERRED,
        TransactionStatus.SETTLED,
        TransactionStatus.CANCELLED,
      ];

      if (completedStatuses.includes(status) && transferDate > today) {
        throw new BadRequestException(
          `Transfer date cannot be in the future when transaction status is "${status}". Completed transactions must have transfer dates in the past or today.`,
        );
      }
    }
  }

  /**
   * Validate status transitions based on transaction type
   */
  validateStatusTransition(
    transactionType: TransactionType,
    currentStatus: TransactionStatus,
    newStatus: TransactionStatus,
  ): boolean {
    const validTransitions: Record<TransactionType, TransactionStatus[]> = {
      // New Credit transactions
      [TransactionType.DEPOSIT]: [
        TransactionStatus.PENDING,
        TransactionStatus.DEPOSITED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.TRANSFER]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.SETTLEMENT]: [
        TransactionStatus.PENDING,
        TransactionStatus.SETTLED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.CHEQUE_RECEIVED]: [
        TransactionStatus.PENDING,
        TransactionStatus.SUBMITTED,
        TransactionStatus.CLEARED,
        TransactionStatus.BOUNCED,
        TransactionStatus.CANCELLED,
      ],

      // New Debit transactions
      [TransactionType.CHEQUE_GIVEN]: [
        TransactionStatus.PENDING,
        TransactionStatus.CLEARED,
        TransactionStatus.BOUNCED,
        TransactionStatus.STOPPED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.NEFT]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.IMPS]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.RTGS]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.UPI]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.BANK_CHARGE]: [
        TransactionStatus.PENDING,
        TransactionStatus.DEBITED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.ACCOUNT_TRANSFER]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.RECEIVED,
        TransactionStatus.CANCELLED,
      ],

      // Legacy Credit transactions (backward compatibility)
      [TransactionType.CASH_DEPOSIT]: [
        TransactionStatus.PENDING,
        TransactionStatus.DEPOSITED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.BANK_TRANSFER_IN]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.UPI_SETTLEMENT]: [
        TransactionStatus.PENDING,
        TransactionStatus.SETTLED,
        TransactionStatus.CANCELLED,
      ],

      // Legacy Debit transactions (backward compatibility)
      [TransactionType.BANK_TRANSFER_OUT]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.CANCELLED,
      ],

      // Legacy types
      [TransactionType.CHEQUE]: [
        TransactionStatus.PENDING,
        TransactionStatus.CLEARED,
        TransactionStatus.BOUNCED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.ONLINE]: [
        TransactionStatus.PENDING,
        TransactionStatus.SETTLED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.INTERNAL_TRANSFER]: [
        TransactionStatus.PENDING,
        TransactionStatus.TRANSFERRED,
        TransactionStatus.CANCELLED,
      ],
      [TransactionType.OTHER]: [
        TransactionStatus.PENDING,
        TransactionStatus.CANCELLED,
      ],
    };

    const allowedStatuses = validTransitions[transactionType] || [];
    return allowedStatuses.includes(newStatus);
  }

  /**
   * Validate recipient requirements for specific transaction types
   */
  validateRecipientRequirements(
    transactionType: TransactionType,
    recipientId?: number,
  ): void {
    const typesRequiringRecipient = [
      // New transaction types
      TransactionType.TRANSFER,
      TransactionType.CHEQUE_RECEIVED,
      TransactionType.CHEQUE_GIVEN,
      TransactionType.NEFT,
      TransactionType.IMPS,
      TransactionType.RTGS,
      TransactionType.UPI,
      // Legacy types
      TransactionType.BANK_TRANSFER_IN,
      TransactionType.BANK_TRANSFER_OUT,
    ];

    if (typesRequiringRecipient.includes(transactionType) && !recipientId) {
      const transactionTypeMap = {
        // New transaction types
        [TransactionType.TRANSFER]: 'transfer transactions',
        [TransactionType.CHEQUE_RECEIVED]: 'cheque transactions',
        [TransactionType.CHEQUE_GIVEN]: 'cheque transactions',
        [TransactionType.NEFT]: 'NEFT transfer transactions',
        [TransactionType.IMPS]: 'IMPS transfer transactions',
        [TransactionType.RTGS]: 'RTGS transfer transactions',
        [TransactionType.UPI]: 'UPI transfer transactions',
        // Legacy types
        [TransactionType.BANK_TRANSFER_IN]: 'bank transfer transactions',
        [TransactionType.BANK_TRANSFER_OUT]: 'bank transfer transactions',
      };

      throw new BadRequestException(
        `Recipient is required for ${transactionTypeMap[transactionType]}. Please specify who the transaction is from/to.`,
      );
    }
  }

  /**
   * Validate account transfer requirements
   */
  validateAccountTransfer(
    sourceAccountId: number,
    destinationAccountId?: number,
  ): void {
    if (!destinationAccountId) {
      throw new BadRequestException(
        'Please select the destination account where you want to transfer the money',
      );
    }

    if (sourceAccountId === destinationAccountId) {
      throw new BadRequestException(
        'You cannot transfer money to the same account. Please select a different destination account',
      );
    }
  }

  /**
   * Validate recipient belongs to the same account
   */
  validateRecipientAccountMatch(
    recipientAccountId: number,
    transactionAccountId: number,
    recipientName: string,
  ): void {
    if (recipientAccountId !== transactionAccountId) {
      throw new BadRequestException(
        `Invalid recipient. The selected recipient "${recipientName}" belongs to a different account. Please select a recipient that belongs to the same account as this transaction.`,
      );
    }
  }

  /**
   * Validates that cheque number is not already used
   */
  private async validateDuplicateChequeNumber(
    chequeNumber: string,
    excludeTransactionId?: number,
  ): Promise<void> {
    console.log(
      `[VALIDATION] Checking cheque number uniqueness: ${chequeNumber}`,
    );

    const query = this.chequeDetailsRepository
      .createQueryBuilder('cheque')
      .leftJoin('cheque.transaction', 'transaction')
      .where('cheque.cheque_number = :chequeNumber', { chequeNumber });

    // Exclude current transaction when updating
    if (excludeTransactionId) {
      query.andWhere('transaction.id != :transactionId', {
        transactionId: excludeTransactionId,
      });
    }

    const existingCheque = await query.getOne();

    if (existingCheque) {
      console.log(
        `[VALIDATION] ERROR: Cheque number ${chequeNumber} already exists`,
      );
      throw new BadRequestException(
        `Cheque number ${chequeNumber} is already used in the system. Please use a different cheque number.`,
      );
    }

    console.log(`[VALIDATION] Cheque number ${chequeNumber} is unique`);
  }

  /**
   * Validates cheque status-specific requirements
   */
  private validateChequeStatusRequirements(
    chequeDetails: any,
    status: TransactionStatus,
  ): void {
    // For SUBMITTED status, ensure cheque_issue_date is provided
    if (status === TransactionStatus.SUBMITTED) {
      if (!chequeDetails.cheque_issue_date) {
        throw new BadRequestException(
          'Cheque issue date is required for SUBMITTED status',
        );
      }
    }

    // For CLEARED status, ensure all dates are provided
    if (status === TransactionStatus.CLEARED) {
      if (!chequeDetails.cheque_issue_date) {
        throw new BadRequestException(
          'Cheque issue date is required for CLEARED status',
        );
      }
      if (!chequeDetails.cheque_due_date) {
        throw new BadRequestException(
          'Cheque due date is required for CLEARED status',
        );
      }
      if (!chequeDetails.cheque_cleared_date) {
        throw new BadRequestException(
          'Cheque cleared date is required for CLEARED status',
        );
      }
    }

    // For STOPPED status, bounce charge may be applicable
    if (status === TransactionStatus.STOPPED) {
      if (!chequeDetails.cheque_issue_date) {
        throw new BadRequestException(
          'Cheque issue date is required for STOPPED status',
        );
      }
    }
  }
}
