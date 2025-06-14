import React, { useState } from 'react';
import '../css/AddAccountModal.css';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'current', label: 'Current Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'loan', label: 'Loan' },
  { value: 'other', label: 'Other' },
];

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAccountAdded }) => {
  const [account_name, setAccountName] = useState('');
  const [account_number, setAccountNumber] = useState('');
  const [account_type, setAccountType] = useState('');
  const [bank_name, setBankName] = useState('');
  const [opening_balance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3000/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name,
          account_number,
          account_type,
          bank_name: bank_name || undefined,
          opening_balance: parseFloat(opening_balance),
        }),
      });
      if (!res.ok) throw new Error('Failed to add account');
      setAccountName('');
      setAccountNumber('');
      setAccountType('');
      setBankName('');
      setOpeningBalance('');
      onAccountAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error adding account');
    }
    setLoading(false);
  };

  return (
    <div className="add-account-modal-overlay">
      <form onSubmit={handleSubmit} className="add-account-modal-form">
        <h3>Add Account</h3>
        <div>
          <label>
            Account Name:
            <input required value={account_name} onChange={e => setAccountName(e.target.value)} />
          </label>
        </div>
        <div>
          <label>
            Account Number:
            <input value={account_number} onChange={e => setAccountNumber(e.target.value)} />
          </label>
        </div>
        <div>
          <label>
            Account Type:
            <select value={account_type} onChange={e => setAccountType(e.target.value)}>
              <option value="" disabled>
                -- Select Account Type --
              </option>
              {ACCOUNT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Bank Name:
            <input value={bank_name} onChange={e => setBankName(e.target.value)} />
          </label>
        </div>
        <div>
          <label>
            Opening Balance:
            <input required type="number" value={opening_balance} onChange={e => setOpeningBalance(e.target.value)} />
          </label>
        </div>
        {error && <div className="add-account-modal-error">{error}</div>}
        <div className="add-account-modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Account'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddAccountModal;