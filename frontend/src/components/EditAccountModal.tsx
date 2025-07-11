import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import '../css/AddAccountModal.css';

interface EditAccountModalProps {
  isOpen: boolean;
  account: any;
  onClose: () => void;
  onAccountUpdated: () => void;
}

type FormValues = {
  account_name: string;
  account_number: string;
  account_type: string;
  bank_name: string;
  opening_balance: number;
  description: string;
};

const ACCOUNT_TYPES = [
  { value: 'current', label: 'Current Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'loan', label: 'Loan' },
  { value: 'other', label: 'Other' },
];

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  account,
  onClose,
  onAccountUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Memoize defaultValues so useForm re-initializes when account changes
  const defaultValues = useMemo(() => {
    let opening_balance = 0;
    if (typeof account?.opening_balance === "number") {
      opening_balance = account.opening_balance;
    } else if (typeof account?.opening_balance === "string") {
      opening_balance = parseFloat(
        account.opening_balance.replace(/[₹,]/g, '').replace('/-', '').trim()
      ) || 0;
    }
    return {
      account_name: account?.account_name ?? '',
      account_number: account?.account_number ?? '',
      account_type: account?.account_type ?? '',
      bank_name: account?.bank_name ?? '',
      opening_balance,
      description: account?.description ?? '',
    };
  }, [account]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (isOpen && account) {
      reset(defaultValues);
    }
  }, [isOpen, account, reset, defaultValues]);

  if (!isOpen || !account) return null;

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:3000/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name: data.account_name,
          account_number: data.account_number,
          account_type: data.account_type,
          bank_name: data.bank_name,
          opening_balance: data.opening_balance,
          description: data.description,
        }),
      });
      if (!res.ok) throw new Error('Failed to update account');
      onAccountUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-account-modal-overlay">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="add-account-modal-form"
      >
        <h3>Edit Account</h3>
        <label>
          Account Name:
          <input
            type="text"
            {...register('account_name', { required: 'Account Name is required' })}
          />
          {errors.account_name && <span className="add-account-modal-error">{errors.account_name.message}</span>}
        </label>
        <label>
          Account Number:
          <input
            type="text"
            {...register('account_number', {
              required: 'Account Number is required',
              validate: value =>
                /^[0-9\s]+$/.test(value) || 'Account Number must contain only numbers',
            })}
          />
          {errors.account_number && <span className="add-account-modal-error">{errors.account_number.message}</span>}
        </label>
        <label>
          Account Type:
          <select
            {...register('account_type', { required: 'Account Type is required' })}
          >
            <option value="" disabled>
              -- Select Account Type --
            </option>
            {ACCOUNT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.account_type && <span className="add-account-modal-error">{errors.account_type.message}</span>}
        </label>
        <label>
          Bank Name:
          <input
            type="text"
            {...register('bank_name', {
              required: 'Bank Name is required',
              validate: value =>
                /^[A-Za-z\s]+$/.test(value) || 'Bank Name must contain only letters',
            })}
          />
          {errors.bank_name && <span className="add-account-modal-error">{errors.bank_name.message}</span>}
        </label>
        <label>
          Opening Balance:
          <input
            type="number"
            step="0.01"
            {...register('opening_balance', {
              required: 'Opening Balance is required',
              valueAsNumber: true,
            })}
          />
          {errors.opening_balance && <span className="add-account-modal-error">{errors.opening_balance.message}</span>}
        </label>
        <label>
          Description (Optional):
          <input
            type="text"
            {...register('description')}
          />
        </label>
        {error && <div className="add-account-modal-error">{error}</div>}
        <div className="add-account-modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Update Account'}</button>
        </div>
      </form>
    </div>
  );
};

export default EditAccountModal;