import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class TransactionSearchDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_amount?: number;
}
