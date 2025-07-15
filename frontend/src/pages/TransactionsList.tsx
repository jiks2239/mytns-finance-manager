import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AddTransactionModal from '../components/AddTransactionModal';
import EditTransactionModal from '../components/EditTransactionModal'; // <-- import (create if not exists)
// ...existing code...

// Import the shared Transaction type
import type { Transaction } from '../types/transaction';

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

const TransactionsList: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [accountName, setAccountName] = useState<string>('');
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const selectedAccountId = Number(accountId);

  // Fetch account name
  useEffect(() => {
    if (!selectedAccountId) return;
    axios.get<{ account_name: string }>(`${API_BASE}/accounts/${selectedAccountId}`)
      .then(res => setAccountName(res.data.account_name))
      .catch(() => setAccountName(''));
  }, [selectedAccountId]);

  // Fetch current balance (only for completed transactions)
  const fetchBalance = React.useCallback(() => {
    if (!selectedAccountId) return;
    axios.get<{ id: number; balance: number }>(`${API_BASE}/accounts/${selectedAccountId}/balance`)
      .then(res => setCurrentBalance(res.data.balance))
      .catch(() => setCurrentBalance(null));
  }, [selectedAccountId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const {
    data: transactions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Transaction[], Error>({
    queryKey: ['transactions', selectedAccountId],
    queryFn: async () => {
      const res = await axios.get<Transaction[]>(
        `${API_BASE}/accounts/${selectedAccountId}/transactions`
      );
      return res.data;
    },
  });

  // Helper to refresh both transactions and balance after a transaction
  const handleTransactionSuccess = async () => {
    await refetch();
    fetchBalance();
  };

  // Action handlers (edit/delete/view)
  const handleEdit = (tx: Transaction) => setEditTx(tx);
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    await axios.delete(`${API_BASE}/transactions/${id}`);
    await handleTransactionSuccess();
  };

  // When navigating back, force a reload to update balances
  const handleBack = () => {
    navigate('/', { state: { refresh: true } });
    // Optionally, you can also use: window.location.reload();
  };

  const formatAmount = (amount: unknown) =>
    amount !== undefined && amount !== null && !isNaN(Number(amount))
      ? '₹' +
        Number(amount).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) +
        '/-'
      : '-';

  // Make sure you do not return null or undefined anywhere except for explicit loading/error states
  if (isLoading) return <div className="loading">Loading transactions…</div>;
  if (isError)    return <div className="error">Error: {error?.message}</div>;

  return (
    <div className="transactions-list-container">
      <div className="header">
        <h1 className="transactions-title">
          Transactions for {accountName ? accountName : `Account ${selectedAccountId}`}
        </h1>
        <button className="add-transaction-btn" onClick={() => setModalOpen(true)}>
          Add Transaction
        </button>
        <button className="back-btn" onClick={handleBack}>
          Back to Accounts
        </button>
      </div>
      <div className="current-balance-area">
        <strong>Current Balance:&nbsp;</strong>
        {currentBalance !== null
          ? currentBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }) + '/-'
          : '...'}
      </div>
      <table className="transactions-table common-table-shadow">
        <thead>
          <tr>
            <th>Created</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Status</th>
            <th>Description</th>
            <th className="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions?.map((tx: Transaction) => (
            <tr key={tx.id}>
              <td>
                {tx.created_at
                  ? new Date(tx.created_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '-'}
              </td>
              <td>{TRANSACTION_TYPE_LABELS[tx.transaction_type] || tx.transaction_type}</td>
              <td>{formatAmount(tx.amount)}</td>
              <td>
                {tx.transaction_date
                  ? new Date(tx.transaction_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : tx.date
                  ? new Date(tx.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '-'}
              </td>
              <td>{TRANSACTION_STATUS_LABELS[tx.status || ''] || tx.status || '-'}</td>
              <td>{tx.description || '-'}</td>
              <td className="actions-cell">
                <Link
                  className="common-action-btn view"
                  to={`/transactions/${tx.id}`}
                  replace={false}
                >
                  View
                </Link>
                <button
                  className="common-action-btn edit"
                  onClick={() => handleEdit(tx)}
                >
                  Edit
                </button>
                <button
                  className="common-action-btn delete"
                  onClick={() => handleDelete(tx.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AddTransactionModal
        isOpen={modalOpen}
        accountId={selectedAccountId}
        onClose={() => setModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />
      {editTx && (
        <EditTransactionModal
          isOpen={!!editTx}
          transaction={editTx}
          onClose={() => setEditTx(null)}
          onSuccess={async () => {
            setEditTx(null);
            await handleTransactionSuccess();
          }}
        />
      )}
    </div>
  );
};

export default TransactionsList;