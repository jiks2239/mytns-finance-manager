// Primary transaction direction enum
export enum TransactionDirection {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

// Unified transaction type enum for all sub-types
export enum TransactionType {
  // Credit Transaction Types (Money Coming In)
  CASH_DEPOSIT = 'cash_deposit',
  CHEQUE_RECEIVED = 'cheque_received',
  BANK_TRANSFER_IN = 'bank_transfer_in',
  UPI_SETTLEMENT = 'upi_settlement',

  // Debit Transaction Types (Money Going Out)
  CHEQUE_GIVEN = 'cheque_given',
  BANK_TRANSFER_OUT = 'bank_transfer_out',
  ACCOUNT_TRANSFER = 'account_transfer',
  BANK_CHARGE = 'bank_charge',

  // Legacy support (can be removed after migration)
  CHEQUE = 'cheque',
  ONLINE = 'online',
  INTERNAL_TRANSFER = 'internal_transfer',
  OTHER = 'other',
}

// Updated transaction status enum
export enum TransactionStatus {
  // Universal statuses
  PENDING = 'pending',
  CANCELLED = 'cancelled',

  // Credit-specific statuses
  DEPOSITED = 'deposited', // For cash deposits
  CLEARED = 'cleared', // For cheques (both received and given)
  SETTLED = 'settled', // For bank transfers in and UPI settlements

  // Debit-specific statuses
  TRANSFERRED = 'transferred', // For bank transfers out and account transfers
  DEBITED = 'debited', // For bank charges

  // Account transfer receiver side status
  RECEIVED = 'received', // For account transfer receiver side when sender completes transfer

  // Error/Exception statuses
  BOUNCED = 'bounced', // For cheques that bounce
  STOPPED = 'stopped',
  FAILED = 'failed',

  // Legacy status (can be removed after migration)
  COMPLETED = 'completed',
}

// Transfer mode enum for bank transfers
export enum TransferMode {
  NEFT = 'neft',
  IMPS = 'imps',
  RTGS = 'rtgs',
}

export enum BankChargeType {
  NEFT_CHARGE = 'neft_charge',
  IMPS_CHARGE = 'imps_charge',
  RTGS_CHARGE = 'rtgs_charge',
  CHEQUE_RETURN_CHARGE = 'cheque_return_charge',
  ATM_CHARGE = 'atm_charge',
  CASH_DEPOSIT_CHARGE = 'cash_deposit_charge',
  MAINTENANCE_FEE = 'maintenance_fee',
  OTHER = 'other',
}
