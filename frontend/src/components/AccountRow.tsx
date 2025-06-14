import React from 'react';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  current: "Current Account",
  savings: "Savings Account",
  cash: "Cash",
  credit_card: "Credit Card",
  loan: "Loan",
  other: "Other"
};

// Define the shape of an account (adjust as per your backend)
export interface Account {
  id: number;
  account_name: string;
  account_number: string;
  account_type: string;
  bank_name?: string;
  opening_balance: number;
}

interface AccountRowProps {
  account: Account;
  balance?: number;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  // onTransactions?: (id: number) => void; // Uncomment if needed
}

const AccountRow: React.FC<AccountRowProps> = ({
  account,
  balance,
  onView,
  onEdit,
  onDelete,
  // onTransactions,
}) => (
  <tr>
    <td>{account.account_name}</td>
    <td>{account.account_number}</td>
    <td>{ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type}</td>
    <td>{account.bank_name}</td>
    <td className="balance-cell">
      {Number(account.opening_balance)
        .toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })
        .replace(/\s/g, '').replace('.00', '') + '/-'}
    </td>
    <td className="balance-cell">
      {balance !== undefined
        ? balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).replace(/\s/g, '').replace('.00', '') + '/-'
        : '...'}
    </td>
    <td className="actions-cell">
      <button className="action-btn" onClick={() => onView(account.id)}>View</button>
      <button className="action-btn" onClick={() => onEdit(account.id)}>Edit</button>
      <button className="action-btn" onClick={() => onDelete(account.id)}>Delete</button>
      {/* <button className="action-btn" onClick={() => onTransactions?.(account.id)}>Transactions</button> */}
    </td>
  </tr>
);

export default AccountRow;