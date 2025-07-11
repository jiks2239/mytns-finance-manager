import { IsOptional, IsDateString } from 'class-validator';

export class CreateOnlineTransferDetailsDto {
  @IsDateString()
  @IsOptional()
  transfer_date?: string;
}
