import React from 'react';
import '../css/AddAccountModal.css';
import { useForm } from 'react-hook-form';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: () => Promise<void>;
}

type FormValues = {
  account_name: string;
  account_number: string;
  account_type: string;
  bank_name: string;
  opening_balance: number;
  description: string;
};

const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountAdded,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      account_name: '',
      account_number: '',
      account_type: '',
      bank_name: '',
      opening_balance: 0,
      description: '',
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormValues) => {
    // Send data to backend here
    try {
      const res = await fetch('http://localhost:3000/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add account');
      await onAccountAdded();
      onClose();
    } catch {
      alert('Failed to add account');
    }
  };

  return (
    <div className="add-account-modal-overlay" role="dialog" aria-modal="true">
      <div className="add-account-modal-form">
        <div className="add-account-modal-header">
          <span className="add-account-modal-title">Add Account</span>
          <button
            className="add-account-modal-close small-close-btn"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >&#10005;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <div className="form-group">
            <label>Account Name</label>
            <input
              type="text"
              {...register('account_name', { required: 'Account Name is required' })}
              autoFocus
              autoComplete="off"
            />
            {errors.account_name && (
              <div className="add-account-modal-error">{errors.account_name.message}</div>
            )}
          </div>
          <div className="form-group">
            <label>Account Number</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9\s]+"
              {...register('account_number', {
                required: 'Account Number is required',
                validate: value =>
                  /^[0-9\s]+$/.test(value) || 'Account Number must contain only numbers',
              })}
            />
            {errors.account_number && (
              <div className="add-account-modal-error">{errors.account_number.message}</div>
            )}
          </div>
          <div className="form-group">
            <label>Account Type</label>
            <select
              {...register('account_type', { required: 'Account Type is required' })}
            >
              <option value="">-- Select --</option>
              <option value="current">Current Account</option>
              <option value="savings">Savings Account</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="loan">Loan</option>
              <option value="other">Other</option>
            </select>
            {errors.account_type && (
              <div className="add-account-modal-error">{errors.account_type.message}</div>
            )}
          </div>
          <div className="form-group">
            <label>Bank Name</label>
            <input
              type="text"
              {...register('bank_name', {
                required: 'Bank Name is required',
                validate: value =>
                  /^[A-Za-z\s]+$/.test(value) || 'Bank Name must contain only letters',
              })}
            />
            {errors.bank_name && (
              <div className="add-account-modal-error">{errors.bank_name.message}</div>
            )}
          </div>
          <div className="form-group">
            <label>Opening Balance</label>
            <input
              type="number"
              {...register('opening_balance', {
                required: 'Opening Balance is required',
                valueAsNumber: true,
              })}
            />
            {errors.opening_balance && (
              <div className="add-account-modal-error">{errors.opening_balance.message}</div>
            )}
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <input
              type="text"
              {...register('description')}
            />
          </div>
          <div className="add-account-modal-actions">
            <button type="submit">Add Account</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;