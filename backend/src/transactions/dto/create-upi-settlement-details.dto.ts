import { IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateUpiSettlementDetailsDto {
  @IsNotEmpty()
  @IsDateString()
  settlement_date: string;

  @IsOptional()
  upi_reference_number?: string;

  @IsOptional()
  batch_number?: string;

  @IsOptional()
  notes?: string;
}
