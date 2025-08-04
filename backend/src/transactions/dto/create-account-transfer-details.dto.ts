import { IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateAccountTransferDetailsDto {
  @IsNotEmpty()
  @IsDateString()
  transfer_date: string;

  @IsOptional()
  transfer_reference?: string;

  @IsOptional()
  purpose?: string;

  @IsOptional()
  notes?: string;
}
