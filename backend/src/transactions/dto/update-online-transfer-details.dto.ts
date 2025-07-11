import { PartialType } from '@nestjs/mapped-types';
import { CreateOnlineTransferDetailsDto } from './create-online-transfer-details.dto';

export class UpdateOnlineTransactionDetailsDto extends PartialType(
  CreateOnlineTransferDetailsDto,
) {}
