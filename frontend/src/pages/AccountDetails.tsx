import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Flex, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Button, IconButton, useColorModeValue, Stack, Tooltip, Badge, Avatar
} from '@chakra-ui/react';
import { ArrowBackIcon, AddIcon, ViewIcon, EditIcon, DeleteIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { FaUniversity, FaWallet } from 'react-icons/fa';
import AddTransactionModal from '../components/AddTransactionModal';
import EditTransactionModal from '../components/EditTransactionModal';
import EditAccountModal from '../components/EditAccountModal';
import DeleteAccountModal from '../components/DeleteAccountModal';

const API_BASE = 'http://localhost:3000';

const ACCOUNT_TYPE_LABELS: { [key: string]: string } = {
  current: 'Current Account',
  savings: 'Savings Account',
  cash: 'Cash',
  credit_card: 'Credit Card',
  loan: 'Loan',
  other: 'Other'
};

const TRANSACTION_TYPE_LABELS: { [key: string]: string } = {
  cheque: "Cheque",
  online: "Online Transfer",
  cash_deposit: "Cash Deposit",
  internal_transfer: "Internal Transfer",
  bank_charge: "Bank Charge",
  // Add more if needed
};

interface Account {
  id: string;
  account_name: string;
  account_number: string;
  account_type: string;
  bank_name?: string;
  opening_balance: number;
  // Add other fields as needed
}

interface Transaction {
  id: string;
  created_at?: string;
  transaction_type: string;
  amount: number;
  transaction_date?: string;
  date?: string;
  status?: string;
  description?: string;
}

const AccountDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAccountOpen, setEditAccountOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchAccount() {
      const res = await fetch(`${API_BASE}/accounts/${id}`);
      if (!res.ok) {
        setAccount(null);
        return;
      }
      const data: Account = await res.json();
      setAccount(data);
    }
    async function fetchBalance() {
      try {
        const res = await fetch(`${API_BASE}/accounts/${id}/balance`);
        if (!res.ok) {
          setBalance(null);
          return;
        }
        const data = await res.json();
        setBalance(data.balance);
      } catch {
        setBalance(null);
      }
    }
    async function fetchTransactions() {
      try {
        const res = await fetch(`${API_BASE}/accounts/${id}/transactions`);
        if (!res.ok) {
          setTransactions([]);
          return;
        }
        const data: Transaction[] = await res.json();
        setTransactions(data);
      } catch {
        setTransactions([]);
      }
    }
    fetchAccount();
    fetchBalance();
    fetchTransactions();
  }, [id, addTxOpen]);

  // Color mode values
  const bgPage = useColorModeValue('linear(to-br, blue.50, white, blue.100)', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('blue.100', 'gray.700');
  const subHeadingColor = useColorModeValue('blue.800', 'blue.100');
  const tableHeaderBg = useColorModeValue('blue.50', 'gray.700');
  const badgeBg = useColorModeValue('blue.100', 'blue.900');
  const badgeColor = useColorModeValue('blue.800', 'blue.100');

  if (!id) {
    return (
      <Flex minH="60vh" align="center" justify="center" bg={bgPage}> 
        <Text fontSize="xl" color="red.500">Invalid account.</Text>
      </Flex>
    );
  }

  if (!account) {
    return (
      <Flex minH="60vh" align="center" justify="center" bg={bgPage}> 
        <Text fontSize="xl" color="gray.500">Loading account details...</Text>
      </Flex>
    );
  }

  const formatCurrency = (val: number | null | undefined) =>
    val == null || isNaN(Number(val))
      ? '-'
      : Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }) + '/-';

  const displayBalance = balance;

  // Add delete handler
  const handleDelete = async (txId: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    await fetch(`${API_BASE}/transactions/${txId}`, { method: 'DELETE' });
    // Refresh transactions after delete
    setTransactions(transactions => transactions.filter(tx => tx.id !== txId));
  };

  // Add account update handler
  const handleAccountUpdated = async () => {
    // Refresh account data after update
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/accounts/${id}`);
      if (res.ok) {
        const data: Account = await res.json();
        setAccount(data);
      }
      
      // Also refresh balance
      const balanceRes = await fetch(`${API_BASE}/accounts/${id}/balance`);
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance);
      }
    } catch (err) {
      console.error('Failed to refresh account data:', err);
    }
  };

  // Handle account deletion
  const handleAccountDeleted = () => {
    // Navigate back to home page after successful deletion
    navigate('/');
  };

  return (
    <Box minH="100vh" py={10} px={2} bgGradient={bgPage} transition="background 0.3s">
      <Box maxW="5xl" mx="auto" bg={cardBg} borderRadius="2xl" boxShadow="2xl" p={{ base: 4, md: 10 }} borderWidth={1} borderColor={cardBorder}>
        {/* Header Card */}
        <Flex align="center" gap={6} mb={8} direction={{ base: 'column', md: 'row' }} bgGradient="linear(to-r, blue.400, blue.600)" borderRadius="xl" p={6} boxShadow="lg">
          <Avatar size="xl" name={account.account_name} bg="white" color="blue.700" icon={<FaWallet fontSize="2rem" />} />
          <Box flex={1} color="white" minW={0}>
            <Flex align="center" gap={3} mb={1}>
              <Heading as="h2" size="lg" fontWeight="extrabold" letterSpacing="tight" wordBreak="break-word">
                {account.account_name}
              </Heading>
              <IconButton
                aria-label="Edit Account"
                icon={<EditIcon />}
                size="sm"
                colorScheme="whiteAlpha"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setEditAccountOpen(true)}
              />
              <IconButton
                aria-label="Delete Account"
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="whiteAlpha"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setDeleteAccountOpen(true)}
              />
            </Flex>
            <Stack direction={{ base: 'column', sm: 'row' }} align={{ base: 'flex-start', sm: 'center' }} spacing={4} mb={2}>
              <Badge bg={badgeBg} color={badgeColor} px={3} py={1} borderRadius="md" fontWeight="bold" fontSize="md">
                {ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type}
              </Badge>
              {account.bank_name && (
                <Stack direction="row" align="center" spacing={1}>
                  <Box as={FaUniversity} color="whiteAlpha.800" />
                  <Text fontWeight="medium" fontSize="md" wordBreak="break-word">{account.bank_name}</Text>
                </Stack>
              )}
            </Stack>
            {account.account_type !== 'cash' && account.account_number && (
              <Text fontSize="md" opacity={0.85} wordBreak="break-word">Account No: <b>{account.account_number}</b></Text>
            )}
          </Box>
          {/* Balance Information */}
          <Box color="white" textAlign={{ base: 'center', md: 'right' }} minW="200px">
            <Text fontSize="sm" opacity={0.85} mb={1}>Opening Balance</Text>
            <Text fontSize="lg" fontWeight="bold" mb={3}>{formatCurrency(account.opening_balance)}</Text>
            <Text fontSize="sm" opacity={0.85} mb={1}>Current Balance</Text>
            <Text fontSize="xl" fontWeight="extrabold" color="white">{formatCurrency(displayBalance)}</Text>
          </Box>
        </Flex>
        {/* Transactions Table */}
        <Flex align="center" justify="space-between" mb={2} gap={2} flexWrap="wrap">
          <Heading as="h3" size="md" color={subHeadingColor} fontWeight="bold">Transactions</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="green" variant="solid" onClick={() => setAddTxOpen(true)}>
            Add Transaction
          </Button>
        </Flex>
        {transactions.length === 0 ? (
          <Text color="gray.500" mb={6} textAlign="center">No transactions found.</Text>
        ) : (
          <Box overflowX="auto" mb={6} borderRadius="lg" borderWidth={1} borderColor={cardBorder} boxShadow="sm">
            <Table variant="simple" size="md" bg={cardBg}>
              <Thead position="sticky" top={0} zIndex={1} bg={tableHeaderBg}>
                <Tr>
                  <Th>Created</Th>
                  <Th>Type</Th>
                  <Th>Amount</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Description</Th>
                  <Th textAlign="center">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((tx) => {
                  // eslint-disable-next-line react-hooks/rules-of-hooks
                  const trHoverBg = useColorModeValue('blue.50', 'gray.700');
                  return (
                    <Tr key={tx.id} _hover={{ bg: trHoverBg }}>
                      <Td>
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleDateString('en-US', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                            })
                          : '-'}
                      </Td>
                      <Td>{TRANSACTION_TYPE_LABELS[tx.transaction_type] || tx.transaction_type}</Td>
                      <Td color={tx.amount < 0 ? 'red.500' : 'green.600'} fontWeight="bold">{formatCurrency(tx.amount)}</Td>
                      <Td>
                        {tx.transaction_date
                          ? new Date(tx.transaction_date).toLocaleDateString('en-US', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                            })
                          : tx.date
                          ? new Date(tx.date).toLocaleDateString('en-US', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                            })
                          : '-'}
                      </Td>
                      <Td>{tx.status || '-'}</Td>
                      <Td>{tx.description || '-'}</Td>
                      <Td textAlign="center">
                        <Stack direction="row" spacing={1} justify="center">
                          <Tooltip label="View"><span><IconButton as={Link} to={`/transactions/${tx.id}`} aria-label="View" icon={<ViewIcon />} size="sm" colorScheme="blue" variant="ghost" /></span></Tooltip>
                          <Tooltip label="Edit"><span><IconButton aria-label="Edit" icon={<EditIcon />} size="sm" colorScheme="yellow" variant="ghost" onClick={() => setEditTx(tx)} /></span></Tooltip>
                          <Tooltip label="Delete"><span><IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" colorScheme="red" variant="ghost" onClick={() => handleDelete(tx.id)} /></span></Tooltip>
                        </Stack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
        <Flex gap={3} justify="flex-end" mt={6} flexWrap="wrap">
          <Button as={Link} to={`/accounts/${id}/recipients`} colorScheme="blue" variant="outline" leftIcon={<InfoOutlineIcon />}>
            View Recipients
          </Button>
          <Button leftIcon={<ArrowBackIcon />} colorScheme="gray" variant="solid" onClick={() => navigate('/')}> 
            Back to Accounts
          </Button>
        </Flex>
      </Box>
      <AddTransactionModal
        isOpen={addTxOpen}
        accountId={id!}
        onClose={() => setAddTxOpen(false)}
        onSuccess={() => setAddTxOpen(false)}
      />
      {editTx && (
        <EditTransactionModal
          isOpen={!!editTx}
          transaction={{
            ...editTx,
            status: editTx.status ?? ''
          }}
          onClose={() => setEditTx(null)}
          onSuccess={() => {
            setEditTx(null);
            // Optionally, refresh transactions here if needed
          }}
        />
      )}
      
      {/* Edit Account Modal */}
      <EditAccountModal
        isOpen={editAccountOpen}
        account={account}
        onClose={() => setEditAccountOpen(false)}
        onAccountUpdated={() => {
          setEditAccountOpen(false);
          handleAccountUpdated();
        }}
      />
      
      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={deleteAccountOpen}
        account={account ? {
          id: parseInt(account.id),
          account_name: account.account_name,
          account_type: account.account_type,
          opening_balance: account.opening_balance
        } : null}
        onClose={() => setDeleteAccountOpen(false)}
        onAccountDeleted={handleAccountDeleted}
      />
    </Box>
  );
};

export default AccountDetails;