import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipientsService } from './recipients.service';
import { RecipientsController } from './recipients.controller';
import { Recipient } from './recipients.entity'; // adjust path if needed
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipient]),
    forwardRef(() => AccountsModule),
  ],
  controllers: [RecipientsController],
  providers: [RecipientsService],
  exports: [TypeOrmModule, RecipientsService], // Export RecipientsService
})
export class RecipientsModule {}
