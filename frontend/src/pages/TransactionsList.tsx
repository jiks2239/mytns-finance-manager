import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  Badge,
  Flex,
  Spacer,
  Card,
  CardBody,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  useToast
} from '@chakra-ui/react';
import { 
  ArrowBackIcon, 
  AddIcon, 
  ViewIcon, 
  EditIcon, 
  DeleteIcon,
  InfoIcon 
} from '@chakra-ui/icons';
import { FaRupeeSign, FaCalendarAlt, FaUser, FaFileInvoice } from 'react-icons/fa';
import AddTransactionWizard from '../components/AddTransactionWizard';
import EditTransactionModal from '../components/EditTransactionModal';
import api from '../api';
import type { Transaction } from '../api';

// Helper function to get the appropriate date based on transaction type and status
const getTransactionDate = (tx: Transaction): string | null => {
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
        // For cleared status: try cleared date, fallback to due date, then issue date
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

const TRANSACTION_TYPE_LABELS: { [key: string]: string } = {
  cash_deposit: 'Cash Deposit',
  cheque_received: 'Cheque Received',
  cheque_given: 'Cheque Given',
  bank_transfer_in: 'Bank Transfer In',
  bank_transfer_out: 'Bank Transfer Out',
  upi_settlement: 'UPI Settlement',
  account_transfer: 'Account Transfer',
  bank_charge: 'Bank Charge',
  other: 'Other',
};

const TRANSACTION_STATUS_LABELS: { [key: string]: string } = {
  pending: 'Pending',
  deposited: 'Deposited',
  cleared: 'Cleared',
  transferred: 'Transferred',
  settled: 'Settled',
  debited: 'Debited',
  bounced: 'Bounced',
  cancelled: 'Cancelled',
  failed: 'Failed',
  completed: 'Completed',
};

// Helper function to get status color scheme
const getStatusColorScheme = (status: string): string => {
  const greenStatuses = ['deposited', 'cleared', 'transferred', 'settled', 'debited', 'completed'];
  const redStatuses = ['pending', 'bounced', 'cancelled', 'failed'];
  
  if (greenStatuses.includes(status.toLowerCase())) return 'green';
  if (redStatuses.includes(status.toLowerCase())) return 'red';
  return 'gray';
};

// Helper function to get transaction type color scheme
const getTypeColorScheme = (type: string): string => {
  switch (type) {
    case 'cash_deposit': return 'blue';
    case 'cheque_received': return 'green';
    case 'cheque_given': return 'orange';
    case 'bank_transfer_in': return 'teal';
    case 'bank_transfer_out': return 'purple';
    case 'upi_settlement': return 'cyan';
    case 'account_transfer': return 'pink';
    case 'bank_charge': return 'red';
    default: return 'gray';
  }
};

const TransactionsList: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [accountName, setAccountName] = useState<string>('');
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const selectedAccountId = Number(accountId);

  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const tableRowHoverBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch account name
  useEffect(() => {
    if (!selectedAccountId) return;
    api.accounts.getById(selectedAccountId)
      .then((account) => setAccountName(account.account_name))
      .catch(() => setAccountName(''));
  }, [selectedAccountId]);

  // Fetch current balance
  const fetchBalance = React.useCallback(() => {
    if (!selectedAccountId) return;
    api.accounts.getBalance(selectedAccountId)
      .then((data) => setCurrentBalance(data.balance))
      .catch(() => setCurrentBalance(null));
  }, [selectedAccountId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const {
    data: transactions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Transaction[], Error>({
    queryKey: ['transactions', selectedAccountId],
    queryFn: () => api.accounts.getTransactions(selectedAccountId),
  });

  // Helper to refresh both transactions and balance after a transaction
  const handleTransactionSuccess = async () => {
    await refetch();
    fetchBalance();
    toast({
      title: 'Success',
      description: 'Transaction updated successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Action handlers
  const handleEdit = (tx: Transaction) => setEditTx(tx);
  
  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.transactions.delete(Number(id));
      await handleTransactionSuccess();
      toast({
        title: 'Deleted',
        description: 'Transaction deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleBack = () => {
    navigate('/', { state: { refresh: true } });
  };

  const formatAmount = (amount: unknown): string => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return '₹0.00';
    }
    return '₹' + Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading transactions...</Text>
        </VStack>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          Error loading transactions: {error?.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Card bg={cardBg}>
            <CardBody>
              <Flex align="center" mb={4}>
                <IconButton
                  aria-label="Back to accounts"
                  icon={<ArrowBackIcon />}
                  onClick={handleBack}
                  mr={4}
                  variant="ghost"
                />
                <VStack align="start" spacing={1}>
                  <Heading size="lg">
                    {accountName || `Account ${selectedAccountId}`}
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    Transaction History
                  </Text>
                </VStack>
                <Spacer />
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={() => setModalOpen(true)}
                >
                  Add Transaction
                </Button>
              </Flex>

              {/* Balance Display */}
              {currentBalance !== null && (
                <Box>
                  <Divider mb={4} />
                  <Stat>
                    <StatLabel>Current Balance</StatLabel>
                    <StatNumber color={currentBalance >= 0 ? 'green.500' : 'red.500'}>
                      {formatAmount(currentBalance)}
                    </StatNumber>
                    <StatHelpText>
                      <HStack>
                        <FaRupeeSign />
                        <Text>Available Balance</Text>
                      </HStack>
                    </StatHelpText>
                  </Stat>
                </Box>
              )}
            </CardBody>
          </Card>

          {/* Transactions Table */}
          <Card bg={cardBg}>
            <CardBody p={0}>
              {!transactions || transactions.length === 0 ? (
                <Box p={8} textAlign="center">
                  <VStack spacing={4}>
                    <FaFileInvoice size={48} color="gray" />
                    <Text fontSize="lg" color="gray.500">
                      No transactions found
                    </Text>
                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="blue"
                      onClick={() => setModalOpen(true)}
                    >
                      Add First Transaction
                    </Button>
                  </VStack>
                </Box>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead bg={tableHeaderBg}>
                      <Tr>
                        <Th>Date Created</Th>
                        <Th>Type</Th>
                        <Th>Recipient</Th>
                        <Th isNumeric>Amount</Th>
                        <Th>Transaction Date</Th>
                        <Th>Status</Th>
                        <Th>Description</Th>
                        <Th textAlign="center">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {transactions.map((tx: Transaction) => (
                        <Tr key={tx.id} _hover={{ bg: tableRowHoverBg }}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm" fontWeight="medium">
                                {formatDate(tx.created_at)}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                ID: {tx.id}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={getTypeColorScheme(tx.transaction_type)}
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="md"
                            >
                              {TRANSACTION_TYPE_LABELS[tx.transaction_type] || tx.transaction_type}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack>
                              <FaUser color="gray" />
                              <Text>{tx.recipient?.name || '-'}</Text>
                            </HStack>
                          </Td>
                          <Td isNumeric>
                            <Text
                              fontWeight="bold"
                              color={tx.transaction_direction === 'credit' ? 'green.500' : 'red.500'}
                            >
                              {tx.transaction_direction === 'credit' ? '+' : '-'}
                              {formatAmount(tx.amount)}
                            </Text>
                          </Td>
                          <Td>
                            <HStack>
                              <FaCalendarAlt color="gray" />
                              <Text>{formatDate(getTransactionDate(tx))}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={getStatusColorScheme(tx.status || '')}
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="md"
                            >
                              {TRANSACTION_STATUS_LABELS[tx.status || ''] || tx.status || '-'}
                            </Badge>
                          </Td>
                          <Td>
                            <Text
                              fontSize="sm"
                              noOfLines={2}
                              maxW="200px"
                              title={tx.description || ''}
                            >
                              {tx.description || '-'}
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={2} justify="center">
                              <Tooltip label="View Details">
                                <IconButton
                                  as={Link}
                                  to={`/transactions/${tx.id}`}
                                  aria-label="View transaction"
                                  icon={<ViewIcon />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="blue"
                                />
                              </Tooltip>
                              {!tx.parent_transaction_id && (
                                <>
                                  <Tooltip label="Edit Transaction">
                                    <IconButton
                                      aria-label="Edit transaction"
                                      icon={<EditIcon />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="green"
                                      onClick={() => handleEdit(tx)}
                                    />
                                  </Tooltip>
                                  <Tooltip label="Delete Transaction">
                                    <IconButton
                                      aria-label="Delete transaction"
                                      icon={<DeleteIcon />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="red"
                                      onClick={() => handleDelete(tx.id)}
                                    />
                                  </Tooltip>
                                </>
                              )}
                              {tx.parent_transaction_id && (
                                <Tooltip label="Auto-generated from account transfer">
                                  <Badge colorScheme="gray" fontSize="xs">
                                    <HStack spacing={1}>
                                      <InfoIcon />
                                      <Text>Auto</Text>
                                    </HStack>
                                  </Badge>
                                </Tooltip>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>

        {/* Modals */}
        <AddTransactionWizard
          isOpen={modalOpen}
          accountId={selectedAccountId}
          onClose={() => setModalOpen(false)}
          onSuccess={handleTransactionSuccess}
        />
        {editTx && (
          <EditTransactionModal
            isOpen={!!editTx}
            transaction={editTx}
            onClose={() => setEditTx(null)}
            onSuccess={async () => {
              setEditTx(null);
              await handleTransactionSuccess();
            }}
            onDelete={handleDelete}
          />
        )}
      </Container>
    </Box>
  );
};

export default TransactionsList;