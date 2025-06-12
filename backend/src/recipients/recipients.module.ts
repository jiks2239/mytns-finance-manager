import { Module } from '@nestjs/common';
import { RecipientsService } from './recipients.service';
import { RecipientsController } from './recipients.controller';

@Module({
  providers: [RecipientsService],
  controllers: [RecipientsController]
})
export class RecipientsModule {}
