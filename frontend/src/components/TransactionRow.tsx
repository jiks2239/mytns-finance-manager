import React from 'react';
import { Link } from 'react-router-dom';

export interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  transaction_date?: string;
  date?: string;
  created_at?: string;
  description?: string;
  status?: string;
}

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
}

const TRANSACTION_TYPE_LABELS: { [key: string]: string } = {
  cheque: 'Cheque',
  online: 'Online',
  cash_deposit: 'Cash Deposit',
  internal_transfer: 'Internal Transfer',
  bank_charge: 'Bank Charge',
  other: 'Other',
};

const formatDate = (val?: string) =>
  val
    ? new Date(val).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '-';

const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => (
  <tr>
    <td>{formatDate(transaction.created_at)}</td>
    <td>{TRANSACTION_TYPE_LABELS[transaction.transaction_type] || transaction.transaction_type}</td>
    <td>{transaction.amount}</td>
    <td>
      {formatDate(transaction.transaction_date || transaction.date)}
    </td>
    <td>{transaction.status || '-'}</td>
    <td>{transaction.description || '-'}</td>
    <td className="actions-cell">
      <Link className="common-action-btn view" to={`/transactions/${transaction.id}`}>View</Link>
      <button className="common-action-btn edit" onClick={() => onEdit(transaction)}>Edit</button>
      <button className="common-action-btn delete" onClick={() => onDelete(transaction.id)}>Delete</button>
    </td>
  </tr>
);

export default TransactionRow;
