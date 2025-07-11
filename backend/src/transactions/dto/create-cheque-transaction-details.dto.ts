import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateChequeTransactionDetailsDto {
  @IsString()
  @IsOptional()
  cheque_number?: string;

  @IsDateString()
  @IsOptional()
  cheque_given_date?: string;

  @IsDateString()
  @IsOptional()
  cheque_due_date?: string;

  @IsDateString()
  @IsOptional()
  cheque_cleared_date?: string;
}
