import React, { useState } from 'react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
}

const ACCOUNT_TYPES = [
  'current',
  'savings',
  'cash',
  'credit_card',
  'loan',
  'other',
];

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAccountAdded }) => {
  const [account_name, setAccountName] = useState('');
  const [account_number, setAccountNumber] = useState('');
  const [account_type, setAccountType] = useState('current');
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
      setAccountType('current');
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
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 32, borderRadius: 8, minWidth: 300 }}>
        <h3>Add Account</h3>
        <div>
          <label>Account Name: <input required value={account_name} onChange={e => setAccountName(e.target.value)} /></label>
        </div>
        <div>
          <label>Account Number: <input value={account_number} onChange={e => setAccountNumber(e.target.value)} /></label>
        </div>
        <div>
          <label>Account Type:
            <select value={account_type} onChange={e => setAccountType(e.target.value)}>
              {ACCOUNT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label>Bank Name: <input value={bank_name} onChange={e => setBankName(e.target.value)} /></label>
        </div>
        <div>
          <label>Opening Balance: <input required type="number" value={opening_balance} onChange={e => setOpeningBalance(e.target.value)} /></label>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div style={{ marginTop: 16 }}>
          <button type="button" onClick={onClose} style={{ marginRight: 8 }} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Account'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddAccountModal;