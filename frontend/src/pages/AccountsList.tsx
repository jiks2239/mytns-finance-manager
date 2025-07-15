import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import AccountRow from '../components/AccountRow';
import type { Account } from '../components/AccountRow';
import AddAccountModal from '../components/AddAccountModal';
import CustomPopup from '../components/CustomPopup';
// ...existing code...

const API_BASE = 'http://localhost:3000';

type AccountWithBalance = Account & { balance: number };

const AccountsList: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [, setEditModalOpen] = useState(false);
  const [, setEditingAccount] = useState<Account | null>(null);
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
    } catch {
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
    } catch (err: unknown) {
      const errorMessage =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to delete account';
      setErrorPopup({ open: true, message: errorMessage });
      setPopupOpen(false);
    }
  };

  if (isLoading) return <div>Loading accounts...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-blue-700">Accounts Dashboard</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition" onClick={() => setAddModalOpen(true)}>+ Add Account</button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accounts?.map(acc => (
                <AccountRow
                  key={acc.id}
                  account={acc}
                  balance={acc.balance}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAccountNameClick={(id: number) => navigate(`/accounts/${id}`)}
                  onViewRecipients={(id: number) => navigate(`/accounts/${id}/recipients`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AddAccountModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAccountAdded={async () => { await refetch(); }} />
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