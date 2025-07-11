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
  onEdit: (account: Account) => void;
  onDelete: (id: number) => void;
  onAccountNameClick?: (id: number) => void;
}

const AccountRow: React.FC<AccountRowProps> = ({
  account,
  balance,
  onEdit,
  onDelete,
  onAccountNameClick,
}) => (
  <tr>
    <td
      className="account-name-cell"
      tabIndex={0}
      onClick={() => onAccountNameClick?.(account.id)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onAccountNameClick?.(account.id); }}
      role="button"
      aria-label={`View details for ${account.account_name}`}
    >
      {account.account_name}
    </td>
    <td className="balance-cell">
      {balance !== undefined
        ? balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).replace(/\s/g, '').replace('.00', '') + '/-'
        : '...'}
    </td>
    <td className="actions-cell">
      <button className="common-action-btn edit" onClick={() => onEdit(account)}>Edit</button>
      <button className="common-action-btn delete" onClick={() => onDelete(account.id)}>Delete</button>
    </td>
  </tr>
);

export default AccountRow;