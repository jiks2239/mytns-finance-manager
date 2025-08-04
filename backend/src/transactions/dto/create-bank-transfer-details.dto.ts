import { IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { TransferMode } from '../transactions.enums';

export class CreateBankTransferDetailsDto {
  @IsNotEmpty()
  @IsDateString()
  transfer_date: string;

  @IsOptional()
  @IsDateString()
  settlement_date?: string;

  @IsNotEmpty()
  @IsEnum(TransferMode)
  transfer_mode: TransferMode;

  @IsOptional()
  reference_number?: string;

  @IsOptional()
  notes?: string;
}
