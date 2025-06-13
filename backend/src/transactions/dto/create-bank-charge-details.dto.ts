import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { BankChargeType } from '../transactions.enums';

export class CreateBankChargeDetailsDto {
  @IsEnum(BankChargeType)
  charge_type: BankChargeType;

  @IsNumber()
  @IsOptional()
  charge_amount?: number;

  @IsString()
  @IsOptional()
  narration?: string;
}