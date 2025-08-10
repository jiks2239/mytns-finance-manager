// Frontend transaction status utilities
// Mirrors the backend status validation logic

export type TransactionType = 
  | 'cash_deposit'
  | 'cheque_received'
  | 'bank_transfer_in'
  | 'upi_settlement'
  | 'cheque_given'
  | 'bank_transfer_out'
  | 'account_transfer'
  | 'bank_charge'
  | 'cheque'
  | 'online'
  | 'internal_transfer'
  | 'other';

export type TransactionStatus = 
  | 'pending'
  | 'cancelled'
  | 'deposited'
  | 'cleared'
  | 'settled'
  | 'transferred'
  | 'debited'
  | 'received'
  | 'bounced'
  | 'failed'
  | 'completed';

export type TransactionDirection = 'credit' | 'debit';

/**
 * Valid status options for each transaction type
 */
export const VALID_STATUSES_BY_TYPE: Record<TransactionType, TransactionStatus[]> = {
  // Credit Transactions
  cash_deposit: ['pending', 'deposited', 'cancelled'],
  cheque_received: ['pending', 'cleared', 'bounced', 'cancelled'],
  bank_transfer_in: ['pending', 'transferred', 'cancelled'],
  upi_settlement: ['pending', 'settled', 'cancelled'],

  // Debit Transactions
  cheque_given: ['pending', 'cleared', 'bounced', 'cancelled'],
  bank_transfer_out: ['pending', 'transferred', 'cancelled'],
  account_transfer: ['pending', 'transferred', 'cancelled', 'received'],
  bank_charge: ['pending', 'debited', 'cancelled'],

  // Legacy types
  cheque: ['pending', 'cleared', 'bounced', 'cancelled'],
  online: ['pending', 'settled', 'cancelled'],
  internal_transfer: ['pending', 'transferred', 'cancelled', 'received'],
  other: ['pending', 'completed', 'cancelled'],
};

/**
 * Human-readable status labels
 */
export const STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pending',
  cancelled: 'Cancelled',
  deposited: 'Deposited',
  cleared: 'Cleared',
  settled: 'Settled',
  transferred: 'Transferred',
  debited: 'Debited',
  received: 'Received',
  bounced: 'Bounced',
  failed: 'Failed',
  completed: 'Completed',
};

/**
 * Status colors for UI display
 */
export const STATUS_COLORS: Record<TransactionStatus, string> = {
  pending: 'orange',
  cancelled: 'gray',
  deposited: 'green',
  cleared: 'green',
  settled: 'green',
  transferred: 'green',
  debited: 'blue',
  received: 'green',
  bounced: 'red',
  failed: 'red',
  completed: 'green',
};

/**
 * Get valid status options for a transaction type
 */
export function getValidStatusOptions(transactionType: TransactionType): TransactionStatus[] {
  const statuses = VALID_STATUSES_BY_TYPE[transactionType];
  if (!statuses) {
    console.warn(`Unknown transaction type: ${transactionType}. Falling back to basic statuses.`);
    return ['pending', 'completed', 'cancelled']; // Fallback for unknown types
  }
  return statuses;
}

/**
 * Check if a status is valid for a transaction type
 */
export function isValidStatus(transactionType: TransactionType, status: TransactionStatus): boolean {
  const validStatuses = getValidStatusOptions(transactionType);
  return validStatuses.includes(status);
}

/**
 * Get human-readable label for a status
 */
export function getStatusLabel(status: TransactionStatus): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Get color scheme for a status
 */
export function getStatusColor(status: TransactionStatus): string {
  return STATUS_COLORS[status] || 'gray';
}

/**
 * Check if a transaction should be shown in lists
 * (Account transfer receiver side pending transactions should be hidden)
 */
export function shouldShowInList(
  transactionType: TransactionType,
  status: TransactionStatus,
  isReceiverSide: boolean = false
): boolean {
  if (transactionType === 'account_transfer' && isReceiverSide) {
    // Don't show receiver side pending transactions
    if (status === 'pending') {
      return false;
    }
    // Show receiver side transactions only when received
    return status === 'received';
  }
  
  return true;
}

/**
 * Get the completion status for each transaction type
 */
export const COMPLETION_STATUS: Record<TransactionType, TransactionStatus> = {
  cash_deposit: 'deposited',
  cheque_received: 'cleared',
  bank_transfer_in: 'transferred',
  upi_settlement: 'settled',
  cheque_given: 'cleared',
  bank_transfer_out: 'transferred',
  account_transfer: 'transferred',
  bank_charge: 'debited',
  cheque: 'cleared',
  online: 'settled',
  internal_transfer: 'transferred',
  other: 'completed',
};

/**
 * Check if a status represents a completed transaction
 */
export function isCompletedStatus(transactionType: TransactionType, status: TransactionStatus): boolean {
  const completionStatus = COMPLETION_STATUS[transactionType];
  return status === completionStatus || status === 'received';
}

/**
 * Check if a status represents a failed/error state
 */
export function isErrorStatus(status: TransactionStatus): boolean {
  return ['bounced', 'failed', 'cancelled'].includes(status);
}

/**
 * Check if a status represents a pending state
 */
export function isPendingStatus(status: TransactionStatus): boolean {
  return status === 'pending';
}
