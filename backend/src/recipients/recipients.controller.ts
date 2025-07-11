import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { RecipientsService } from './recipients.service';
import { CreateRecipientDto } from './dto/create-recipient.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';
import { RecipientType } from './recipients.entity';

@Controller('recipients')
export class RecipientsController {
  constructor(private readonly recipientsService: RecipientsService) {}

  /** 1. Create a new recipient */
  @Post()
  async create(@Body() createRecipientDto: CreateRecipientDto) {
    return await this.recipientsService.create(createRecipientDto);
  }

  /** 2. Get all recipients (with optional type or name query) */
  @Get()
  async findAll(
    @Query('type') type?: RecipientType,
    @Query('name') name?: string,
  ) {
    if (type) {
      return await this.recipientsService.findByType(type);
    }
    if (name) {
      return await this.recipientsService.findByName(name);
    }
    return await this.recipientsService.findAll();
  }

  /** 3. Get a single recipient by ID */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.recipientsService.findOne(id);
  }

  /** 4. Update a recipient */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecipientDto: UpdateRecipientDto,
  ) {
    return await this.recipientsService.update(id, updateRecipientDto);
  }

  /** 5. Delete a recipient */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.recipientsService.remove(id);
    return { message: 'Recipient deleted successfully.' };
  }

  /** 6. Get recipient by GST number */
  @Get('gst/:gst_number')
  async findByGSTNumber(@Param('gst_number') gst_number: string) {
    const recipient = await this.recipientsService.findByGSTNumber(gst_number);
    if (!recipient) throw new BadRequestException('Recipient not found.');
    return recipient;
  }

  /** 7. Get all recipients of a specific type (explicit route) */
  @Get('type/:type')
  async findByType(@Param('type') type: RecipientType) {
    return await this.recipientsService.findByType(type);
  }

  /** 8. Find all recipients under a particular account */
  @Get('account/:account_id')
  async findByAccount(@Param('account_id', ParseIntPipe) account_id: number) {
    return await this.recipientsService.findByAccount(account_id);
  }
}
