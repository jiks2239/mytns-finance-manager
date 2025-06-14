import React, { useState, useEffect } from 'react';
import '../css/AddAccountModal.css';

interface EditAccountModalProps {
  isOpen: boolean;
  account: any; // Replace 'any' with your Account type if you have it imported
  onClose: () => void;
  onAccountUpdated: () => void;
}

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
  const [account_name, setAccountName] = useState('');
  const [account_number, setAccountNumber] = useState('');
  const [account_type, setAccountType] = useState('');
  const [bank_name, setBankName] = useState('');
  const [opening_balance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setAccountName(account.account_name || '');
      setAccountNumber(account.account_number || '');
      setAccountType(account.account_type || '');
      setBankName(account.bank_name || '');
      setOpeningBalance(account.opening_balance?.toString() || '');
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:3000/accounts/${account.id}`, {
        method: 'PATCH', // Or PUT if that's what your backend expects
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name,
          account_number,
          account_type,
          bank_name,
          opening_balance: parseFloat(opening_balance),
        }),
      });
      if (!res.ok) throw new Error('Failed to update account');
      onAccountUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating account');
    }
    setLoading(false);
  };

  return (
    <div className="add-account-modal-overlay">
      <form onSubmit={handleSubmit} className="add-account-modal-form">
        <h3>Edit Account</h3>
        <label>
          Account Name:
          <input required value={account_name} onChange={e => setAccountName(e.target.value)} />
        </label>
        <label>
          Account Number:
          <input value={account_number} onChange={e => setAccountNumber(e.target.value)} />
        </label>
        <label>
          Account Type:
          <select required value={account_type} onChange={e => setAccountType(e.target.value)}>
            <option value="" disabled>
              -- Select Account Type --
            </option>
            {ACCOUNT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>
        <label>
          Bank Name:
          <input value={bank_name} onChange={e => setBankName(e.target.value)} />
        </label>
        <label>
          Opening Balance:
          <input required type="number" value={opening_balance} onChange={e => setOpeningBalance(e.target.value)} />
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