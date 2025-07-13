import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AddTransactionModal from '../components/AddTransactionModal';
import EditTransactionModal from '../components/EditTransactionModal';
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

const TRANSACTION_TYPE_LABELS: { [key: string]: string } = {
  cheque: "Cheque",
  online: "Online Transfer",
  cash_deposit: "Cash Deposit",
  internal_transfer: "Internal Transfer",
  bank_charge: "Bank Charge",
  // Add more if needed
};

interface Account {
  id: string;
  account_name: string;
  account_number: string;
  account_type: string;
  bank_name?: string;
  opening_balance: number;
  // Add other fields as needed
}

interface Transaction {
  id: string;
  created_at?: string;
  transaction_type: string;
  amount: number;
  transaction_date?: string;
  date?: string;
  status?: string;
  description?: string;
}

const AccountDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchAccount() {
      const res = await fetch(`${API_BASE}/accounts/${id}`);
      if (!res.ok) {
        setAccount(null);
        return;
      }
      const data: Account = await res.json();
      setAccount(data);
    }
    async function fetchBalance() {
      try {
        const res = await fetch(`${API_BASE}/accounts/${id}/balance`);
        if (!res.ok) {
          setBalance(null);
          return;
        }
        const data = await res.json();
        setBalance(data.balance);
      } catch {
        setBalance(null);
      }
    }
    async function fetchTransactions() {
      try {
        const res = await fetch(`${API_BASE}/accounts/${id}/transactions`);
        if (!res.ok) {
          setTransactions([]);
          return;
        }
        const data: Transaction[] = await res.json();
        setTransactions(data);
      } catch {
        setTransactions([]);
      }
    }
    fetchAccount();
    fetchBalance();
    fetchTransactions();
  }, [id, addTxOpen]);

  if (!id) {
    return (
      <div className="account-details-bg">
        <div className="account-loading-text">Invalid account.</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="account-details-bg">
        <div className="account-loading-text">Loading account details...</div>
      </div>
    );
  }

  const formatCurrency = (val: number | null | undefined) =>
    val == null || isNaN(Number(val))
      ? '-'
      : Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }) + '/-';

  // Add delete handler
  const handleDelete = async (txId: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    await fetch(`${API_BASE}/transactions/${txId}`, { method: 'DELETE' });
    // Refresh transactions after delete
    setTransactions(transactions => transactions.filter(tx => tx.id !== txId));
  };

  return (
    <div className="account-details-bg">
      <div className="account-details-card account-summary-card single-row-summary with-bottom-space account-summary-margin">
        <h2 className="account-summary-title">Account Summary</h2>
        <ul className="account-summary-list-row">
          <li>
            <span className="account-summary-label">Name:</span>
            <span className="account-summary-value">{account.account_name}</span>
          </li>
          <li>
            <span className="account-summary-label">Number:</span>
            <span className="account-summary-value">{account.account_number}</span>
          </li>
          <li>
            <span className="account-summary-label">Type:</span>
            <span className="account-summary-value">{ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type}</span>
          </li>
          <li>
            <span className="account-summary-label">Bank:</span>
            <span className="account-summary-value">{account.bank_name || '-'}</span>
          </li>
          <li>
            <span className="account-summary-label">Opening Balance:</span>
            <span className="account-summary-value">{formatCurrency(account.opening_balance)}</span>
          </li>
          <li>
            <span className="account-summary-label">Current Balance:</span>
            <span className="account-summary-value">{formatCurrency(balance)}</span>
          </li>
        </ul>
        <div className="account-summary-bottom-space" />
      </div>
      <div className="account-details-card transactions-list-card">
        <h3 className="transactions-title">Transactions</h3>
        {transactions.length === 0 ? (
          <div className="transactions-empty-text">No transactions found.</div>
        ) : (
          <table className="transactions-table">
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
              {transactions.map((tx) => (
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
                  <td>{formatCurrency(tx.amount)}</td>
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
                  <td>{tx.status || '-'}</td>
                  <td>{tx.description || '-'}</td>
                  <td className="actions-cell">
                    <Link className="common-action-btn view" to={`/transactions/${tx.id}`}>View</Link>
                    <button className="common-action-btn edit" onClick={() => setEditTx(tx)}>Edit</button>
                    <button className="common-action-btn delete" onClick={() => handleDelete(tx.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="account-details-actions-row">
        <Link
          to={`/accounts/${id}/recipients`}
          className="btn-primary btn-blue account-actions-link"
        >
          View Recipients
        </Link>
        <button
          className="btn-primary btn-green"
          onClick={() => setAddTxOpen(true)}
        >
          Add Transaction
        </button>
        <button
          className="account-details-back-btn btn-gray"
          onClick={() => navigate('/')}
          type="button"
        >
          Back to Accounts
        </button>
      </div>
      <AddTransactionModal
        isOpen={addTxOpen}
        accountId={id!}
        onClose={() => setAddTxOpen(false)}
        onSuccess={() => setAddTxOpen(false)}
      />
      {editTx && (
        <EditTransactionModal
          isOpen={!!editTx}
          transaction={{
            ...editTx,
            status: editTx.status ?? ''
          }}
          onClose={() => setEditTx(null)}
          onSuccess={() => {
            setEditTx(null);
            // Optionally, refresh transactions here if needed
          }}
        />
      )}
    </div>
  );
};

export default AccountDetails;