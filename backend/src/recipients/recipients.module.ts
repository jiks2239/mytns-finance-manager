import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipientsService } from './recipients.service';
import { RecipientsController } from './recipients.controller';
import { Recipient } from './recipients.entity'; // adjust path if needed

@Module({
  imports: [TypeOrmModule.forFeature([Recipient])],
  controllers: [RecipientsController],
  providers: [RecipientsService],
  exports: [TypeOrmModule], // Optional, export if needed by other modules
})
export class RecipientsModule {}