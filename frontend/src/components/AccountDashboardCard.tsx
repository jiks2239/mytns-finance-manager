import React from 'react';
import { FaUserPlus, FaUsers, FaPlusCircle, FaList, FaInfoCircle, FaEdit, FaTrash } from 'react-icons/fa';
import './AccountDashboardCard.css';
import AddRecipientModal from './AddRecipientModal';

interface AccountDashboardCardProps {
  id: number;
  name: string;
  type: string;
  balance: number | null;
  onAddRecipient: () => void;
  onViewRecipients: () => void;
  onAddTransaction: () => void;
  onViewTransactions: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AccountDashboardCard: React.FC<AccountDashboardCardProps> = ({
  id, name, type, balance,
  onViewRecipients, onAddTransaction, onViewTransactions, onViewDetails, onEdit, onDelete
}) => {
  const [addRecipientOpen, setAddRecipientOpen] = React.useState(false);

  return (
    <div className="account-dashboard-card">
      <div className="adc-header">
        <div>
          <div className="adc-title">{name}</div>
          <div className="adc-type">{type.replace(/^(.)/, c => c.toUpperCase())}</div>
        </div>
        <div className="adc-balance">
          {balance !== null && balance !== undefined
            ? `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            : 'Loading...'}
        </div>
      </div>
      <div className="adc-actions">
        <button data-label="Add Recipient" title="Add Recipient" onClick={() => setAddRecipientOpen(true)}>
          <FaUserPlus />
        </button>
        <button data-label="View Recipients" title="View Recipients" onClick={onViewRecipients}>
          <FaUsers />
        </button>
        <button data-label="Add Transaction" title="Add Transaction" onClick={onAddTransaction}>
          <FaPlusCircle />
        </button>
        <button data-label="View Transactions" title="View Transactions" onClick={onViewTransactions}>
          <FaList />
        </button>
        <button data-label="View Details" title="View Details" onClick={onViewDetails}>
          <FaInfoCircle />
        </button>
        <button data-label="Edit Account" title="Edit Account" onClick={onEdit}>
          <FaEdit />
        </button>
        <button data-label="Delete Account" title="Delete Account" className="adc-delete" onClick={onDelete}>
          <FaTrash />
        </button>
      </div>
      <AddRecipientModal
        isOpen={addRecipientOpen}
        onClose={() => setAddRecipientOpen(false)}
        name={name}
        accountId={id}
        onRecipientAdded={() => setAddRecipientOpen(false)}
      />
    </div>
  );
};

export default AccountDashboardCard;
