import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../css/AccountDetails.css';

const API_BASE = 'http://localhost:3000';

const ACCOUNT_TYPE_LABELS: { [key: string]: string } = {
  current: 'Current Account',
  savings: 'Savings Account',
  cash: 'Cash',
  credit_card: 'Credit Card',
  loan: 'Loan',
  other: 'Other'
};

const AccountDetails: React.FC = () => {
  const { id } = useParams();
  const [account, setAccount] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchAccount() {
      const res = await fetch(`${API_BASE}/accounts/${id}`);
      const data = await res.json();
      setAccount(data);
    }
    async function fetchBalance() {
      try {
        const res = await fetch(`${API_BASE}/accounts/${id}/balance`);
        const data = await res.json();
        setBalance(data.balance);
      } catch (e) {
        setBalance(null);
      }
    }
    fetchAccount();
    fetchBalance();
  }, [id]);

  if (!account) {
    return (
      <div className="account-details-bg">
        <div style={{ color: '#333', fontSize: 20 }}>Loading account details...</div>
      </div>
    );
  }

  const formatCurrency = (val: any) =>
    isNaN(Number(val))
      ? '-'
      : Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }) + '/-';

  return (
    <div className="account-details-bg">
      <div className="account-details-card">
        <h2 className="account-details-title">
          Account Details
        </h2>
        <div className="account-details-row">
          <span className="account-details-label">Account Name:</span>
          <span className="account-details-value">{account.account_name}</span>
        </div>
        <div className="account-details-row">
          <span className="account-details-label">Account Number:</span>
          <span className="account-details-value">{account.account_number}</span>
        </div>
        <div className="account-details-row">
          <span className="account-details-label">Account Type:</span>
          <span className="account-details-value">
            {ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type}
          </span>
        </div>
        <div className="account-details-row">
          <span className="account-details-label">Bank Name:</span>
          <span className="account-details-value">{account.bank_name || '-'}</span>
        </div>
        <div className="account-details-row">
          <span className="account-details-label">Opening Balance:</span>
          <span className="account-details-value">{formatCurrency(account.opening_balance)}</span>
        </div>
        <div className="account-details-row">
          <span className="account-details-label">Current Balance:</span>
          <span className="account-details-value">{formatCurrency(balance)}</span>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;