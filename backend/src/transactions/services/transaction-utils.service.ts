import { Injectable } from '@nestjs/common';
import {
  TransactionType,
  TransactionDirection,
  TransactionStatus,
} from '../transactions.enums';

@Injectable()
export class TransactionUtilsService {
  /**
   * Determine transaction direction based on transaction type
   */
  getTransactionDirection(
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

  /**
   * Calculate transaction statistics for an account
   */
  calculateTransactionStats(
    transactions: {
      transaction_direction: TransactionDirection;
      transaction_type: TransactionType;
      amount: number;
      status: TransactionStatus;
    }[],
  ): {
    totalCredits: number;
    totalDebits: number;
    pendingTransactions: number;
    completedTransactions: number;
    creditsByType: Record<string, number>;
    debitsByType: Record<string, number>;
  } {
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

  /**
   * Generate description for account transfer credit transaction
   */
  generateAccountTransferDescription(fromAccountName: string | number): string {
    return `[Account Transfer] from ${fromAccountName}`;
  }

  /**
   * Generate notes for account transfer credit transaction
   */
  generateAccountTransferNotes(originalTransactionId: number): string {
    return `Automatic credit from account transfer (Ref: ${originalTransactionId})`;
  }
}
