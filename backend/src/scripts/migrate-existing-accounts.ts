#!/usr/bin/env node

/**
 * Migration script to create recipient records for existing accounts
 * Run this script after deploying the automatic recipient feature
 * 
 * Usage: ts-node src/scripts/migrate-existing-accounts.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AccountsService } from '../accounts/accounts.service';
import { RecipientsService } from '../recipients/recipients.service';
import { RecipientType } from '../recipients/recipients.entity';

async function migrateExistingAccounts() {
  console.log('Starting migration of existing accounts to recipients...');
  
  // Create the NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const accountsService = app.get(AccountsService);
    const recipientsService = app.get(RecipientsService);
    
    // Get all existing accounts
    const accounts = await accountsService.findAll();
    console.log(`Found ${accounts.length} accounts to process`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const account of accounts) {
      try {
        // Check if account already has a recipient
        const existingRecipients = await recipientsService.findByAccountId(account.id);
        const hasAccountRecipient = existingRecipients.some(
          r => r.recipient_type === RecipientType.ACCOUNT
        );
        
        if (hasAccountRecipient) {
          console.log(`Account "${account.account_name}" already has a recipient, skipping`);
          skipped++;
          continue;
        }
        
        // Create recipient for this account
        const recipientData = {
          name: account.account_name,
          recipient_type: RecipientType.ACCOUNT,
          account_id: account.id,
          bank_account_no: account.account_number || null,
          notes: `Auto-generated recipient for account: ${account.account_name} (migrated)`,
        };
        
        await recipientsService.create(recipientData);
        console.log(`✓ Created recipient for account: ${account.account_name}`);
        created++;
        
      } catch (error) {
        console.error(`✗ Failed to create recipient for account "${account.account_name}":`, error.message);
        errors++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Accounts processed: ${accounts.length}`);
    console.log(`Recipients created: ${created}`);
    console.log(`Accounts skipped (already had recipients): ${skipped}`);
    console.log(`Errors: ${errors}`);
    
    if (errors === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the migration
migrateExistingAccounts()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
