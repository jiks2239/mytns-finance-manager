import {
  TransactionType,
  TransactionStatus,
  TransactionDirection,
} from './transactions.enums';

/**
 * Valid status transitions for each transaction type
 * Based on the business requirements provided
 */
export const VALID_STATUSES_BY_TRANSACTION_TYPE: Record<
  TransactionType,
  TransactionStatus[]
> = {
  // Credit Transactions
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
    TransactionStatus.SETTLED,
    TransactionStatus.CANCELLED,
  ],

  [TransactionType.UPI_SETTLEMENT]: [
    TransactionStatus.PENDING,
    TransactionStatus.SETTLED,
    TransactionStatus.CANCELLED,
  ],

  // Debit Transactions
  [TransactionType.CHEQUE_GIVEN]: [
    TransactionStatus.PENDING,
    TransactionStatus.CLEARED,
    TransactionStatus.BOUNCED,
    TransactionStatus.CANCELLED,
  ],

  [TransactionType.BANK_TRANSFER_OUT]: [
    TransactionStatus.PENDING,
    TransactionStatus.TRANSFERRED,
    TransactionStatus.CANCELLED,
  ],

  [TransactionType.ACCOUNT_TRANSFER]: [
    TransactionStatus.PENDING,
    TransactionStatus.TRANSFERRED,
    TransactionStatus.CANCELLED,
    // Note: RECEIVED status is for the automatically created receiver side transaction
    TransactionStatus.RECEIVED,
  ],

  [TransactionType.BANK_CHARGE]: [
    TransactionStatus.PENDING,
    TransactionStatus.DEBITED,
    TransactionStatus.CANCELLED,
  ],

  // Legacy types (maintaining backward compatibility)
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
    TransactionStatus.RECEIVED,
  ],

  [TransactionType.OTHER]: [
    TransactionStatus.PENDING,
    TransactionStatus.COMPLETED,
    TransactionStatus.CANCELLED,
  ],
};

/**
 * Get valid statuses for a specific transaction type
 */
export function getValidStatusesForTransactionType(
  transactionType: TransactionType,
): TransactionStatus[] {
  return VALID_STATUSES_BY_TRANSACTION_TYPE[transactionType] || [];
}

/**
 * Check if a status is valid for a given transaction type
 */
export function isValidStatusForTransactionType(
  transactionType: TransactionType,
  status: TransactionStatus,
): boolean {
  const validStatuses = getValidStatusesForTransactionType(transactionType);
  return validStatuses.includes(status);
}

/**
 * Get the final/completion status for each transaction type
 */
export const COMPLETION_STATUS_BY_TRANSACTION_TYPE: Record<
  TransactionType,
  TransactionStatus
> = {
  [TransactionType.CASH_DEPOSIT]: TransactionStatus.DEPOSITED,
  [TransactionType.CHEQUE_RECEIVED]: TransactionStatus.CLEARED,
  [TransactionType.BANK_TRANSFER_IN]: TransactionStatus.SETTLED,
  [TransactionType.UPI_SETTLEMENT]: TransactionStatus.SETTLED,
  [TransactionType.CHEQUE_GIVEN]: TransactionStatus.CLEARED,
  [TransactionType.BANK_TRANSFER_OUT]: TransactionStatus.TRANSFERRED,
  [TransactionType.ACCOUNT_TRANSFER]: TransactionStatus.TRANSFERRED,
  [TransactionType.BANK_CHARGE]: TransactionStatus.DEBITED,
  // Legacy
  [TransactionType.CHEQUE]: TransactionStatus.CLEARED,
  [TransactionType.ONLINE]: TransactionStatus.SETTLED,
  [TransactionType.INTERNAL_TRANSFER]: TransactionStatus.TRANSFERRED,
  [TransactionType.OTHER]: TransactionStatus.COMPLETED,
};

/**
 * Account Transfer specific logic
 * When sender side status changes, determine receiver side status
 */
export function getReceiverStatusFromSenderStatus(
  senderStatus: TransactionStatus,
): TransactionStatus | null {
  switch (senderStatus) {
    case TransactionStatus.PENDING:
      return TransactionStatus.PENDING; // Create receiver transaction but don't show in list
    case TransactionStatus.TRANSFERRED:
      return TransactionStatus.RECEIVED; // Show receiver transaction as received
    case TransactionStatus.CANCELLED:
      return null; // Don't create/remove receiver transaction
    default:
      return null;
  }
}

/**
 * Check if a transaction should be visible in transaction lists
 * For account transfers, receiver side pending transactions should be hidden
 */
export function shouldShowTransactionInList(
  transactionType: TransactionType,
  status: TransactionStatus,
  direction: TransactionDirection,
  isReceiverSide: boolean = false,
): boolean {
  // For account transfer receiver side transactions
  if (transactionType === TransactionType.ACCOUNT_TRANSFER && isReceiverSide) {
    // Don't show receiver side pending transactions
    if (status === TransactionStatus.PENDING) {
      return false;
    }
    // Show receiver side transactions only when they are received
    return status === TransactionStatus.RECEIVED;
  }

  // Show all other transactions
  return true;
}
