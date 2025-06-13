import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './transactions.entity';
import { ChequeTransactionDetails } from './cheque-transaction-details.entity';
import { OnlineTransferDetails } from './online-transfer-details.entity';
import { BankChargeDetails } from './bank-charge-details.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      ChequeTransactionDetails,
      OnlineTransferDetails,
      BankChargeDetails,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TypeOrmModule],
})
export class TransactionsModule {}