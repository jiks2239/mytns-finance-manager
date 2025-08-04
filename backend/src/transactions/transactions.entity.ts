import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Account } from '../accounts/accounts.entity';
import { Recipient } from '../recipients/recipients.entity';
import {
  TransactionType,
  TransactionStatus,
  TransactionDirection,
} from './transactions.enums';
import { ChequeTransactionDetails } from './cheque-transaction-details.entity';
import { OnlineTransferDetails } from './online-transfer-details.entity';
import { BankChargeDetails } from './bank-charge-details.entity';
import { CashDepositDetails } from './cash-deposit-details.entity';
import { BankTransferDetails } from './bank-transfer-details.entity';
import { UpiSettlementDetails } from './upi-settlement-details.entity';
import { AccountTransferDetails } from './account-transfer-details.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TransactionType })
  transaction_type: TransactionType;

  @Column({ type: 'enum', enum: TransactionDirection })
  transaction_direction: TransactionDirection;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  amount: number;

  @ManyToOne(() => Account, (account) => account.transactions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  account: Account;

  @ManyToOne(() => Recipient, { nullable: true, onDelete: 'SET NULL' })
  recipient?: Recipient;

  @ManyToOne(() => Account, (account) => account.destination_transactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  to_account?: Account; // For internal transfer

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  transaction_date?: Date; // <-- ensure this exists

  // Parent-child relationship for account transfers
  @ManyToOne(
    () => Transaction,
    (transaction) => transaction.child_transactions,
    {
      nullable: true,
      onDelete: 'CASCADE',
    },
  )
  parent_transaction?: Transaction;

  @Column({ nullable: true })
  parent_transaction_id?: number;

  // For query purposes - one parent can have multiple children (though typically just one for account transfers)
  child_transactions?: Transaction[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Child relations
  @OneToOne(
    () => ChequeTransactionDetails,
    (chequeDetails) => chequeDetails.transaction,
    { cascade: true },
  )
  cheque_details?: ChequeTransactionDetails;

  @OneToOne(
    () => OnlineTransferDetails,
    (onlineDetails) => onlineDetails.transaction,
    { cascade: true },
  )
  online_transfer_details?: OnlineTransferDetails;

  @OneToOne(
    () => BankChargeDetails,
    (chargeDetails) => chargeDetails.transaction,
    { cascade: true },
  )
  bank_charge_details?: BankChargeDetails;

  @OneToOne(
    () => CashDepositDetails,
    (cashDepositDetails) => cashDepositDetails.transaction,
    { cascade: true },
  )
  cash_deposit_details?: CashDepositDetails;

  @OneToOne(
    () => BankTransferDetails,
    (bankTransferDetails) => bankTransferDetails.transaction,
    { cascade: true },
  )
  bank_transfer_details?: BankTransferDetails;

  @OneToOne(
    () => UpiSettlementDetails,
    (upiSettlementDetails) => upiSettlementDetails.transaction,
    { cascade: true },
  )
  upi_settlement_details?: UpiSettlementDetails;

  @OneToOne(
    () => AccountTransferDetails,
    (accountTransferDetails) => accountTransferDetails.transaction,
    { cascade: true },
  )
  account_transfer_details?: AccountTransferDetails;
}
