import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Query,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionSearchDto } from './dto/transaction-search.dto';
import {
  TransactionType,
  TransactionStatus,
  TransactionDirection,
} from './transactions.enums';

@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Create a new transaction
  @Post('transactions')
  async create(@Body() createDto: CreateTransactionDto) {
    return await this.transactionsService.create(createDto);
  }

  // Get all transactions
  @Get('transactions')
  async findAll() {
    return await this.transactionsService.findAll();
  }

  // Get a single transaction by ID
  @Get('transactions/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.transactionsService.findOne(id);
  }

  // Update a transaction by ID
  @Patch('transactions/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransactionDto,
  ) {
    return await this.transactionsService.update(id, updateDto);
  }

  // Delete a transaction by ID
  @Delete('transactions/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.transactionsService.remove(id);
    return { message: 'Transaction deleted successfully.' };
  }

  // GET /accounts/:accountId/transactions with advanced filtering
  @Get('accounts/:accountId/transactions')
  async findByAccount(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Query('transaction_type') transactionType?: TransactionType,
    @Query('transaction_direction') transactionDirection?: TransactionDirection,
    @Query('status') status?: TransactionStatus,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const filters: any = {};

    if (transactionType) {
      if (!Object.values(TransactionType).includes(transactionType)) {
        throw new BadRequestException('Invalid transaction type');
      }
      filters.transaction_type = transactionType;
    }

    if (transactionDirection) {
      if (!Object.values(TransactionDirection).includes(transactionDirection)) {
        throw new BadRequestException('Invalid transaction direction');
      }
      filters.transaction_direction = transactionDirection;
    }

    if (status) {
      if (!Object.values(TransactionStatus).includes(status)) {
        throw new BadRequestException('Invalid transaction status');
      }
      filters.status = status;
    }

    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
      filters.startDate = parsedStartDate;
    }

    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }
      filters.endDate = parsedEndDate;
    }

    return await this.transactionsService.findByAccount(accountId, filters);
  }

  // GET /accounts/:accountId/transactions/stats - Get transaction statistics for an account
  @Get('accounts/:accountId/transactions/stats')
  async getAccountTransactionStats(
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    return await this.transactionsService.getAccountTransactionStats(accountId);
  }

  // GET /transactions/types - Get all available transaction types
  @Get('transactions/types')
  getTransactionTypes() {
    return {
      transaction_types: Object.values(TransactionType),
      transaction_directions: Object.values(TransactionDirection),
      transaction_statuses: Object.values(TransactionStatus),
    };
  }

  // GET /transactions/credits - Get all credit transactions
  @Get('transactions/credits')
  async getCreditTransactions() {
    const transactions = await this.transactionsService.findAll();
    return transactions.filter(
      (transaction) =>
        transaction.transaction_direction === TransactionDirection.CREDIT,
    );
  }

  // GET /transactions/debits - Get all debit transactions
  @Get('transactions/debits')
  async getDebitTransactions() {
    const transactions = await this.transactionsService.findAll();
    return transactions.filter(
      (transaction) =>
        transaction.transaction_direction === TransactionDirection.DEBIT,
    );
  }

  // GET /transactions/pending - Get all pending transactions
  @Get('transactions/pending')
  async getPendingTransactions() {
    const transactions = await this.transactionsService.findAll();
    return transactions.filter(
      (transaction) => transaction.status === TransactionStatus.PENDING,
    );
  }

  // POST /transactions/validate - Validate transaction data before creation
  @Post('transactions/validate')
  @HttpCode(HttpStatus.OK)
  async validateTransaction(@Body() createDto: CreateTransactionDto) {
    try {
      // Validate the data structure without actually creating the transaction
      // We'll just call the validation method from the service
      const validationResult = this.validateTransactionDto(createDto);
      return {
        valid: true,
        message: 'Transaction data is valid',
        ...validationResult,
      };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  // Helper method to validate transaction DTO
  private validateTransactionDto(createDto: CreateTransactionDto) {
    const errors: string[] = [];

    // Basic validation
    if (!createDto.transaction_type) {
      errors.push('Transaction type is required');
    }

    if (!createDto.amount || createDto.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!createDto.account_id) {
      errors.push('Account ID is required');
    }

    // Type-specific validations
    switch (createDto.transaction_type) {
      case TransactionType.CASH_DEPOSIT:
        if (!createDto.cash_deposit_details) {
          errors.push('Cash deposit details are required');
        }
        break;
      case TransactionType.CHEQUE_RECEIVED:
      case TransactionType.CHEQUE_GIVEN:
        if (!createDto.cheque_details) {
          errors.push('Cheque details are required');
        }
        break;
      case TransactionType.BANK_TRANSFER_IN:
      case TransactionType.BANK_TRANSFER_OUT:
        if (!createDto.bank_transfer_details) {
          errors.push('Bank transfer details are required');
        }
        break;
      case TransactionType.UPI_SETTLEMENT:
        if (!createDto.upi_settlement_details) {
          errors.push('UPI settlement details are required');
        }
        break;
      case TransactionType.ACCOUNT_TRANSFER:
        if (!createDto.account_transfer_details) {
          errors.push('Account transfer details are required');
        }
        if (!createDto.to_account_id) {
          errors.push('Destination account is required for account transfers');
        }
        break;
      case TransactionType.BANK_CHARGE:
        if (!createDto.bank_charge_details) {
          errors.push('Bank charge details are required');
        }
        break;
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join(', '));
    }

    return { warnings: [] };
  }

  // GET /transactions/summary - Get overall transaction summary
  @Get('transactions/summary')
  async getTransactionSummary() {
    const transactions = await this.transactionsService.findAll();
    
    let totalCredits = 0;
    let totalDebits = 0;
    let pendingCount = 0;
    let completedCount = 0;
    const typeBreakdown: Record<string, { count: number; amount: number }> = {};

    transactions.forEach((transaction) => {
      // Amount totals
      if (transaction.transaction_direction === TransactionDirection.CREDIT) {
        totalCredits += transaction.amount;
      } else {
        totalDebits += transaction.amount;
      }

      // Status counts
      if (transaction.status === TransactionStatus.PENDING) {
        pendingCount++;
      } else {
        completedCount++;
      }

      // Type breakdown
      const type = transaction.transaction_type;
      if (!typeBreakdown[type]) {
        typeBreakdown[type] = { count: 0, amount: 0 };
      }
      typeBreakdown[type].count++;
      typeBreakdown[type].amount += transaction.amount;
    });

    return {
      totalTransactions: transactions.length,
      totalCredits,
      totalDebits,
      netAmount: totalCredits - totalDebits,
      pendingCount,
      completedCount,
      typeBreakdown,
    };
  }

  // POST /transactions/bulk - Create multiple transactions
  @Post('transactions/bulk')
  async createBulkTransactions(@Body() transactions: CreateTransactionDto[]) {
    const results = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      try {
        const result = await this.transactionsService.create(transactions[i]);
        results.push(result);
      } catch (error) {
        errors.push({
          index: i,
          transaction: transactions[i],
          error: error.message,
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  // PATCH /transactions/:id/status - Update transaction status
  @Patch('transactions/:id/status')
  async updateTransactionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateTransactionStatusDto,
  ) {
    // Validate that the transaction exists
    await this.transactionsService.findOne(id);
    
    // Here you could add status transition validation if needed
    const updatedTransaction = await this.transactionsService.update(id, {
      status: updateStatusDto.status,
    });

    return updatedTransaction;
  }

  // GET /transactions/search - Search transactions by description or amount
  @Get('transactions/search')
  async searchTransactions(@Query() searchParams: TransactionSearchDto) {
    const transactions = await this.transactionsService.findAll();
    const {
      q: query,
      min_amount: minAmount,
      max_amount: maxAmount,
    } = searchParams;
    
    return transactions.filter((transaction) => {
      let matches = true;

      if (query) {
        const searchTerm = query.toLowerCase();
        matches =
          matches &&
          (transaction.description?.toLowerCase().includes(searchTerm) ||
            transaction.account.account_name
              ?.toLowerCase()
              .includes(searchTerm) ||
            transaction.recipient?.name?.toLowerCase().includes(searchTerm));
      }

      if (minAmount !== undefined) {
        matches = matches && transaction.amount >= minAmount;
      }

      if (maxAmount !== undefined) {
        matches = matches && transaction.amount <= maxAmount;
      }

      return matches;
    });
  }
}
