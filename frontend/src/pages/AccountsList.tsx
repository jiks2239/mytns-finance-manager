import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import AccountRow from '../components/AccountRow';
import type { Account } from '../components/AccountRow';
import AddAccountModal from '../components/AddAccountModal';
import EditAccountModal from '../components/EditAccountModal';
import CustomPopup from '../components/CustomPopup';
import '../css/AccountsList.css';

const API_BASE = 'http://localhost:3000';

type AccountWithBalance = Account & { balance: number };

const AccountsList: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<number | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [errorPopup, setErrorPopup] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const location = useLocation();

  const {
    data: accounts,
    isLoading,
    refetch,
  } = useQuery<AccountWithBalance[], Error>({
    queryKey: ['accountsWithBalance'],
    queryFn: async () => {
      const res = await axios.get<Account[]>(`${API_BASE}/accounts`);
      // Fetch balance for each account using the backend's balance endpoint
      const accountsWithBalance = await Promise.all(
        res.data.map(async acc => {
          const balRes = await axios.get<{ id: number; balance: number }>(
            `${API_BASE}/accounts/${acc.id}/balance`
          );
          return { ...acc, balance: balRes.data.balance };
        })
      );
      return accountsWithBalance;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // data stays fresh for 5 minutes
  });

  // Refetch accounts if coming back from transactions with refresh state
  useEffect(() => {
    if (location.state && location.state.refresh) {
      refetch();
      // Remove the refresh state so it doesn't refetch again on next navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refetch]);

  const navigate = useNavigate();
  const handleEdit = async (account: Account) => {
    // Fetch latest account details before editing
    try {
      const res = await axios.get<Account>(`${API_BASE}/accounts/${account.id}`);
      setEditingAccount(res.data);
      setEditModalOpen(true);
    } catch (err) {
      setErrorPopup({ open: true, message: 'Failed to fetch account details for editing.' });
    }
  };
  const handleDelete = (id: number) => {
    setDeleteAccountId(id);
    setPopupOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteAccountId == null) return;
    try {
      await axios.delete(`${API_BASE}/accounts/${deleteAccountId}`);
      setDeleteAccountId(null);
      setPopupOpen(false);
      await refetch();
    } catch (err: any) {
      setErrorPopup({ open: true, message: err?.message || 'Failed to delete account' });
      setPopupOpen(false);
    }
  };

  if (isLoading) return <div>Loading accounts...</div>;

  return (
    <div className="container">
      <h2 className="dashboard-title">Accounts Dashboard</h2>
      {editingAccount && (
        <EditAccountModal
          isOpen={editModalOpen}
          account={editingAccount}
          onClose={() => setEditModalOpen(false)}
          onAccountUpdated={() => refetch()}
        />
      )}
      <AddAccountModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAccountAdded={async () => { await refetch(); }} />
      <div className="accounts-table-wrapper common-table-shadow">
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Account Name</th>
              <th className='balance-header'>Current Balance</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts?.map(acc => (
              <AccountRow
                key={acc.id}
                account={acc}
                balance={acc.balance}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAccountNameClick={(id: number) => navigate(`/accounts/${id}`)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="add-account-btn-wrapper">
        <button className="btn-primary" onClick={() => setAddModalOpen(true)}>+ Add Account</button>
      </div>
      <CustomPopup
        open={popupOpen}
        message="Are you sure you want to delete this account?"
        type="warning"
        onClose={() => {
          setPopupOpen(false);
          setDeleteAccountId(null);
        }}
        onConfirm={confirmDelete}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
      />
      <CustomPopup
        open={errorPopup.open}
        message={errorPopup.message}
        type="error"
        onClose={() => setErrorPopup({ open: false, message: "" })}
      />
    </div>
  );
};

export default AccountsList;