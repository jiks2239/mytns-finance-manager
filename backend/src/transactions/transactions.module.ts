import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './transactions.entity';
import { ChequeTransactionDetails } from './cheque-transaction-details.entity';
import { OnlineTransferDetails } from './online-transfer-details.entity';
import { BankChargeDetails } from './bank-charge-details.entity';
import { Account } from '../accounts/accounts.entity'; // <-- import Account
import { Recipient } from '../recipients/recipients.entity'; // <-- import Recipient

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      ChequeTransactionDetails,
      OnlineTransferDetails,
      BankChargeDetails,
      Account,     // <-- add Account here
      Recipient,   // <-- add Recipient here (already, if using recipient repo)
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TypeOrmModule], // optional
})
export class TransactionsModule {}