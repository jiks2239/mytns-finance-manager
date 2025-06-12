import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, IsEmail } from 'class-validator';
import { RecipientType } from '../recipients.entity';

export class CreateRecipientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(RecipientType)
  recipient_type: RecipientType;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  bank_account_no?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  ifsc_code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contact_person?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  gst_number?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}