import { IsEnum } from 'class-validator';
import { TransactionStatus } from '../transactions.enums';

export class UpdateTransactionStatusDto {
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}
