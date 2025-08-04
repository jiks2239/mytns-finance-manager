import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  AfterInsert,
  AfterUpdate,
  AfterRemove,
} from 'typeorm';

export enum AccountType {
  CURRENT = 'current',
  SAVINGS = 'savings',
  CASH = 'cash',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  account_name: string;

  @Column({ length: 30, unique: true, nullable: true })
  account_number?: string;

  @Column({ length: 100, nullable: true })
  bank_name?: string;

  @Column({ type: 'enum', enum: AccountType })
  account_type: AccountType;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  opening_balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  current_balance: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationship to auto-generated recipient with cascade delete
  @OneToOne('Recipient', 'account', { cascade: true, onDelete: 'CASCADE' })
  recipient?: any;

  // Relationship to transactions with cascade delete
  @OneToMany('Transaction', 'account', {
    cascade: true,
    onDelete: 'CASCADE',
  })
  transactions?: any[];

  // Relationship to transactions as destination account (to_account) with cascade delete
  @OneToMany('Transaction', 'to_account', {
    cascade: true,
    onDelete: 'CASCADE',
  })
  destination_transactions?: any[];

  // Lifecycle hooks for automatic recipient management
  @AfterInsert()
  async createRecipient() {
    // This will be handled by the AccountsService to avoid circular dependencies
  }

  @AfterUpdate()
  async updateRecipient() {
    // This will be handled by the AccountsService to avoid circular dependencies
  }

  @AfterRemove()
  async removeRecipient() {
    // This will be handled by the AccountsService to avoid circular dependencies
  }
}
