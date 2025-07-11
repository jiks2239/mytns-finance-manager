import { PartialType } from '@nestjs/mapped-types';
import { CreateBankChargeDetailsDto } from './create-bank-charge-details.dto';

export class UpdateBankChargeDetailsDto extends PartialType(
  CreateBankChargeDetailsDto,
) {}
