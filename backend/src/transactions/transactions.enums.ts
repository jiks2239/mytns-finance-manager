export enum TransactionType {
  CHEQUE = 'cheque',
  ONLINE = 'online',
  CASH_DEPOSIT = 'cash_deposit',
  INTERNAL_TRANSFER = 'internal_transfer',
  BANK_CHARGE = 'bank_charge',
  OTHER = 'other',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CLEARED = 'cleared',
  BOUNCED = 'bounced',
  STOPPED = 'stopped',
  TRANSFERRED = 'transferred',
  DEPOSITED = 'deposited',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  COMPLETED = 'completed',
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
