import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { TransferMode } from '../transactions.enums';

export class UpdateBankTransferDetailsDto {
  @IsOptional()
  @IsDateString()
  transfer_date?: string;

  @IsOptional()
  @IsDateString()
  settlement_date?: string;

  @IsOptional()
  @IsEnum(TransferMode)
  transfer_mode?: TransferMode;

  @IsOptional()
  reference_number?: string;

  @IsOptional()
  notes?: string;
}
