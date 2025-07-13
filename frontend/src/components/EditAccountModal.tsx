import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import '../css/AddAccountModalV2.css';

interface Account {
  id: string | number;
  account_name: string;
  account_number: string;
  account_type: string;
  bank_name: string;
  opening_balance: number | string;
  description?: string;
}

interface EditAccountModalProps {
  isOpen: boolean;
  account: Account | null;
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
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message || 'Error updating account');
      } else {
        setError('Error updating account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-account-modalv2-overlay" role="dialog" aria-modal="true">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="add-account-modalv2-form common-modal-form"
      >
        <div className="add-account-modalv2-header common-modal-header">
          <span className="add-account-modalv2-title common-modal-title">Edit Account</span>
          <button
            className="add-account-modal-close small-close-btn"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >&#10005;</button>
        </div>
        <div className="form-group">
          <label htmlFor="account_name">Account Name<span aria-hidden="true">*</span></label>
          <input id="account_name" {...register('account_name', { required: true })} />
          {errors.account_name && <span className="error">Account Name is required.</span>}
        </div>
        <div className="form-group">
          <label htmlFor="account_number">Account Number<span aria-hidden="true">*</span></label>
          <input id="account_number" {...register('account_number', { required: true })} />
          {errors.account_number && <span className="error">Account Number is required.</span>}
        </div>
        <div className="form-group">
          <label htmlFor="account_type">Account Type<span aria-hidden="true">*</span></label>
          <select id="account_type" {...register('account_type', { required: true })}>
            <option value="">-- Select --</option>
            {ACCOUNT_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.account_type && <span className="error">Account Type is required.</span>}
        </div>
        <div className="form-group">
          <label htmlFor="bank_name">Bank Name<span aria-hidden="true">*</span></label>
          <input id="bank_name" {...register('bank_name', { required: true })} />
          {errors.bank_name && <span className="error">Bank Name is required.</span>}
        </div>
        <div className="form-group">
          <label htmlFor="opening_balance">Opening Balance<span aria-hidden="true">*</span></label>
          <input id="opening_balance" type="number" step="0.01" {...register('opening_balance', { required: true, valueAsNumber: true })} />
          {errors.opening_balance && <span className="error">Opening Balance is required.</span>}
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input id="description" {...register('description')} />
        </div>
        {error && <div className="add-account-modalv2-error">{error}</div>}
        <div className="add-account-modalv2-actions common-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Saving...' : 'Update Account'}</button>
        </div>
      </form>
    </div>
  );
};

export default EditAccountModal;