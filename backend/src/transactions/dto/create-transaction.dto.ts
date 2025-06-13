import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransactionType, TransactionStatus, BankChargeType } from '../transactions.enums';
import { CreateChequeTransactionDetailsDto } from './create-cheque-transaction-details.dto';
import { CreateOnlineTransferDetailsDto } from './create-online-transfer-details.dto';
import { CreateBankChargeDetailsDto } from './create-bank-charge-details.dto';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  transaction_type: TransactionType;

  @IsNumber()
  amount: number;

  @IsNotEmpty()
  account_id: number;         // Main account

  @IsOptional()
  recipient_id?: number;      // Optional (supplier/customer/other)

  @IsOptional()
  to_account_id?: number;     // Optional (internal transfer)

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsString()
  @IsOptional()
  description?: string;

  // --- Optional child details ---
  @IsOptional()
  cheque_details?: CreateChequeTransactionDetailsDto;

  @IsOptional()
  online_transfer_details?: CreateOnlineTransferDetailsDto;

  @IsOptional()
  bank_charge_details?: CreateBankChargeDetailsDto;
}