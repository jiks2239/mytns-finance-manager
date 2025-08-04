import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { BankChargeType } from '../transactions.enums';

export class CreateBankChargeDetailsDto {
  @IsEnum(BankChargeType)
  charge_type: BankChargeType;

  @IsDateString()
  charge_date: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
