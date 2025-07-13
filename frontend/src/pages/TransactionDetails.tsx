import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../css/AccountDetails.css';

const API_BASE = 'http://localhost:3000';

const TRANSACTION_TYPE_LABELS: { [key: string]: string } = {
  cheque: 'Cheque',
  online: 'Online',
  cash_deposit: 'Cash Deposit',
  internal_transfer: 'Internal Transfer',
  bank_charge: 'Bank Charge',
  other: 'Other',
};

const TRANSACTION_STATUS_LABELS: { [key: string]: string } = {
  completed: 'Completed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  failed: 'Failed',
  bounced: 'Bounced',
  transferred: 'Transferred',
  cleared: 'Cleared',
};

type Transaction = {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  transaction_date?: string;
  date?: string;
  created_at?: string;
  description?: string;
  // Add other fields as needed
};

const TransactionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/transactions/${id}`)
      .then(res => {
        if (res.status === 404) {
          setTransaction(null);
        } else {
          return res.json().then(setTransaction);
        }
      })
      .catch(() => setTransaction(null));
  }, [id]);

  const formatAmount = (amount: unknown) =>
    amount !== undefined && amount !== null && !isNaN(Number(amount))
      ? '₹' +
        Number(amount).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) +
        '/-'
      : '-';

  if (!id) {
    // If no id param, do not redirect, just show not found
    return (
      <div className="account-details-bg">
        <div className="common-text-error common-fs-20">Transaction not found.</div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="account-details-bg">
        <div className="common-text-secondary common-fs-20">Loading transaction details...</div>
      </div>
    );
  }

  const formatDate = (val?: string) =>
    val
      ? new Date(val).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '-';

  return (
    <div className="account-details-bg">
      <div className="account-details-card">
        <h2 className="account-details-title">Transaction Details</h2>
        <div className="account-details-row">
          <span className="account-details-label">Type:</span>
          <span className="account-details-value">
            {TRANSACTION_TYPE_LABELS[transaction.transaction_type] || transaction.transaction_type}
          </span>
        </div>
        <div className="account-details-row">
          <span className="account-details-label">Amount:</span>
          <span className="account-details-value">{formatAmount(transaction.amount)}</span>
        </div>
        <div className="account-details-row">
          <span className="account-details-label">Status:</span>
          <span className="account-details-value">
            {TRANSACTION_STATUS_LABELS[transaction.status] || transaction.status || '-'}
          </span>
        </div>
        <div className="account-details-row">
          <span className="account-details-label">Transaction Date:</span>
          <span className="account-details-value">{formatDate(transaction.transaction_date || transaction.date)}</span>
        </div>
        <div className="account-details-row">
          <span className="account-details-label">Created At:</span>
          <span className="account-details-value">{formatDate(transaction.created_at)}</span>
        </div>
        <div className="account-details-row">
          <span className="account-details-label">Description:</span>
          <span className="account-details-value">{transaction.description || '-'}</span>
        </div>
        {/* Add more fields as needed */}
      </div>
      <div className="account-details-actions">
        <button
          className="account-details-back-btn"
          onClick={() => location.key === 'default' ? navigate('/') : navigate(-1)}
          type="button"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default TransactionDetails;
