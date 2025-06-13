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
import { TransactionType, TransactionStatus } from './transactions.enums';
import { ChequeTransactionDetails } from './cheque-transaction-details.entity';
import { OnlineTransferDetails } from './online-transfer-details.entity';
import { BankChargeDetails } from './bank-charge-details.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TransactionType })
  transaction_type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @ManyToOne(() => Account, { nullable: false })
  account: Account;

  @ManyToOne(() => Recipient, { nullable: true })
  recipient?: Recipient;

  @ManyToOne(() => Account, { nullable: true })
  to_account?: Account; // For internal transfer

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Child relations
  @OneToOne(() => ChequeTransactionDetails, chequeDetails => chequeDetails.transaction, { cascade: true })
  cheque_details?: ChequeTransactionDetails;

  @OneToOne(() => OnlineTransferDetails, onlineDetails => onlineDetails.transaction, { cascade: true })
  online_transfer_details?: OnlineTransferDetails;

  @OneToOne(() => BankChargeDetails, chargeDetails => chargeDetails.transaction, { cascade: true })
  bank_charge_details?: BankChargeDetails;
}