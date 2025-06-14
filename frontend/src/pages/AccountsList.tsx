import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AccountRow from '../components/AccountRow';
import type { Account } from '../components/AccountRow';
import AddAccountModal from '../components/AddAccountModal';
import '../css/AccountsList.css';

const API_BASE = 'http://localhost:3000';

const AccountsList: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

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

  const handleView = (id: number) => {
    alert(`View details for account ID ${id}`);
  };
  const handleEdit = (id: number) => {
    alert(`Edit account ID ${id}`);
  };
  const handleDelete = (id: number) => {
    alert(`Delete account ID ${id}`);
  };

  if (loading) return <div>Loading accounts...</div>;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Accounts Dashboard</h2>
      <AddAccountModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAccountAdded={fetchAccounts} />
      <button className="add-account-btn" onClick={() => setAddModalOpen(true)}>+ Add Account</button>
      <table className="accounts-table">
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Account Number</th>
            <th>Account Type</th>
            <th>Bank Name</th>
            <th className='balance-header'>Opening Balance</th>
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
  );
};

export default AccountsList;