import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transactions.entity';

@Entity('cheque_transaction_details')
export class ChequeTransactionDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Transaction, (transaction) => transaction.cheque_details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  transaction: Transaction;

  @Column({ nullable: true })
  cheque_number?: string;

  @Column({ type: 'date', nullable: true })
  cheque_given_date?: Date;

  @Column({ type: 'date', nullable: true })
  cheque_due_date?: Date;

  @Column({ type: 'date', nullable: true })
  cheque_cleared_date?: Date;
}
