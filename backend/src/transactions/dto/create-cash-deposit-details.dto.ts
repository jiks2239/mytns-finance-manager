import { IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateCashDepositDetailsDto {
  @IsNotEmpty()
  @IsDateString()
  deposit_date: string;

  @IsOptional()
  notes?: string;
}
