import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AccountRow from '../components/AccountRow';
import type { Account } from '../components/AccountRow';
import AddAccountModal from '../components/AddAccountModal';
import EditAccountModal from '../components/EditAccountModal';
import '../css/AccountsList.css';

const API_BASE = 'http://localhost:3000';

const AccountsList: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  async function fetchAccounts() {
    setLoading(true);
    const res = await axios.get<Account[]>(`${API_BASE}/accounts`);
    setAccounts(res.data);

    // Fetch balances for each account
    const balancesObj: Record<number, number> = {};
    await Promise.all(
      res.data.map(async (acc) => {
        const balRes = await axios.get<{ account_id: number; balance: number }>(
          `${API_BASE}/accounts/${acc.id}/balance`
        );
        balancesObj[acc.id] = balRes.data.balance;
      })
    );
    setBalances(balancesObj);
    setLoading(false);
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  const navigate = useNavigate();
  const handleView = (id: number) => {
    navigate(`/accounts/${id}`);
  };
  const handleEdit = (account: Account) => {
  setEditingAccount(account);
  setEditModalOpen(true);
};
  const handleDelete = (id: number) => {
    alert(`Delete account ID ${id}`);
  };

  if (loading) return <div>Loading accounts...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Accounts Dashboard</h2>
      {editingAccount && (
        <EditAccountModal
          isOpen={editModalOpen}
          account={editingAccount}
          onClose={() => setEditModalOpen(false)}
          onAccountUpdated={fetchAccounts}
        />
      )}
      <AddAccountModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAccountAdded={fetchAccounts} />
      <button className="add-account-btn" onClick={() => setAddModalOpen(true)}>+ Add Account</button>
      <div className="accounts-table-wrapper">
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Account Name</th>
              <th className='balance-header'>Current Balance</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <AccountRow
                key={acc.id}
                account={acc}
                balance={balances[acc.id]}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountsList;