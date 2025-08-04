import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transactions.entity';

@Entity('account_transfer_details')
export class AccountTransferDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn()
  transaction: Transaction;

  @Column({ type: 'date' })
  transfer_date: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transfer_reference?: string;

  @Column({ type: 'text', nullable: true })
  purpose?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
