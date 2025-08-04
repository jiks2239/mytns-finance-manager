import React, { useState, useEffect } from 'react';
import { Box, Button, Heading, IconButton, SimpleGrid, Text } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import AccountDashboardCard from '../components/AccountDashboardCard';
import AddAccountModal from '../components/AddAccountModal';
import EditAccountModal from '../components/EditAccountModal';
import AddTransactionModal from '../components/AddTransactionModal';
import DeleteAccountModal from '../components/DeleteAccountModal';
import api, { type Account } from '../api';

const bgGradient = 'linear(to-br, #bfdbfe, #fff, #93c5fd)';
const cardBg = '#fff';
const cardBorder = '#dbeafe';
const headingColor = '#1e40af';
const textColor = '#475569';

const Home: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editAccountModalOpen, setEditAccountModalOpen] = useState(false);
  const [addTransactionModalOpen, setAddTransactionModalOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<number, number | null>>({});
  const [pendingCounts, setPendingCounts] = useState<Record<number, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await api.accounts.getAll();
        setAccounts(data);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      const newBalances: Record<number, number | null> = {};
      const newPendingCounts: Record<number, number> = {};
      
      await Promise.all(accounts.map(async (acc) => {
        try {
          const balanceData = await api.accounts.getBalance(acc.id);
          newBalances[acc.id] = balanceData.balance;
          
          const pendingData = await api.accounts.getPendingTransactionsCountByAccount(acc.id);
          newPendingCounts[acc.id] = pendingData.pendingCount;
        } catch {
          newBalances[acc.id] = null;
          newPendingCounts[acc.id] = 0;
        }
      }));
      
      setBalances(newBalances);
      setPendingCounts(newPendingCounts);
    };
    fetchBalances();
  }, [accounts]);

  // Handler functions for account actions
  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setEditAccountModalOpen(true);
  };

  const handleAddTransaction = (account: Account) => {
    setSelectedAccount(account);
    setAddTransactionModalOpen(true);
  };

  const handleViewTransactions = (accountId: number) => {
    // Navigate to a transactions list page for this account (if it exists)
    // For now, we'll navigate to the account details page
    navigate(`/accounts/${accountId}`);
  };

  const handleDeleteAccount = (account: Account) => {
    setSelectedAccount(account);
    setDeleteAccountModalOpen(true);
  };

  const handleAccountDeleted = async () => {
    // Refresh accounts list after deletion
    try {
      const data = await api.accounts.getAll();
      setAccounts(data);
      // Clear balances for deleted account
      if (selectedAccount) {
        setBalances(prev => {
          const updated = { ...prev };
          delete updated[selectedAccount.id];
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to refresh accounts:', error);
    }
  };

  const handleAccountUpdated = async () => {
    // Refresh accounts list after update
    try {
      const data = await api.accounts.getAll();
      setAccounts(data);
      // The useEffect will automatically refresh balances and pending counts when accounts change
    } catch (err) {
      console.error('Failed to refresh accounts:', err);
    }
  };

  return (
    <Box minH="100vh" py={12} px={2} bgGradient={bgGradient} transition="background 0.3s">
      <Box maxW="5xl" mx="auto" bg={cardBg} borderRadius="3xl" boxShadow="2xl" p={10} borderWidth={1} borderColor={cardBorder}>
        <Heading as="h1" size="2xl" color={headingColor} mb={1} textAlign="center" fontWeight="extrabold" letterSpacing="tight" whiteSpace="nowrap">
          Welcome to MyTNS - Finance Manager
        </Heading>
        <Text fontSize="xl" color={textColor} mb={10} textAlign="center" fontWeight="bold">
          Shri Lakshmi Bakery & Sweet Mart
        </Text>
        {accounts.length === 0 ? (
          <Button w="full" py={6} borderRadius="xl" colorScheme="blue" fontWeight="bold" fontSize="xl" boxShadow="lg" mb={2} onClick={() => setAddModalOpen(true)}>
            + Add Account
          </Button>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} gap={6} spacing={4}>
            {accounts.map(acc => (
              <AccountDashboardCard
                key={acc.id}
                id={acc.id}
                name={acc.account_name}
                accountType={acc.account_type}
                balance={balances[acc.id]}
                pendingTransactionsCount={pendingCounts[acc.id] || 0}
                onViewRecipients={() => navigate(`/accounts/${acc.id}/recipients`)}
                onAddTransaction={() => handleAddTransaction(acc)}
                onViewTransactions={() => handleViewTransactions(acc.id)}
                onViewDetails={() => navigate(`/accounts/${acc.id}`)}
                onEdit={() => handleEditAccount(acc)}
                onDelete={() => handleDeleteAccount(acc)}
              />
            ))}
          </SimpleGrid>
        )}
        <IconButton
          icon={<AddIcon boxSize="2rem" />}
          colorScheme="blue"
          borderRadius="full"
          size="lg"
          position="fixed"
          bottom={8}
          right={8}
          boxShadow="2xl"
          aria-label="Add Account"
          onClick={() => setAddModalOpen(true)}
          zIndex={50}
        />
      </Box>
      <AddAccountModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        onAccountAdded={async () => {
          await handleAccountUpdated();
        }} 
      />
      
      {/* Edit Account Modal */}
      {selectedAccount && (
        <EditAccountModal
          isOpen={editAccountModalOpen}
          account={selectedAccount}
          onClose={() => {
            setEditAccountModalOpen(false);
            setSelectedAccount(null);
          }}
          onAccountUpdated={() => {
            setEditAccountModalOpen(false);
            setSelectedAccount(null);
            handleAccountUpdated();
          }}
        />
      )}
      
      {/* Add Transaction Modal */}
      {selectedAccount && (
        <AddTransactionModal
          isOpen={addTransactionModalOpen}
          accountId={selectedAccount.id.toString()}
          onClose={() => {
            setAddTransactionModalOpen(false);
            setSelectedAccount(null);
          }}
          onSuccess={async () => {
            setAddTransactionModalOpen(false);
            setSelectedAccount(null);
            // Refresh accounts to update balances and pending counts
            await handleAccountUpdated();
          }}
        />
      )}
      
      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={deleteAccountModalOpen}
        account={selectedAccount}
        onClose={() => {
          setDeleteAccountModalOpen(false);
          setSelectedAccount(null);
        }}
        onAccountDeleted={() => {
          setDeleteAccountModalOpen(false);
          setSelectedAccount(null);
          handleAccountDeleted();
        }}
      />
    </Box>
  );
};

export default Home;
