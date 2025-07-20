import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { AccountType } from '../accounts.entity';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  account_name: string;

  // Account number is required for current and savings accounts
  @ValidateIf(
    (o) =>
      o.account_type === AccountType.CURRENT ||
      o.account_type === AccountType.SAVINGS,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  account_number?: string;

  // Bank name is required for current and savings accounts
  @ValidateIf(
    (o) =>
      o.account_type === AccountType.CURRENT ||
      o.account_type === AccountType.SAVINGS,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bank_name?: string;

  @IsEnum(AccountType)
  account_type: AccountType;

  @IsNumber({ maxDecimalPlaces: 2 })
  opening_balance: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
