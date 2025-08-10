import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box, Flex, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Button, IconButton, useColorModeValue, Stack, Tooltip, Badge, Avatar,
  Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Card, CardBody, Alert, AlertIcon
} from '@chakra-ui/react';
import { ArrowBackIcon, AddIcon, ViewIcon, EditIcon, DeleteIcon, InfoOutlineIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { FaUniversity, FaWallet } from 'react-icons/fa';
import AddTransactionWizard from '../components/AddTransactionWizard';
import EditTransactionModal from '../components/EditTransactionModal';
import EditAccountModal from '../components/EditAccountModal';
import DeleteAccountModal from '../components/DeleteAccountModal';
import api from '../api';
import type { Account, Transaction } from '../api';

const ACCOUNT_TYPE_LABELS: { [key: string]: string } = {
  current: 'Current Account',
  savings: 'Savings Account',
  cash: 'Cash',
  credit_card: 'Credit Card',
  loan: 'Loan',
  other: 'Other'
};

const TRANSACTION_TYPE_LABELS: { [key: string]: string } = {
  // Legacy types
  cheque: "Cheque",
  online: "Online Transfer",
  internal_transfer: "Internal Transfer",
  bank_charge: "Bank Charge",
  // New transaction types
  cash_deposit: "Cash Deposit",
  cheque_received: "Cheque Received",
  cheque_given: "Cheque Given",
  bank_transfer_in: "Bank Transfer In",
  bank_transfer_out: "Bank Transfer Out",
  upi_settlement: "UPI Settlement",
  account_transfer: "Account Transfer",
  other: "Other",
};

const TRANSACTION_STATUS_LABELS: { [key: string]: string } = {
  // Universal statuses
  pending: 'Pending',
  
  // Credit-specific statuses
  deposited: 'Deposited',
  cleared: 'Cleared',
  transferred: 'Transferred',
  settled: 'Settled',
  
  // Debit-specific statuses
  debited: 'Debited',
  
  // Error/Exception statuses
  bounced: 'Bounced',
  cancelled: 'Cancelled',
  failed: 'Failed',
  
  // Legacy status
  completed: 'Completed',
};

// Helper function to get status with red/green indicator
const getStatusWithIndicator = (status: string): string => {
  // Green statuses (these update account balance)
  const greenStatuses = ['deposited', 'cleared', 'transferred', 'settled', 'debited', 'completed'];
  // Red statuses (these do NOT update account balance)
  const redStatuses = ['pending', 'bounced', 'cancelled', 'failed'];
  
  const indicator = greenStatuses.includes(status.toLowerCase()) 
    ? '🟢 ' 
    : redStatuses.includes(status.toLowerCase()) 
    ? '🔴 ' 
    : '⚪ '; // Default for unknown statuses
  
  const label = TRANSACTION_STATUS_LABELS[status] || status || '-';
  return `${indicator}${label}`;
};

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
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Default to newest first

  useEffect(() => {
    if (!id) return;
    async function fetchAccount() {
      try {
        const data = await api.accounts.getById(Number(id));
        setAccount(data);
        setBalance(data.current_balance || 0);
      } catch {
        setAccount(null);
      }
    }
    async function fetchTransactions() {
      try {
        const data = await api.accounts.getTransactions(Number(id));
        setTransactions(data);
      } catch {
        setTransactions([]);
      }
    }
    fetchAccount();
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
  
  // Transaction row colors
  const trHoverBg = useColorModeValue('blue.50', 'gray.700');
  const negativeColor = useColorModeValue('red.600', 'red.300');
  const positiveColor = useColorModeValue('green.600', 'green.300');
  const thHoverBg = useColorModeValue('gray.100', 'gray.600');

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

  // Function to get the most appropriate date for display based on transaction type and status
  const getTransactionDisplayDate = (tx: Transaction): string | null => {
    switch (tx.transaction_type) {
      case 'cash_deposit':
        // Cash Deposit: Always show deposit date
        return (tx.cash_deposit_details as { deposit_date?: string })?.deposit_date || null;
      
      case 'cheque_received':
      case 'cheque_given': {
        // Cheque transactions: Show cleared date if cleared, otherwise due date
        const chequeDetails = tx.cheque_details as { 
          cheque_cleared_date?: string;
          cheque_due_date?: string;
          cheque_issue_date?: string;
        };
        
        if (tx.status === 'cleared') {
          // For cleared status: try cleared date, fallback to due date, then given date
          return chequeDetails?.cheque_cleared_date || 
                 chequeDetails?.cheque_due_date || 
                 chequeDetails?.cheque_issue_date || null;
        } else {
          // For pending, bounced, cancelled: try due date, fallback to issue date
          return chequeDetails?.cheque_due_date || 
                 chequeDetails?.cheque_issue_date || null;
        }
      }
      
      case 'bank_transfer_in':
      case 'bank_transfer_out':
        // Bank Transfer: Show settlement date if settled, otherwise transfer date
        if (tx.status === 'settled') {
          return (tx.bank_transfer_details as { settlement_date?: string })?.settlement_date || null;
        } else {
          // For pending - show transfer date
          return (tx.bank_transfer_details as { transfer_date?: string })?.transfer_date || null;
        }
      
      case 'upi_settlement':
        // UPI Settlement: Always show settlement date
        return (tx.upi_settlement_details as { settlement_date?: string })?.settlement_date || null;
      
      case 'account_transfer':
        // Account Transfer: Always show transfer date
        return (tx.account_transfer_details as { transfer_date?: string })?.transfer_date || null;
      
      case 'bank_charge':
        // Bank Charge: Always show charge date
        return (tx.bank_charge_details as { charge_date?: string })?.charge_date || null;
      
      default:
        // Fallback to transaction_date for other types
        return tx.transaction_date || null;
    }
  };

  const displayBalance = balance;

  // Function to sort transactions by date
  const sortTransactionsByDate = (txs: Transaction[], direction: 'asc' | 'desc'): Transaction[] => {
    return [...txs].sort((a, b) => {
      const dateA = getTransactionDisplayDate(a);
      const dateB = getTransactionDisplayDate(b);
      
      // Handle cases where dates might be null
      if (!dateA && !dateB) return 0;
      if (!dateA) return direction === 'asc' ? -1 : 1;
      if (!dateB) return direction === 'asc' ? 1 : -1;
      
      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();
      
      return direction === 'asc' ? timeA - timeB : timeB - timeA;
    });
  };

  // Function to toggle sort direction
  const handleDateSort = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
  };

  // Get sorted transactions
  const sortedTransactions = sortTransactionsByDate(transactions, sortDirection);

  // Helper function to refresh both account and transaction data
  const refreshAccountData = async () => {
    if (!id) return;
    try {
      const [accountData, transactionData, balanceData] = await Promise.all([
        api.accounts.getById(Number(id)),
        api.accounts.getTransactions(Number(id)),
        api.accounts.getBalance(Number(id))
      ]);
      setAccount(accountData);
      setTransactions(transactionData);
      setBalance(balanceData.balance);
    } catch (err) {
      console.error('Failed to refresh account data:', err);
    }
  };

  // Add delete handler
  const handleDelete = async (txId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.transactions.delete(Number(txId));
      // Refresh all data after delete to ensure balance is updated
      await refreshAccountData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  // Add account update handler
  const handleAccountUpdated = async () => {
    // Refresh account data after update
    if (!id) return;
    try {
      const data = await api.accounts.getById(Number(id));
      setAccount(data);
      
      // Also refresh balance
      const balanceData = await api.accounts.getBalance(Number(id));
      setBalance(balanceData.balance);
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
          <Box color="white" textAlign={{ base: 'center', md: 'right' }} minW="250px">
            {/* Opening Balance */}
            <Stat mb={4}>
              <StatLabel fontSize="sm" opacity={0.85} color="whiteAlpha.800">Opening Balance</StatLabel>
              <StatNumber 
                fontSize="lg" 
                fontWeight="bold" 
                whiteSpace="nowrap"
                bg="whiteAlpha.200"
                px={3}
                py={2}
                borderRadius="md"
                border="1px solid"
                borderColor="whiteAlpha.300"
              >
                {formatCurrency(account.opening_balance)}
              </StatNumber>
            </Stat>

            {/* Current Balance - Enhanced */}
            <Stat>
              <StatLabel fontSize="sm" opacity={0.85} color="whiteAlpha.800" mb={2}>Current Balance</StatLabel>
              <Card bg="whiteAlpha.300" borderRadius="xl" border="2px solid" borderColor="whiteAlpha.400" boxShadow="xl">
                <CardBody p={4}>
                  <StatNumber 
                    fontSize="2xl" 
                    fontWeight="black" 
                    color="white" 
                    whiteSpace="nowrap"
                    textAlign="center"
                    textShadow="0 2px 4px rgba(0,0,0,0.3)"
                  >
                    {formatCurrency(displayBalance)}
                  </StatNumber>
                  {account.opening_balance !== null && account.opening_balance !== undefined && displayBalance !== null && (
                    <StatHelpText textAlign="center" mt={2} mb={0}>
                      {displayBalance > account.opening_balance ? (
                        <>
                          <StatArrow type="increase" />
                          <Text as="span" fontSize="sm" opacity={0.9}>
                            +{formatCurrency(displayBalance - account.opening_balance)} from opening
                          </Text>
                        </>
                      ) : displayBalance < account.opening_balance ? (
                        <>
                          <StatArrow type="decrease" />
                          <Text as="span" fontSize="sm" opacity={0.9}>
                            {formatCurrency(displayBalance - account.opening_balance)} from opening
                          </Text>
                        </>
                      ) : (
                        <Text as="span" fontSize="sm" opacity={0.9}>
                          No change from opening
                        </Text>
                      )}
                    </StatHelpText>
                  )}
                </CardBody>
              </Card>
            </Stat>
          </Box>
        </Flex>

        {/* Balance Status Alert */}
        {displayBalance !== null && (
          <>
            {displayBalance < 0 && (
              <Alert status="error" borderRadius="lg" mb={4} bg="red.50" borderColor="red.200" borderWidth={1}>
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" color="red.800">Negative Balance Alert</Text>
                  <Text fontSize="sm" color="red.600">Your account balance is below zero. Consider adding funds.</Text>
                </Box>
              </Alert>
            )}
            {displayBalance >= 0 && displayBalance < 10000 && (
              <Alert status="warning" borderRadius="lg" mb={4} bg="orange.50" borderColor="orange.200" borderWidth={1}>
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" color="orange.800">Low Balance Notice</Text>
                  <Text fontSize="sm" color="orange.600">Your account balance is running low.</Text>
                </Box>
              </Alert>
            )}
            {displayBalance >= 100000 && (
              <Alert status="success" borderRadius="lg" mb={4} bg="green.50" borderColor="green.200" borderWidth={1}>
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" color="green.800">Healthy Balance</Text>
                  <Text fontSize="sm" color="green.600">Your account maintains a good balance level.</Text>
                </Box>
              </Alert>
            )}
          </>
        )}

        {/* Transactions Table */}
        <Flex align="center" justify="space-between" mb={2} gap={2} flexWrap="wrap">
          <Heading as="h3" size="md" color={subHeadingColor} fontWeight="bold">Transactions</Heading>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={2}>
            <Button 
              leftIcon={<ViewIcon />} 
              colorScheme="blue" 
              variant="outline" 
              onClick={() => navigate(`/accounts/${id}/transactions`)}
              size="sm"
            >
              View All Transactions
            </Button>
            <Button leftIcon={<AddIcon />} colorScheme="green" variant="solid" onClick={() => setAddTxOpen(true)} size="sm">
              Add Transaction
            </Button>
          </Stack>
        </Flex>
        {sortedTransactions.length === 0 ? (
          <Text color="gray.500" mb={6} textAlign="center">No transactions found.</Text>
        ) : (
          <Box mb={6} borderRadius="lg" borderWidth={1} borderColor={cardBorder} boxShadow="sm" w="100%">
            <Table variant="simple" size="sm" bg={cardBg} w="100%">
              <Thead position="sticky" top={0} zIndex={1} bg={tableHeaderBg}>
                <Tr>
                  <Th w={{ base: "15%", md: "13%" }}>Created</Th>
                  <Th w={{ base: "0%", md: "17%" }} display={{ base: "none", sm: "table-cell" }}>Type</Th>
                  <Th w={{ base: "15%", md: "13%" }} isNumeric>Amount</Th>
                  <Th 
                    w={{ base: "15%", md: "13%" }}
                    cursor="pointer" 
                    onClick={handleDateSort}
                    _hover={{ bg: thHoverBg }}
                    position="relative"
                  >
                    <Flex align="center" gap={1}>
                      Date
                      {sortDirection === 'asc' ? (
                        <ChevronUpIcon boxSize={4} />
                      ) : (
                        <ChevronDownIcon boxSize={4} />
                      )}
                    </Flex>
                  </Th>
                  <Th w={{ base: "0%", md: "20%" }} display={{ base: "none", md: "table-cell" }}>Recipient</Th>
                  <Th w={{ base: "15%", md: "12%" }}>Status</Th>
                  <Th 
                    w={{ base: "20%", md: "12%" }} 
                    textAlign="center" 
                    fontSize="sm"
                    fontWeight="bold"
                    whiteSpace="nowrap"
                    px={2}
                    minW="80px"
                  >
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedTransactions.map((tx) => (
                    <Tr key={tx.id} _hover={{ bg: trHoverBg }}>
                      <Td fontSize="sm">
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: '2-digit',
                            })
                          : '-'}
                      </Td>
                      <Td fontSize="sm" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" display={{ base: "none", sm: "table-cell" }}>
                        {TRANSACTION_TYPE_LABELS[tx.transaction_type] || tx.transaction_type}
                      </Td>
                      <Td 
                        color={tx.amount < 0 ? negativeColor : positiveColor} 
                        fontWeight="bold" 
                        whiteSpace="nowrap"
                        fontSize="sm"
                        isNumeric
                      >
                        {formatCurrency(tx.amount)}
                      </Td>
                      <Td fontSize="sm">
                        {(() => {
                          const displayDate = getTransactionDisplayDate(tx);
                          return displayDate
                            ? new Date(displayDate).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: '2-digit',
                              })
                            : '-';
                        })()}
                      </Td>
                      <Td fontSize="sm" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" display={{ base: "none", md: "table-cell" }}>
                        {tx.recipient ? (
                          <Text>{tx.recipient.name}</Text>
                        ) : tx.to_account ? (
                          <Text color="blue.500">{tx.to_account.account_name}</Text>
                        ) : (
                          '-'
                        )}
                      </Td>
                      <Td fontSize="sm" whiteSpace="nowrap">
                        {getStatusWithIndicator(tx.status || '')}
                      </Td>
                      <Td textAlign="center" px={2}>
                        <Stack direction="row" spacing={0} justify="center" align="center">
                          <Tooltip label="View">
                            <IconButton 
                              as={Link} 
                              to={`/transactions/${tx.id}`} 
                              aria-label="View" 
                              icon={<ViewIcon />} 
                              size="xs" 
                              colorScheme="blue" 
                              variant="ghost" 
                            />
                          </Tooltip>
                          {!tx.parent_transaction_id && (
                            <>
                              <Tooltip label="Edit">
                                <IconButton 
                                  aria-label="Edit" 
                                  icon={<EditIcon />} 
                                  size="xs" 
                                  colorScheme="yellow" 
                                  variant="ghost" 
                                  onClick={() => setEditTx(tx)} 
                                />
                              </Tooltip>
                              <Tooltip label="Delete">
                                <IconButton 
                                  aria-label="Delete" 
                                  icon={<DeleteIcon />} 
                                  size="xs" 
                                  colorScheme="red" 
                                  variant="ghost" 
                                  onClick={() => handleDelete(tx.id)} 
                                />
                              </Tooltip>
                            </>
                          )}
                          {tx.parent_transaction_id && (
                            <Tooltip label="Auto-generated from account transfer">
                              <Badge colorScheme="gray" fontSize="xs">
                                Auto
                              </Badge>
                            </Tooltip>
                          )}
                        </Stack>
                      </Td>
                    </Tr>
                ))}
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
      <AddTransactionWizard
        isOpen={addTxOpen}
        accountId={id!}
        onClose={() => setAddTxOpen(false)}
        onSuccess={async () => {
          setAddTxOpen(false);
          // Refresh account and transaction data after successful transaction creation
          await refreshAccountData();
        }}
      />
      {editTx && (
        <EditTransactionModal
          isOpen={!!editTx}
          transaction={{
            ...editTx,
            status: editTx.status ?? ''
          }}
          onClose={() => setEditTx(null)}
          onSuccess={async () => {
            setEditTx(null);
            // Refresh account and transaction data after successful transaction update
            await refreshAccountData();
          }}
          onDelete={handleDelete}
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
          id: account.id,
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