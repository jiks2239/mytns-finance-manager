import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AccountRow from '../components/AccountRow';
import type { Account } from '../components/AccountRow';
import '../css/AccountsList.css';

const API_BASE = 'http://localhost:3000';

const AccountsList: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
      <button className="add-account-btn">+ Add Account</button>
      <table className="accounts-table" border={1} cellPadding={8} cellSpacing={0}>
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Account Number</th>
            <th>Account Type</th>
            <th>Bank Name</th>
            <th>Opening Balance</th>
            <th>Current Balance</th>
            <th>Actions</th>
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