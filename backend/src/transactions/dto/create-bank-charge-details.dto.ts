import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { BankChargeType } from '../transactions.enums';

export class CreateBankChargeDetailsDto {
  @IsEnum(BankChargeType)
  charge_type: BankChargeType;

  @IsDateString()
  debit_date: string; // Renamed from charge_date

  @IsString()
  @IsOptional()
  notes?: string;
}
