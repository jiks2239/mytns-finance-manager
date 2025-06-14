import React from 'react';

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
    <td>{account.account_type}</td>
    <td>{account.bank_name}</td>
    <td>{account.opening_balance}</td>
    <td>{balance !== undefined ? balance : '...'}</td>
    <td>
      <button onClick={() => onView(account.id)}>View</button>
      <button onClick={() => onEdit(account.id)}>Edit</button>
      <button onClick={() => onDelete(account.id)}>Delete</button>
      {/* <button onClick={() => onTransactions?.(account.id)}>Transactions</button> */}
    </td>
  </tr>
);

export default AccountRow;