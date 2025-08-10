import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions.entity';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';

import { ChequeTransactionDetails } from '../cheque-transaction-details.entity';
import { OnlineTransferDetails } from '../online-transfer-details.entity';
import { BankChargeDetails } from '../bank-charge-details.entity';
import { CashDepositDetails } from '../cash-deposit-details.entity';
import { BankTransferDetails } from '../bank-transfer-details.entity';
import { UpiSettlementDetails } from '../upi-settlement-details.entity';
import { AccountTransferDetails } from '../account-transfer-details.entity';

import { TransactionType } from '../transactions.enums';

@Injectable()
export class TransactionDetailsService {
  constructor(
    @InjectRepository(ChequeTransactionDetails)
    private readonly chequeDetailsRepository: Repository<ChequeTransactionDetails>,
    @InjectRepository(OnlineTransferDetails)
    private readonly onlineDetailsRepository: Repository<OnlineTransferDetails>,
    @InjectRepository(BankChargeDetails)
    private readonly chargeDetailsRepository: Repository<BankChargeDetails>,
    @InjectRepository(CashDepositDetails)
    private readonly cashDepositDetailsRepository: Repository<CashDepositDetails>,
    @InjectRepository(BankTransferDetails)
    private readonly bankTransferDetailsRepository: Repository<BankTransferDetails>,
    @InjectRepository(UpiSettlementDetails)
    private readonly upiSettlementDetailsRepository: Repository<UpiSettlementDetails>,
    @InjectRepository(AccountTransferDetails)
    private readonly accountTransferDetailsRepository: Repository<AccountTransferDetails>,
  ) {}

  /**
   * Create transaction detail entities based on transaction type
   */
  async createTransactionDetails(
    transaction: Transaction,
    createDto: CreateTransactionDto,
  ): Promise<void> {
    switch (createDto.transaction_type) {
      case TransactionType.CASH_DEPOSIT:
        await this.createCashDepositDetails(transaction, createDto);
        break;

      case TransactionType.CHEQUE_RECEIVED:
      case TransactionType.CHEQUE_GIVEN:
        await this.createChequeDetails(transaction, createDto);
        break;

      case TransactionType.BANK_TRANSFER_IN:
      case TransactionType.BANK_TRANSFER_OUT:
        await this.createBankTransferDetails(transaction, createDto);
        break;

      case TransactionType.UPI_SETTLEMENT:
        await this.createUpiSettlementDetails(transaction, createDto);
        break;

      case TransactionType.ACCOUNT_TRANSFER:
        await this.createAccountTransferDetails(transaction, createDto);
        break;

      case TransactionType.BANK_CHARGE:
        await this.createBankChargeDetails(transaction, createDto);
        break;

      // Legacy support
      case TransactionType.CHEQUE:
        await this.createLegacyChequeDetails(transaction, createDto);
        break;

      case TransactionType.ONLINE:
        await this.createOnlineTransferDetails(transaction, createDto);
        break;
    }
  }

  /**
   * Update transaction detail entities based on transaction type
   */
  async updateTransactionDetails(
    transaction: Transaction,
    updateDto: UpdateTransactionDto,
  ): Promise<void> {
    // Update bank transfer details
    if (updateDto.bank_transfer_details && transaction.bank_transfer_details) {
      await this.updateBankTransferDetails(transaction, updateDto);
    }

    // Update cheque details
    if (updateDto.cheque_details && transaction.cheque_details) {
      await this.updateChequeDetails(transaction, updateDto);
    }

    // Update cash deposit details
    if (updateDto.cash_deposit_details && transaction.cash_deposit_details) {
      await this.updateCashDepositDetails(transaction, updateDto);
    }

    // Update UPI settlement details
    if (
      updateDto.upi_settlement_details &&
      transaction.upi_settlement_details
    ) {
      await this.updateUpiSettlementDetails(transaction, updateDto);
    }

    // Update account transfer details
    if (
      updateDto.account_transfer_details &&
      transaction.account_transfer_details
    ) {
      await this.updateAccountTransferDetails(transaction, updateDto);
    }

    // Update bank charge details
    if (updateDto.bank_charge_details && transaction.bank_charge_details) {
      await this.updateBankChargeDetails(transaction, updateDto);
    }
  }

  // Private methods for creating details
  private async createCashDepositDetails(
    transaction: Transaction,
    createDto: CreateTransactionDto,
  ): Promise<void> {
    if (createDto.cash_deposit_details) {
      const details = this.cashDepositDetailsRepository.create({
        deposit_date: new Date(createDto.cash_deposit_details.deposit_date),
        notes: createDto.cash_deposit_details.notes,
        transaction,
      });
      await this.cashDepositDetailsRepository.save(details);
    }
  }

  private async createChequeDetails(
    transaction: Transaction,
    createDto: CreateTransactionDto,
  ): Promise<void> {
    if (createDto.cheque_details) {
      const details = this.chequeDetailsRepository.create({
        cheque_number: createDto.cheque_details.cheque_number,
        cheque_issue_date: createDto.cheque_details.cheque_issue_date
          ? new Date(createDto.cheque_details.cheque_issue_date)
          : undefined,
        cheque_due_date: createDto.cheque_details.cheque_due_date
          ? new Date(createDto.cheque_details.cheque_due_date)
          : undefined,
        cheque_cleared_date: createDto.cheque_details.cheque_cleared_date
          ? new Date(createDto.cheque_details.cheque_cleared_date)
          : undefined,
        notes: createDto.cheque_details.notes,
        transaction,
      });
      await this.chequeDetailsRepository.save(details);
    }
  }

  private async createBankTransferDetails(
    transaction: Transaction,
    createDto: CreateTransactionDto,
  ): Promise<void> {
    if (createDto.bank_transfer_details) {
      const details = this.bankTransferDetailsRepository.create({
        transfer_date: new Date(createDto.bank_transfer_details.transfer_date),
        settlement_date: createDto.bank_transfer_details.settlement_date
          ? new Date(createDto.bank_transfer_details.settlement_date)
          : undefined,
        transfer_mode: createDto.bank_transfer_details.transfer_mode,
        reference_number: createDto.bank_transfer_details.reference_number,
        notes: createDto.bank_transfer_details.notes,
        transaction,
      });
      await this.bankTransferDetailsRepository.save(details);
    }
  }

  private async createUpiSettlementDetails(
    transaction: Transaction,
    createDto: CreateTransactionDto,
  ): Promise<void> {
    if (createDto.upi_settlement_details) {
      const details = this.upiSettlementDetailsRepository.create({
        settlement_date: new Date(
          createDto.upi_settlement_details.settlement_date,
        ),
        upi_reference_number:
          createDto.upi_settlement_details.upi_reference_number,
        batch_number: createDto.upi_settlement_details.batch_number,
        notes: createDto.upi_settlement_details.notes,
        transaction,
      });
      await this.upiSettlementDetailsRepository.save(details);
    }
  }

  private async createAccountTransferDetails(
    transaction: Transaction,
    createDto: CreateTransactionDto,
  ): Promise<void> {
    if (createDto.account_transfer_details) {
      const details = this.accountTransferDetailsRepository.create({
        transfer_date: new Date(
          createDto.account_transfer_details.transfer_date,
        ),
        transfer_reference:
          createDto.account_transfer_details.transfer_reference,
        purpose: createDto.account_transfer_details.purpose,
        notes: createDto.account_transfer_details.notes,
        transaction,
      });
      await this.accountTransferDetailsRepository.save(details);
    }
  }

  private async createBankChargeDetails(
    transaction: Transaction,
    createDto: CreateTransactionDto,
  ): Promise<void> {
    if (createDto.bank_charge_details) {
      const details = this.chargeDetailsRepository.create({
        charge_type: createDto.bank_charge_details.charge_type,
        debit_date: new Date(createDto.bank_charge_details.debit_date),
        notes: createDto.bank_charge_details.notes,
        transaction,
      });
      await this.chargeDetailsRepository.save(details);
    }
  }

  private async createLegacyChequeDetails(
    transaction: Transaction,
    createDto: CreateTransactionDto,
  ): Promise<void> {
    if (createDto.cheque_details) {
      const details = this.chequeDetailsRepository.create({
        ...createDto.cheque_details,
        transaction,
      });
      await this.chequeDetailsRepository.save(details);
    }
  }

  private async createOnlineTransferDetails(
    transaction: Transaction,
    createDto: CreateTransactionDto,
  ): Promise<void> {
    if (createDto.online_transfer_details) {
      const { transfer_date } = createDto.online_transfer_details;
      if (transfer_date && String(transfer_date).trim() !== '') {
        const details = this.onlineDetailsRepository.create({
          transfer_date,
          transaction,
        });
        await this.onlineDetailsRepository.save(details);
      }
    }
  }

  // Private methods for updating details
  private async updateBankTransferDetails(
    transaction: Transaction,
    updateDto: UpdateTransactionDto,
  ): Promise<void> {
    if (updateDto.bank_transfer_details?.transfer_date !== undefined) {
      transaction.bank_transfer_details.transfer_date = new Date(
        updateDto.bank_transfer_details.transfer_date,
      );
    }
    if (updateDto.bank_transfer_details?.settlement_date !== undefined) {
      transaction.bank_transfer_details.settlement_date = new Date(
        updateDto.bank_transfer_details.settlement_date,
      );
    }
    if (updateDto.bank_transfer_details?.transfer_mode !== undefined) {
      transaction.bank_transfer_details.transfer_mode =
        updateDto.bank_transfer_details.transfer_mode;
    }
    if (updateDto.bank_transfer_details?.reference_number !== undefined) {
      transaction.bank_transfer_details.reference_number =
        updateDto.bank_transfer_details.reference_number;
    }
    if (updateDto.bank_transfer_details?.notes !== undefined) {
      transaction.bank_transfer_details.notes =
        updateDto.bank_transfer_details.notes;
    }
    await this.bankTransferDetailsRepository.save(
      transaction.bank_transfer_details,
    );
  }

  private async updateChequeDetails(
    transaction: Transaction,
    updateDto: UpdateTransactionDto,
  ): Promise<void> {
    if (updateDto.cheque_details?.cheque_number !== undefined) {
      transaction.cheque_details.cheque_number =
        updateDto.cheque_details.cheque_number;
    }
    if (updateDto.cheque_details?.cheque_issue_date !== undefined) {
      transaction.cheque_details.cheque_issue_date = new Date(
        updateDto.cheque_details.cheque_issue_date,
      );
    }
    if (updateDto.cheque_details?.cheque_due_date !== undefined) {
      transaction.cheque_details.cheque_due_date = new Date(
        updateDto.cheque_details.cheque_due_date,
      );
    }
    if (updateDto.cheque_details?.cheque_cleared_date !== undefined) {
      transaction.cheque_details.cheque_cleared_date = new Date(
        updateDto.cheque_details.cheque_cleared_date,
      );
    }
    if (updateDto.cheque_details?.notes !== undefined) {
      transaction.cheque_details.notes = updateDto.cheque_details.notes;
    }
    await this.chequeDetailsRepository.save(transaction.cheque_details);
  }

  private async updateCashDepositDetails(
    transaction: Transaction,
    updateDto: UpdateTransactionDto,
  ): Promise<void> {
    if (updateDto.cash_deposit_details?.deposit_date !== undefined) {
      transaction.cash_deposit_details.deposit_date = new Date(
        updateDto.cash_deposit_details.deposit_date,
      );
    }
    if (updateDto.cash_deposit_details?.notes !== undefined) {
      transaction.cash_deposit_details.notes =
        updateDto.cash_deposit_details.notes;
    }
    await this.cashDepositDetailsRepository.save(
      transaction.cash_deposit_details,
    );
  }

  private async updateUpiSettlementDetails(
    transaction: Transaction,
    updateDto: UpdateTransactionDto,
  ): Promise<void> {
    if (updateDto.upi_settlement_details?.settlement_date !== undefined) {
      transaction.upi_settlement_details.settlement_date = new Date(
        updateDto.upi_settlement_details.settlement_date,
      );
    }
    if (updateDto.upi_settlement_details?.upi_reference_number !== undefined) {
      transaction.upi_settlement_details.upi_reference_number =
        updateDto.upi_settlement_details.upi_reference_number;
    }
    if (updateDto.upi_settlement_details?.batch_number !== undefined) {
      transaction.upi_settlement_details.batch_number =
        updateDto.upi_settlement_details.batch_number;
    }
    if (updateDto.upi_settlement_details?.notes !== undefined) {
      transaction.upi_settlement_details.notes =
        updateDto.upi_settlement_details.notes;
    }
    await this.upiSettlementDetailsRepository.save(
      transaction.upi_settlement_details,
    );
  }

  private async updateAccountTransferDetails(
    transaction: Transaction,
    updateDto: UpdateTransactionDto,
  ): Promise<void> {
    if (updateDto.account_transfer_details?.transfer_date !== undefined) {
      transaction.account_transfer_details.transfer_date = new Date(
        updateDto.account_transfer_details.transfer_date,
      );
    }
    if (updateDto.account_transfer_details?.transfer_reference !== undefined) {
      transaction.account_transfer_details.transfer_reference =
        updateDto.account_transfer_details.transfer_reference;
    }
    if (updateDto.account_transfer_details?.purpose !== undefined) {
      transaction.account_transfer_details.purpose =
        updateDto.account_transfer_details.purpose;
    }
    if (updateDto.account_transfer_details?.notes !== undefined) {
      transaction.account_transfer_details.notes =
        updateDto.account_transfer_details.notes;
    }
    await this.accountTransferDetailsRepository.save(
      transaction.account_transfer_details,
    );
  }

  private async updateBankChargeDetails(
    transaction: Transaction,
    updateDto: UpdateTransactionDto,
  ): Promise<void> {
    if (updateDto.bank_charge_details?.charge_type !== undefined) {
      transaction.bank_charge_details.charge_type =
        updateDto.bank_charge_details.charge_type;
    }
    if (updateDto.bank_charge_details?.debit_date !== undefined) {
      transaction.bank_charge_details.debit_date = new Date(
        updateDto.bank_charge_details.debit_date,
      );
    }
    if (updateDto.bank_charge_details?.notes !== undefined) {
      transaction.bank_charge_details.notes =
        updateDto.bank_charge_details.notes;
    }
    await this.chargeDetailsRepository.save(transaction.bank_charge_details);
  }

  /**
   * Auto-sync cash deposit details with transaction date
   */
  async syncCashDepositDetailsWithTransactionDate(
    transaction: Transaction,
    newTransactionDate: Date,
  ): Promise<void> {
    if (transaction.cash_deposit_details) {
      transaction.cash_deposit_details.deposit_date = newTransactionDate;
      await this.cashDepositDetailsRepository.save(
        transaction.cash_deposit_details,
      );
    }
  }
}
