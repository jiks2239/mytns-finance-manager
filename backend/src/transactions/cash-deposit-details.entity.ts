import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transactions.entity';

@Entity('cash_deposit_details')
export class CashDepositDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn()
  transaction: Transaction;

  @Column({ type: 'date' })
  deposit_date: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
