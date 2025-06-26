import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('api/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Create a new transaction
  @Post()
  async create(@Body() createDto: CreateTransactionDto) {
    return await this.transactionsService.create(createDto);
  }

  // Get all transactions
  @Get()
  async findAll() {
    return await this.transactionsService.findAll();
  }

  // Get a single transaction by ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.transactionsService.findOne(id);
  }

  // Update a transaction by ID
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransactionDto,
  ) {
    return await this.transactionsService.update(id, updateDto);
  }

  // Delete a transaction by ID
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.transactionsService.remove(id);
    return { message: 'Transaction deleted successfully.' };
  }
}