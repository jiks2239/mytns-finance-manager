import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { AccountType } from '../accounts.entity';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  account_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  account_number: string;

  @IsString()
  @IsOptional()
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
