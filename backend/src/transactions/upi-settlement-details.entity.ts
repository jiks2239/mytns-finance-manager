import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transactions.entity';

@Entity('upi_settlement_details')
export class UpiSettlementDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Transaction, { onDelete: 'CASCADE' })
  @JoinColumn()
  transaction: Transaction;

  @Column({ type: 'date' })
  settlement_date: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  upi_reference_number?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  batch_number?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
