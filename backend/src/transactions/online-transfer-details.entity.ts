import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Transaction } from './transactions.entity';

@Entity('online_transfer_details')
export class OnlineTransferDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Transaction, transaction => transaction.online_transfer_details, { onDelete: 'CASCADE' })
  @JoinColumn()
  transaction: Transaction;

  @Column({ type: 'date', nullable: true })
  transfer_date?: Date;

  @Column({ length: 100, nullable: true })
  utr_number?: string;
}