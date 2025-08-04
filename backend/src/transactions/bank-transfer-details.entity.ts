import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transactions.entity';
import { TransferMode } from './transactions.enums';

@Entity('bank_transfer_details')
export class BankTransferDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn()
  transaction: Transaction;

  @Column({ type: 'date', nullable: true })
  transfer_date?: Date;

  @Column({ type: 'date', nullable: true })
  settlement_date?: Date; // For UPI settlements

  @Column({ type: 'enum', enum: TransferMode, nullable: true })
  transfer_mode?: TransferMode;

  @Column({ type: 'text', nullable: true })
  reference_number?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
