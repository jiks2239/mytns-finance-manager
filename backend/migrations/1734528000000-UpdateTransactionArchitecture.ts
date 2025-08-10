import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTransactionArchitecture1734528000000
  implements MigrationInterface
{
  name = 'UpdateTransactionArchitecture1734528000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new transaction types to enum if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        -- Add new transaction types
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type_enum') THEN
          CREATE TYPE transaction_type_enum AS ENUM (
            'CASH_DEPOSIT', 'CASH_WITHDRAWAL', 'CHEQUE_RECEIVED', 'CHEQUE_GIVEN', 
            'ONLINE_TRANSFER', 'BANK_CHARGE', 'ACCOUNT_TRANSFER',
            'DEPOSIT', 'TRANSFER', 'SETTLEMENT', 'NEFT', 'IMPS', 'RTGS', 'UPI'
          );
        ELSE
          ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'DEPOSIT';
          ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'TRANSFER';
          ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'SETTLEMENT';
          ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'NEFT';
          ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'IMPS';
          ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'RTGS';
          ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'UPI';
        END IF;
      EXCEPTION WHEN duplicate_object THEN
        -- Type already exists, add new values
        ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'DEPOSIT';
        ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'TRANSFER';
        ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'SETTLEMENT';
        ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'NEFT';
        ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'IMPS';
        ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'RTGS';
        ALTER TYPE transaction_type_enum ADD VALUE IF NOT EXISTS 'UPI';
      END $$;
    `);

    // Add new transaction statuses
    await queryRunner.query(`
      DO $$ BEGIN
        -- Add new transaction statuses
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status_enum') THEN
          CREATE TYPE transaction_status_enum AS ENUM (
            'PENDING', 'DEPOSITED', 'WITHDRAWN', 'RECEIVED', 'CLEARED', 'CANCELLED',
            'TRANSFERRED', 'DEBITED', 'SUBMITTED', 'STOPPED'
          );
        ELSE
          ALTER TYPE transaction_status_enum ADD VALUE IF NOT EXISTS 'SUBMITTED';
          ALTER TYPE transaction_status_enum ADD VALUE IF NOT EXISTS 'STOPPED';
        END IF;
      EXCEPTION WHEN duplicate_object THEN
        -- Type already exists, add new values
        ALTER TYPE transaction_status_enum ADD VALUE IF NOT EXISTS 'SUBMITTED';
        ALTER TYPE transaction_status_enum ADD VALUE IF NOT EXISTS 'STOPPED';
      END $$;
    `);

    // Add cheque_bounce_charge column to cheque_transaction_details
    await queryRunner.query(`
      ALTER TABLE cheque_transaction_details 
      ADD COLUMN IF NOT EXISTS cheque_bounce_charge DECIMAL(10,2) DEFAULT NULL;
    `);

    // Rename cheque_given_date to cheque_issue_date
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cheque_transaction_details' 
                   AND column_name = 'cheque_given_date') THEN
          ALTER TABLE cheque_transaction_details 
          RENAME COLUMN cheque_given_date TO cheque_issue_date;
        END IF;
      END $$;
    `);

    // Rename charge_date to debit_date in bank_charge_details
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bank_charge_details' 
                   AND column_name = 'charge_date') THEN
          ALTER TABLE bank_charge_details 
          RENAME COLUMN charge_date TO debit_date;
        END IF;
      END $$;
    `);

    // Add indexes for better performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_type_status 
      ON transactions(transaction_type, status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cheque_details_issue_date 
      ON cheque_transaction_details(cheque_issue_date);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_bank_charge_details_debit_date 
      ON bank_charge_details(debit_date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_bank_charge_details_debit_date;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_cheque_details_issue_date;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_transactions_type_status;`,
    );

    // Rename columns back
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bank_charge_details' 
                   AND column_name = 'debit_date') THEN
          ALTER TABLE bank_charge_details 
          RENAME COLUMN debit_date TO charge_date;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cheque_transaction_details' 
                   AND column_name = 'cheque_issue_date') THEN
          ALTER TABLE cheque_transaction_details 
          RENAME COLUMN cheque_issue_date TO cheque_given_date;
        END IF;
      END $$;
    `);

    // Remove cheque_bounce_charge column
    await queryRunner.query(`
      ALTER TABLE cheque_transaction_details 
      DROP COLUMN IF EXISTS cheque_bounce_charge;
    `);

    // Note: We don't remove enum values as it would require recreating the enum
    // and could break existing data. Instead, they remain for backward compatibility.
  }
}
