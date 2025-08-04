import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateBankTransferDetailsDto } from './update-bank-transfer-details.dto';

// First create a base class without bank_transfer_details
class CreateTransactionDtoWithoutBankDetails extends OmitType(
  CreateTransactionDto,
  ['bank_transfer_details'] as const,
) {}

export class UpdateTransactionDto extends PartialType(
  CreateTransactionDtoWithoutBankDetails,
) {
  // Add bank_transfer_details with update-specific DTO
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBankTransferDetailsDto)
  bank_transfer_details?: UpdateBankTransferDetailsDto;
}
