// Updated transaction types for the new system
export const TransactionType = {
  // Credit Transaction Types (Money Coming In)
  CASH_DEPOSIT: 'cash_deposit',
  CHEQUE_RECEIVED: 'cheque_received',
  BANK_TRANSFER_IN: 'bank_transfer_in',
  UPI_SETTLEMENT: 'upi_settlement',

  // Debit Transaction Types (Money Going Out)
  CHEQUE_GIVEN: 'cheque_given',
  BANK_TRANSFER_OUT: 'bank_transfer_out',
  ACCOUNT_TRANSFER: 'account_transfer',
  BANK_CHARGE: 'bank_charge',

  // Legacy support
  CHEQUE: 'cheque',
  ONLINE: 'online',
  INTERNAL_TRANSFER: 'internal_transfer',
  OTHER: 'other',
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

export const TransactionDirection = {
  CREDIT: 'credit',
  DEBIT: 'debit',
} as const;

export type TransactionDirection = typeof TransactionDirection[keyof typeof TransactionDirection];

export const TransactionStatus = {
  // Universal statuses
  PENDING: 'pending',

  // Credit-specific statuses
  DEPOSITED: 'deposited',
  CLEARED: 'cleared',
  TRANSFERRED: 'transferred',
  SETTLED: 'settled',

  // Debit-specific statuses
  DEBITED: 'debited',

  // Error/Exception statuses
  BOUNCED: 'bounced',
  STOPPED: 'stopped',
  CANCELLED: 'cancelled',
  FAILED: 'failed',

  // Legacy status
  COMPLETED: 'completed',
} as const;

export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

export const TransferMode = {
  NEFT: 'neft',
  IMPS: 'imps',
  RTGS: 'rtgs',
} as const;

export type TransferMode = typeof TransferMode[keyof typeof TransferMode];

export const BankChargeType = {
  NEFT_CHARGE: 'neft_charge',
  IMPS_CHARGE: 'imps_charge',
  RTGS_CHARGE: 'rtgs_charge',
  CHEQUE_RETURN_CHARGE: 'cheque_return_charge',
  ATM_CHARGE: 'atm_charge',
  CASH_DEPOSIT_CHARGE: 'cash_deposit_charge',
  MAINTENANCE_FEE: 'maintenance_fee',
  OTHER: 'other',
} as const;

export type BankChargeType = typeof BankChargeType[keyof typeof BankChargeType];

// Detail interfaces for different transaction types
export interface CashDepositDetails {
  deposit_date: string;
  notes?: string;
}

export interface ChequeTransactionDetails {
  cheque_number: string;
  cheque_given_date?: string;
  cheque_due_date: string;
  cheque_cleared_date?: string;
  notes?: string;
}

export interface BankTransferDetails {
  transfer_date: string;
  settlement_date?: string;
  transfer_mode: TransferMode;
  reference_number?: string;
  notes?: string;
}

export interface UpiSettlementDetails {
  settlement_date: string;
  upi_reference_number?: string;
  batch_number?: string;
  notes?: string;
}

export interface AccountTransferDetails {
  transfer_date: string;
  transfer_reference?: string;
  purpose?: string;
  notes?: string;
}

export interface BankChargeDetails {
  charge_type: BankChargeType;
  charge_date: string;
  notes?: string;
}

export interface OnlineTransferDetails {
  transfer_date: string;
}

// Main transaction interface
export interface Transaction {
  id: number;
  transaction_type: TransactionType;
  transaction_direction: TransactionDirection;
  amount: number;
  account_id: number;
  recipient_id?: number;
  to_account_id?: number;
  status: TransactionStatus;
  description?: string;
  transaction_date?: string;
  created_at: string;
  updated_at: string;

  // Parent-child relationship for account transfers
  parent_transaction_id?: number;
  parent_transaction?: Transaction;

  // Relations
  account: {
    id: number;
    account_name: string;
    bank_name: string;
  };
  recipient?: {
    id: number;
    name: string;
    type: string;
  };
  to_account?: {
    id: number;
    account_name: string;
    bank_name: string;
  };

  // Detail relations
  cash_deposit_details?: CashDepositDetails;
  cheque_details?: ChequeTransactionDetails;
  bank_transfer_details?: BankTransferDetails;
  upi_settlement_details?: UpiSettlementDetails;
  account_transfer_details?: AccountTransferDetails;
  bank_charge_details?: BankChargeDetails;
  online_transfer_details?: OnlineTransferDetails;
}

// Form interfaces for creating transactions
export interface CreateTransactionForm {
  transaction_type: TransactionType;
  transaction_direction: TransactionDirection;
  amount: number;
  account_id: number;
  recipient_id?: number;
  to_account_id?: number;
  status: TransactionStatus;
  description?: string;
  transaction_date?: string;

  // Detail forms
  cash_deposit_details?: CashDepositDetails;
  cheque_details?: ChequeTransactionDetails;
  bank_transfer_details?: BankTransferDetails;
  upi_settlement_details?: UpiSettlementDetails;
  account_transfer_details?: AccountTransferDetails;
  bank_charge_details?: BankChargeDetails;
  online_transfer_details?: OnlineTransferDetails;
}

// API response interfaces
export interface TransactionStats {
  totalCredits: number;
  totalDebits: number;
  pendingTransactions: number;
  completedTransactions: number;
  creditsByType: Record<string, number>;
  debitsByType: Record<string, number>;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  pendingCount: number;
  completedCount: number;
  typeBreakdown: Record<string, { count: number; amount: number }>;
}

// Helper type for transaction type groups
export interface TransactionTypeGroup {
  label: string;
  types: TransactionType[];
  direction: TransactionDirection;
}

export const TRANSACTION_TYPE_GROUPS: TransactionTypeGroup[] = [
  {
    label: 'Credit Transactions (Money In)',
    direction: TransactionDirection.CREDIT,
    types: [
      TransactionType.CASH_DEPOSIT,
      TransactionType.CHEQUE_RECEIVED,
      TransactionType.BANK_TRANSFER_IN,
      TransactionType.UPI_SETTLEMENT,
    ],
  },
  {
    label: 'Debit Transactions (Money Out)',
    direction: TransactionDirection.DEBIT,
    types: [
      TransactionType.CHEQUE_GIVEN,
      TransactionType.BANK_TRANSFER_OUT,
      TransactionType.ACCOUNT_TRANSFER,
      TransactionType.BANK_CHARGE,
    ],
  },
];

// Helper function to get transaction type label
export const getTransactionTypeLabel = (type: TransactionType): string => {
  const labels: Record<TransactionType, string> = {
    [TransactionType.CASH_DEPOSIT]: 'Cash Deposit',
    [TransactionType.CHEQUE_RECEIVED]: 'Cheque Received',
    [TransactionType.BANK_TRANSFER_IN]: 'Bank Transfer In',
    [TransactionType.UPI_SETTLEMENT]: 'UPI Settlement',
    [TransactionType.CHEQUE_GIVEN]: 'Cheque Given',
    [TransactionType.BANK_TRANSFER_OUT]: 'Bank Transfer Out',
    [TransactionType.ACCOUNT_TRANSFER]: 'Account Transfer',
    [TransactionType.BANK_CHARGE]: 'Bank Charge',
    [TransactionType.CHEQUE]: 'Cheque (Legacy)',
    [TransactionType.ONLINE]: 'Online Transfer (Legacy)',
    [TransactionType.INTERNAL_TRANSFER]: 'Internal Transfer (Legacy)',
    [TransactionType.OTHER]: 'Other',
  };
  return labels[type] || type;
};

// Helper function to get status label with appropriate styling
export const getStatusLabel = (status: TransactionStatus): { label: string; color: string } => {
  const statusConfig: Record<TransactionStatus, { label: string; color: string }> = {
    [TransactionStatus.PENDING]: { label: 'Pending', color: 'orange' },
    [TransactionStatus.DEPOSITED]: { label: 'Deposited', color: 'green' },
    [TransactionStatus.CLEARED]: { label: 'Cleared', color: 'green' },
    [TransactionStatus.TRANSFERRED]: { label: 'Transferred', color: 'green' },
    [TransactionStatus.SETTLED]: { label: 'Settled', color: 'green' },
    [TransactionStatus.DEBITED]: { label: 'Debited', color: 'blue' },
    [TransactionStatus.BOUNCED]: { label: 'Bounced', color: 'red' },
    [TransactionStatus.STOPPED]: { label: 'Stopped', color: 'red' },
    [TransactionStatus.CANCELLED]: { label: 'Cancelled', color: 'gray' },
    [TransactionStatus.FAILED]: { label: 'Failed', color: 'red' },
    [TransactionStatus.COMPLETED]: { label: 'Completed', color: 'green' },
  };
  return statusConfig[status] || { label: status, color: 'gray' };
};
