import { Injectable } from '@nestjs/common';
import { Account } from '../../accounts/accounts.entity';
import {
  TransactionDirection,
  TransactionStatus,
  isGreenStatus,
  calculateNewBalance,
} from '../transactions.enums';

@Injectable()
export class AccountBalanceService {
  /**
   * Determines if account balance should be updated based on transaction status
   * Uses the new Green/Red status system
   */
  shouldUpdateBalance(status: TransactionStatus): boolean {
    return isGreenStatus(status);
  }

  /**
   * Updates account balance based on transaction direction and amount
   * Only updates for Green Status transactions
   */
  async updateAccountBalance(
    account: Account,
    transactionDirection: TransactionDirection,
    amount: number,
    status: TransactionStatus,
    updateRepository: (account: Account) => Promise<Account>,
  ): Promise<void> {
    // Only update balance for Green Status transactions
    if (!this.shouldUpdateBalance(status)) {
      return;
    }

    const currentBalance = Number(account.current_balance) || 0;
    const transactionAmount = Number(amount) || 0;

    // Calculate new balance using the utility function
    account.current_balance = calculateNewBalance(
      currentBalance,
      transactionDirection,
      transactionAmount,
      status,
    );

    await updateRepository(account);
  }

  /**
   * Validates sufficient balance for debit transactions
   */
  validateSufficientBalance(
    account: Account,
    transactionDirection: TransactionDirection,
    amount: number,
    status: TransactionStatus,
  ): void {
    if (
      transactionDirection === TransactionDirection.DEBIT &&
      this.shouldUpdateBalance(status)
    ) {
      const currentBalance = parseFloat(account.current_balance.toString());
      if (amount > currentBalance) {
        throw new Error(
          `Insufficient balance. Current balance: ${currentBalance.toFixed(2)}, Transaction amount: ${amount.toFixed(2)}`,
        );
      }
    }
  }

  /**
   * Reverses a balance update (used for transaction cancellation/deletion)
   */
  async reverseBalanceUpdate(
    account: Account,
    transactionDirection: TransactionDirection,
    amount: number,
    status: TransactionStatus,
    updateRepository: (account: Account) => Promise<Account>,
  ): Promise<void> {
    // Only reverse if the original transaction had a Green Status
    if (!this.shouldUpdateBalance(status)) {
      return;
    }

    // Reverse the direction for balance reversal
    const reverseDirection =
      transactionDirection === TransactionDirection.CREDIT
        ? TransactionDirection.DEBIT
        : TransactionDirection.CREDIT;

    await this.updateAccountBalance(
      account,
      reverseDirection,
      amount,
      status, // Use original status for validation
      updateRepository,
    );
  }
}
