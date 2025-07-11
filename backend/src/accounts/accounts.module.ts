import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { Account } from './accounts.entity'; // or './account.entity'
import { Transaction } from '../transactions/transactions.entity'; // adjust path as needed

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction])],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [TypeOrmModule], // optional, only if needed elsewhere
})
export class AccountsModule {}
