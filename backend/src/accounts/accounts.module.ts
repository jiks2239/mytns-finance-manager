import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { Account } from './accounts.entity'; // or './account.entity'
import { Transaction } from '../transactions/transactions.entity'; // adjust path as needed
import { RecipientsModule } from '../recipients/recipients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Transaction]),
    forwardRef(() => RecipientsModule),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [TypeOrmModule, AccountsService], // Export AccountsService
})
export class AccountsModule {}
