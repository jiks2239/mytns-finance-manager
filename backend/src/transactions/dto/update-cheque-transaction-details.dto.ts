import { PartialType } from '@nestjs/mapped-types';
import { CreateChequeTransactionDetailsDto } from './create-cheque-transaction-details.dto';

export class UpdateChequeTransactionDetailsDto extends PartialType(
  CreateChequeTransactionDetailsDto,
) {}
