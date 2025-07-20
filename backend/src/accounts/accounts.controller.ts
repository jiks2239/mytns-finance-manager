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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountType } from './accounts.entity';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  /** 1. Create a new account */
  @Post()
  async create(@Body() createAccountDto: CreateAccountDto) {
    return await this.accountsService.create(createAccountDto);
  }

  /** 2. Get all accounts (optional ?type= for filtering by type) */
  @Get()
  async findAll(@Query('type') type?: AccountType) {
    if (type) {
      return await this.accountsService.findByType(type);
    }
    // Return all accounts with all necessary fields
    const accounts = await this.accountsService.findAll();
    return accounts.map((acc) => ({
      id: acc.id,
      account_name: acc.account_name,
      account_type: acc.account_type,
      bank_name: acc.bank_name,
      account_number: acc.account_number,
      opening_balance: acc.opening_balance,
    }));
  }

  /** 3. Get a single account by ID */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.accountsService.findOne(id);
  }

  /** 4. Update an account */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return await this.accountsService.update(id, updateAccountDto);
  }

  /** 5. Delete an account (with restriction if linked transactions) */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.accountsService.remove(id);
    return { message: 'Account deleted successfully.' };
  }

  /** 6. Get an account by account number */
  @Get('number/:account_number')
  async findByAccountNumber(@Param('account_number') account_number: string) {
    const result =
      await this.accountsService.findByAccountNumber(account_number);
    if (!result) throw new BadRequestException('Account not found.');
    return result;
  }

  /** 7. Get current balance for an account */
  @Get(':id/balance')
  async getCurrentBalance(@Param('id', ParseIntPipe) id: number) {
    const balance = await this.accountsService.getCurrentBalance(id);
    return { id, balance };
  }
}
