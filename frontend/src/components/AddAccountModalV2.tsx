import React, { useState } from 'react';
// ...existing code...
import { addAccount } from '../api/accounts';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
}

type AccountType = 'current' | 'savings' | 'cash' | 'pigmy';

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAccountAdded }) => {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [pigmyStartDate, setPigmyStartDate] = useState('');
  const [totalDays, setTotalDays] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setAccountName('');
    setAccountType('');
    setBankName('');
    setAccountNumber('');
    setOpeningBalance('');
    setRecurringAmount('');
    setPigmyStartDate('');
    setTotalDays('');
    setErrors({});
  };

  React.useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  if (!isOpen) return null;

  // Validation helpers
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!accountName.trim()) newErrors.accountName = 'Account Name is required';
    if (!accountType) newErrors.accountType = 'Account Type is required';
    if ((accountType === 'current' || accountType === 'savings' || accountType === 'pigmy')) {
      if (!bankName.trim()) newErrors.bankName = 'Bank Name is required';
      else if (/\d/.test(bankName)) newErrors.bankName = 'Bank Name must not contain numbers';
      if (!accountNumber.trim()) newErrors.accountNumber = 'Bank Account Number is required';
      else if (/[^0-9 ]/.test(accountNumber)) newErrors.accountNumber = 'Only numbers and spaces allowed';
    }
    if (accountType === 'current' || accountType === 'savings' || accountType === 'cash') {
      if (!openingBalance.trim()) newErrors.openingBalance = 'Opening Balance is required';
      else if (isNaN(Number(openingBalance))) newErrors.openingBalance = 'Must be a number';
    }
    if (accountType === 'pigmy') {
      if (!recurringAmount.trim()) newErrors.recurringAmount = 'Recurring Amount is required';
      else if (isNaN(Number(recurringAmount)) || /[a-zA-Z]/.test(recurringAmount)) newErrors.recurringAmount = 'Must be a number';
      if (!pigmyStartDate) newErrors.pigmyStartDate = 'Pigmy Start Date is required';
      if (!totalDays.trim()) newErrors.totalDays = 'Total Days of Deposit is required';
      else if (isNaN(Number(totalDays))) newErrors.totalDays = 'Must be a number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate Pigmy Ending Date
  let pigmyEndingDate = '';
  if (accountType === 'pigmy' && pigmyStartDate && totalDays) {
    const start = new Date(pigmyStartDate);
    if (!isNaN(start.getTime())) {
      start.setDate(start.getDate() + Number(totalDays) - 1);
      pigmyEndingDate = start.toISOString().split('T')[0];
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      interface AccountPayload {
        account_name: string;
        account_type: AccountType | '';
        bank_name?: string;
        account_number?: string;
        opening_balance?: number;
        recurring_amount?: number;
        pigmy_start_date?: string;
        total_days?: number;
      }

      const payload: AccountPayload = {
        account_name: accountName,
        account_type: accountType,
      };
      if (accountType === 'current' || accountType === 'savings') {
        payload.bank_name = bankName;
        payload.account_number = accountNumber;
        payload.opening_balance = Number(openingBalance);
      } else if (accountType === 'cash') {
        payload.opening_balance = Number(openingBalance);
      } else if (accountType === 'pigmy') {
        payload.bank_name = bankName;
        payload.account_number = accountNumber;
        payload.recurring_amount = Number(recurringAmount);
        payload.pigmy_start_date = pigmyStartDate;
        payload.total_days = Number(totalDays);
      }
      await addAccount(payload);
      onAccountAdded();
      onClose();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to add account'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="common-modal-overlay" role="dialog" aria-modal="true">
      <form className="common-modal-form" onSubmit={handleSubmit}>
        <div className="common-modal-header">
          <span className="common-modal-title">Add Account</span>
          <button
            className="common-modal-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >&#10005;</button>
        </div>
        <div className="form-group">
          <label>Account Name</label>
          <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} autoFocus />
          {errors.accountName && <div className="form-error">{errors.accountName}</div>}
        </div>
        <div className="form-group">
          <label>Account Type</label>
          <select value={accountType} onChange={e => setAccountType(e.target.value as AccountType)}>
            <option value="">-- Select --</option>
            <option value="current">Current Account</option>
            <option value="savings">Savings Account</option>
            <option value="cash">Cash Account</option>
            <option value="pigmy">Pigmy Account</option>
          </select>
          {errors.accountType && <div className="form-error">{errors.accountType}</div>}
        </div>
        {(accountType === 'current' || accountType === 'savings' || accountType === 'pigmy') && (
          <div className="form-group">
            <label>Bank Name</label>
            <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} />
            {errors.bankName && <div className="form-error">{errors.bankName}</div>}
          </div>
        )}
        {(accountType === 'current' || accountType === 'savings' || accountType === 'pigmy') && (
          <div className="form-group">
            <label>Bank Account Number</label>
            <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
            {errors.accountNumber && <div className="form-error">{errors.accountNumber}</div>}
          </div>
        )}
        {(accountType === 'current' || accountType === 'savings' || accountType === 'cash') && (
          <div className="form-group">
            <label>Opening Balance</label>
            <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} />
            {errors.openingBalance && <div className="form-error">{errors.openingBalance}</div>}
          </div>
        )}
        {accountType === 'pigmy' && (
          <>
            <div className="form-group">
              <label>Recurring Amount</label>
              <input type="number" value={recurringAmount} onChange={e => setRecurringAmount(e.target.value)} />
              {errors.recurringAmount && <div className="form-error">{errors.recurringAmount}</div>}
            </div>
            <div className="form-group">
              <label>Pigmy Start Date</label>
              <input type="date" value={pigmyStartDate} onChange={e => setPigmyStartDate(e.target.value)} />
              {errors.pigmyStartDate && <div className="form-error">{errors.pigmyStartDate}</div>}
            </div>
            <div className="form-group">
              <label>Total Days of Deposit</label>
              <input type="number" value={totalDays} onChange={e => setTotalDays(e.target.value)} />
              {errors.totalDays && <div className="form-error">{errors.totalDays}</div>}
            </div>
            {pigmyEndingDate && (
              <div className="form-summary">Pigmy Ending Date: <b>{pigmyEndingDate}</b></div>
            )}
          </>
        )}
        {submitError && <div className="form-error common-modal-mb-16">{submitError}</div>}
        <div className="common-modal-actions">
          <button type="submit" className="primary-btn" disabled={submitting}>{submitting ? 'Adding...' : 'Add Account'}</button>
          <button type="button" className="secondary-btn" onClick={onClose} disabled={submitting}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddAccountModal;
