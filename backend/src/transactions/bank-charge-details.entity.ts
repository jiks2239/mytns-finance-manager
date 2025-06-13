import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Transaction } from './transactions.entity';
import { BankChargeType } from './transactions.enums';

@Entity('bank_charge_details')
export class BankChargeDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Transaction, transaction => transaction.bank_charge_details, { onDelete: 'CASCADE' })
  @JoinColumn()
  transaction: Transaction;

  @Column({ type: 'enum', enum: BankChargeType })
  charge_type: BankChargeType;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  charge_amount?: number;

  @Column({ type: 'text', nullable: true })
  narration?: string;
}