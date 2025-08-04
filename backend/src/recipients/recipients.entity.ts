import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../accounts/accounts.entity';

export enum RecipientType {
  ACCOUNT = 'account',
  SUPPLIER = 'supplier',
  CUSTOMER = 'customer',
  UTILITY = 'utility',
  EMPLOYEE = 'employee',
  BANK = 'bank',
  OWNER = 'owner',
  OTHER = 'other',
}

@Entity('recipients')
export class Recipient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: RecipientType })
  recipient_type: RecipientType;

  @Column({ type: 'int', nullable: true })
  account_id?: number;

  // Relationship to Account - only for ACCOUNT type recipients
  @ManyToOne(() => Account, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  @Column({ length: 30, nullable: true })
  bank_account_no?: string;

  @Column({ length: 20, nullable: true })
  ifsc_code?: string;

  @Column({ length: 100, nullable: true })
  contact_person?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 100, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ length: 20, nullable: true })
  gst_number?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
