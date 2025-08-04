import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TransactionType,
  TransactionStatus,
  TransactionDirection,
} from '../transactions.enums';
import { IsValidTransactionDate } from '../validators/transaction-date.validator';
import { CreateChequeTransactionDetailsDto } from './create-cheque-transaction-details.dto';
import { CreateOnlineTransferDetailsDto } from './create-online-transfer-details.dto';
import { CreateBankChargeDetailsDto } from './create-bank-charge-details.dto';
import { CreateCashDepositDetailsDto } from './create-cash-deposit-details.dto';
import { CreateBankTransferDetailsDto } from './create-bank-transfer-details.dto';
import { CreateUpiSettlementDetailsDto } from './create-upi-settlement-details.dto';
import { CreateAccountTransferDetailsDto } from './create-account-transfer-details.dto';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  transaction_type: TransactionType;

  @IsOptional()
  @IsEnum(TransactionDirection)
  transaction_direction?: TransactionDirection;

  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
    },
    {
      message: 'Amount must be a valid number',
    },
  )
  @IsPositive({
    message: 'Amount must be greater than 0',
  })
  amount: number;

  @IsNotEmpty()
  account_id: number; // Main account

  @IsOptional()
  recipient_id?: number; // Optional (supplier/customer/other)

  @IsOptional()
  private _to_account_id?: number; // Optional (internal transfer)
  public get to_account_id(): number {
    return this._to_account_id;
  }
  public set to_account_id(value: number) {
    this._to_account_id = value;
  }

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  @IsValidTransactionDate('status')
  transaction_date?: string; // <-- ensure this exists

  // --- Optional child details ---
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateChequeTransactionDetailsDto)
  cheque_details?: CreateChequeTransactionDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOnlineTransferDetailsDto)
  online_transfer_details?: CreateOnlineTransferDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBankChargeDetailsDto)
  bank_charge_details?: CreateBankChargeDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCashDepositDetailsDto)
  cash_deposit_details?: CreateCashDepositDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBankTransferDetailsDto)
  bank_transfer_details?: CreateBankTransferDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUpiSettlementDetailsDto)
  upi_settlement_details?: CreateUpiSettlementDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAccountTransferDetailsDto)
  account_transfer_details?: CreateAccountTransferDetailsDto;
}
