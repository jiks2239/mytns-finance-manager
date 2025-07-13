import React, { useState, useEffect } from 'react';
import AddAccountModal from '../components/AddAccountModalV2';
import AccountDashboardCard from '../components/AccountDashboardCard';
import '../css/Home.css';

interface Account {
  id: number;
  account_name: string;
  account_type: string;
  // ...other fields as needed
}
const Home: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<number, number | null>>({});

  const fetchAccounts = async () => {
    const res = await fetch('http://localhost:3000/accounts');
    if (res.ok) {
      const data = await res.json();
      setAccounts(data);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length === 0) return;
    const fetchBalances = async () => {
      const newBalances: Record<number, number | null> = {};
      await Promise.all(accounts.map(async (acc) => {
        try {
          const res = await fetch(`http://localhost:3000/accounts/${acc.id}/balance`);
          const data = await res.json();
          newBalances[acc.id] = data.balance;
        } catch {
          newBalances[acc.id] = null;
        }
      }));
      setBalances(newBalances);
    };
    fetchBalances();
  }, [accounts]);

  return (
    <div className="home-root">
      <div className="home-content">
        <h1 className="home-title">Welcome to Your Finance Manager</h1>
        <p className="home-subtitle">Start by adding your first account to manage your finances effortlessly.</p>
        {accounts.length === 0 ? (
          <button className="home-add-btn" onClick={() => setAddModalOpen(true)} aria-label="Add Account">
            + Add Account
          </button>
        ) : (
          <div className="home-accounts-list">
            {accounts.map(acc => (
              <AccountDashboardCard
                key={acc.id}
                id={acc.id}
                name={acc.account_name}
                type={acc.account_type}
                balance={balances[acc.id]}
                onAddRecipient={() => alert('Add Recipient for ' + acc.account_name)}
                onViewRecipients={() => alert('View Recipients for ' + acc.account_name)}
                onAddTransaction={() => alert('Add Transaction for ' + acc.account_name)}
                onViewTransactions={() => alert('View Transactions for ' + acc.account_name)}
                onViewDetails={() => alert('View Details for ' + acc.account_name)}
                onEdit={() => alert('Edit Account ' + acc.account_name)}
                onDelete={() => alert('Delete Account ' + acc.account_name)}
              />
            ))}
            <button
              className="home-add-btn fab"
              onClick={() => setAddModalOpen(true)}
              aria-label="Add Account"
            >
              +
            </button>
          </div>
        )}
      </div>
      <AddAccountModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAccountAdded={fetchAccounts} />
    </div>
  );
};

export default Home;
