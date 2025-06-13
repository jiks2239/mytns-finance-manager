import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateOnlineTransferDetailsDto {
  @IsDateString()
  @IsOptional()
  transfer_date?: string;

  @IsString()
  @IsOptional()
  utr_number?: string;
}