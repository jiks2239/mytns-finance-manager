import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Flex, Heading, Text, VStack, HStack, Badge, Divider, Button, Card, CardBody,
  useColorModeValue, Icon,
  Alert, AlertIcon, AlertTitle, Spinner, Center, Tag,
  Grid, Avatar
} from '@chakra-ui/react';
import {
  ArrowBackIcon, CalendarIcon, TimeIcon, InfoIcon, CheckCircleIcon,
  CloseIcon, RepeatIcon
} from '@chakra-ui/icons';
import { FaUser, FaBuilding, FaFileAlt, FaHashtag } from 'react-icons/fa';

const API_BASE = 'http://localhost:3000';

const TRANSACTION_TYPE_LABELS: { [key: string]: string } = {
  // Legacy types
  cheque: 'Cheque',
  online: 'Online Transfer',
  internal_transfer: 'Internal Transfer',
  bank_charge: 'Bank Charge',
  other: 'Other',
  // New transaction types
  cash_deposit: 'Cash Deposit',
  cheque_received: 'Cheque Received',
  cheque_given: 'Cheque Given',
  bank_transfer_in: 'Bank Transfer In',
  bank_transfer_out: 'Bank Transfer Out',
  upi_settlement: 'UPI Settlement',
  account_transfer: 'Account Transfer',
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
  stopped: 'Stopped',
  cancelled: 'Cancelled',
  failed: 'Failed',
  
  // Legacy status
  completed: 'Completed',
};

const TRANSFER_MODE_LABELS: { [key: string]: string } = {
  neft: 'NEFT',
  imps: 'IMPS',
  rtgs: 'RTGS',
};

type Transaction = {
  id: string;
  transaction_type: string;
  transaction_direction: string;
  amount: number;
  status: string;
  transaction_date?: string;
  date?: string;
  created_at?: string;
  updated_at?: string;
  description?: string;
  account?: {
    id: number;
    account_name: string;
    bank_name?: string;
  };
  recipient?: {
    id: number;
    name: string;
    type: string;
  };
  to_account?: {
    id: number;
    account_name: string;
  };
  reference_number?: string;
  cheque_details?: Record<string, unknown>;
  online_transfer_details?: { transfer_date?: string; [key: string]: unknown };
  bank_charge_details?: Record<string, unknown>;
  cash_deposit_details?: Record<string, unknown>;
  bank_transfer_details?: { 
    transfer_date?: string; 
    settlement_date?: string;
    transfer_mode?: string;
    reference_number?: string;
    notes?: string;
    [key: string]: unknown 
  };
  upi_settlement_details?: Record<string, unknown>;
  account_transfer_details?: Record<string, unknown>;
};

const TransactionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/transactions/${id}`)
      .then(res => {
        if (res.status === 404) {
          setTransaction(null);
        } else {
          return res.json().then(setTransaction);
        }
      })
      .catch(() => setTransaction(null))
      .finally(() => setLoading(false));
  }, [id]);

  const formatAmount = (amount: unknown) =>
    amount !== undefined && amount !== null && !isNaN(Number(amount))
      ? '₹' +
        Number(amount).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) +
        '/-'
      : '-';

  const formatDate = (val?: string) =>
    val
      ? new Date(val).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '-';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'cleared':
      case 'deposited':
      case 'settled':
        return CheckCircleIcon;
      case 'pending':
        return TimeIcon;
      case 'failed':
      case 'bounced':
      case 'cancelled':
        return CloseIcon;
      default:
        return InfoIcon;
    }
  };

  const getStatusColorScheme = (status: string) => {
    switch (status) {
      case 'completed':
      case 'cleared':
      case 'deposited':
      case 'settled':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
      case 'bounced':
      case 'cancelled':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getDirectionColor = (direction: string, amount: number) => {
    if (direction === 'credit' || amount > 0) return 'green.500';
    if (direction === 'debit' || amount < 0) return 'red.500';
    return 'gray.500';
  };

  const getDirectionIcon = (direction: string, amount: number) => {
    if (direction === 'credit' || amount > 0) return '↗';
    if (direction === 'debit' || amount < 0) return '↙';
    return '↔';
  };

  if (!id) {
    return (
      <Box bg={bgColor} minH="100vh" p={6}>
        <Center h="50vh">
          <Alert status="error" maxW="md" borderRadius="lg">
            <AlertIcon />
            <AlertTitle>Transaction not found!</AlertTitle>
          </Alert>
        </Center>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box bg={bgColor} minH="100vh" p={6}>
        <Center h="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text color={secondaryTextColor}>Loading transaction details...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  if (!transaction) {
    return (
      <Box bg={bgColor} minH="100vh" p={6}>
        <Center h="50vh">
          <Alert status="error" maxW="md" borderRadius="lg">
            <AlertIcon />
            <AlertTitle>Transaction not found!</AlertTitle>
          </Alert>
        </Center>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <Box maxW="6xl" mx="auto">
        {/* Header Section */}
        <Flex align="center" mb={6}>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => location.key === 'default' ? navigate('/') : navigate(-1)}
            mr={4}
          >
            Back
          </Button>
          <Heading size="lg" color={textColor}>
            Transaction Details
          </Heading>
        </Flex>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 400px' }} gap={6}>
          {/* Main Content */}
          <VStack spacing={6} align="stretch">
            {/* Transaction Overview Card */}
            <Card bg={cardBg} shadow="md" borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Avatar 
                        size="sm" 
                        bg={getDirectionColor(transaction.transaction_direction, transaction.amount)}
                        color="white"
                        name={getDirectionIcon(transaction.transaction_direction, transaction.amount)}
                      />
                      <Box>
                        <Heading size="md" color={textColor}>
                          {TRANSACTION_TYPE_LABELS[transaction.transaction_type] || transaction.transaction_type}
                        </Heading>
                        <Text color={secondaryTextColor} fontSize="sm">
                          ID: #{transaction.id}
                        </Text>
                      </Box>
                    </HStack>
                    <Badge 
                      colorScheme={getStatusColorScheme(transaction.status)}
                      fontSize="sm"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      <Icon as={getStatusIcon(transaction.status)} mr={1} />
                      {TRANSACTION_STATUS_LABELS[transaction.status] || transaction.status}
                    </Badge>
                  </Flex>
                  
                  <Divider />
                  
                  <Box bg="transparent">
                    <Text fontSize="sm" color={secondaryTextColor} mb={1}>Transaction Amount</Text>
                    <Text 
                      fontSize="xl" 
                      color={textColor}
                      fontWeight="semibold"
                      whiteSpace="nowrap"
                      mb={2}
                      bg="transparent"
                    >
                      {formatAmount(transaction.amount)}
                    </Text>
                    <Tag size="sm" colorScheme={transaction.transaction_direction === 'credit' ? 'green' : 'red'}>
                      {transaction.transaction_direction === 'credit' ? '↗ Credit' : '↙ Debit'}
                    </Tag>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Transaction Details Card */}
            <Card bg={cardBg} shadow="md" borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Heading size="sm" mb={4} color={textColor}>Transaction Details</Heading>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  <Box>
                    <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                      Created At
                    </Text>
                    <HStack>
                      <Icon as={TimeIcon} color={secondaryTextColor} />
                      <Text color={textColor}>{formatDate(transaction.created_at)}</Text>
                    </HStack>
                  </Box>

                  {transaction.reference_number && (
                    <Box>
                      <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                        Reference Number
                      </Text>
                      <HStack>
                        <Icon as={FaHashtag} color={secondaryTextColor} />
                        <Text color={textColor} fontFamily="mono">{transaction.reference_number}</Text>
                      </HStack>
                    </Box>
                  )}

                  {/* Bank Transfer Details */}
                  {transaction.bank_transfer_details && (
                    <>
                      {transaction.bank_transfer_details.transfer_date && (
                        <Box>
                          <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                            Transfer Date
                          </Text>
                          <HStack>
                            <Icon as={CalendarIcon} color={secondaryTextColor} />
                            <Text color={textColor}>{formatDate(transaction.bank_transfer_details.transfer_date)}</Text>
                          </HStack>
                        </Box>
                      )}
                      
                      {transaction.bank_transfer_details.settlement_date && (
                        <Box>
                          <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                            Settlement Date
                          </Text>
                          <HStack>
                            <Icon as={CalendarIcon} color={secondaryTextColor} />
                            <Text color={textColor}>{formatDate(transaction.bank_transfer_details.settlement_date)}</Text>
                          </HStack>
                        </Box>
                      )}
                      
                      {transaction.bank_transfer_details.transfer_mode && (
                        <Box>
                          <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                            Transfer Mode
                          </Text>
                          <Tag colorScheme="blue" size="sm">
                            {TRANSFER_MODE_LABELS[transaction.bank_transfer_details.transfer_mode] || transaction.bank_transfer_details.transfer_mode}
                          </Tag>
                        </Box>
                      )}
                      
                      {transaction.bank_transfer_details.notes && (
                        <Box gridColumn={{ md: 'span 2' }}>
                          <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                            Transfer Notes
                          </Text>
                          <HStack align="start">
                            <Icon as={FaFileAlt} color={secondaryTextColor} mt={1} />
                            <Text color={textColor}>{transaction.bank_transfer_details.notes}</Text>
                          </HStack>
                        </Box>
                      )}
                    </>
                  )}

                  {/* Online Transfer Details */}
                  {transaction.online_transfer_details && transaction.online_transfer_details.transfer_date && (
                    <Box>
                      <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                        Transfer Date
                      </Text>
                      <HStack>
                        <Icon as={CalendarIcon} color={secondaryTextColor} />
                        <Text color={textColor}>{formatDate(transaction.online_transfer_details.transfer_date)}</Text>
                      </HStack>
                    </Box>
                  )}

                  {transaction.description && (
                    <Box gridColumn={{ md: 'span 2' }}>
                      <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                        Description
                      </Text>
                      <HStack align="start">
                        <Icon as={FaFileAlt} color={secondaryTextColor} mt={1} />
                        <Text color={textColor}>{transaction.description}</Text>
                      </HStack>
                    </Box>
                  )}
                </Grid>
              </CardBody>
            </Card>

            {/* Account Information Card */}
            {(transaction.account || transaction.recipient || transaction.to_account) && (
              <Card bg={cardBg} shadow="md" borderWidth={1} borderColor={borderColor}>
                <CardBody>
                  <Heading size="sm" mb={4} color={textColor}>Account & Recipient Information</Heading>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    {transaction.account && (
                      <Box>
                        <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                          Account
                        </Text>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Icon as={FaBuilding} color={secondaryTextColor} />
                            <Text color={textColor} fontWeight="medium">{transaction.account.account_name}</Text>
                          </HStack>
                          {transaction.account.bank_name && (
                            <Text color={secondaryTextColor} fontSize="sm" ml={6}>
                              {transaction.account.bank_name}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    )}

                    {transaction.recipient && (
                      <Box>
                        <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                          Recipient
                        </Text>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Icon as={FaUser} color={secondaryTextColor} />
                            <Text color={textColor} fontWeight="medium">{transaction.recipient.name}</Text>
                          </HStack>
                          <Tag size="sm" colorScheme="blue">
                            {transaction.recipient.type}
                          </Tag>
                        </VStack>
                      </Box>
                    )}

                    {transaction.to_account && (
                      <Box>
                        <Text fontSize="xs" color={secondaryTextColor} textTransform="uppercase" fontWeight="bold" mb={1}>
                          Transfer To
                        </Text>
                        <HStack>
                          <Icon as={RepeatIcon} color={secondaryTextColor} />
                          <Text color={textColor} fontWeight="medium">{transaction.to_account.account_name}</Text>
                        </HStack>
                      </Box>
                    )}
                  </Grid>
                </CardBody>
              </Card>
            )}
          </VStack>

          {/* Sidebar */}
          <Box>
            <Card bg={cardBg} shadow="md" borderWidth={1} borderColor={borderColor} position="sticky" top={6}>
              <CardBody>
                <Heading size="sm" mb={4} color={textColor}>Quick Actions</Heading>
                <VStack spacing={3} align="stretch">
                  <Button 
                    colorScheme="blue" 
                    variant="outline" 
                    size="sm"
                    leftIcon={<Icon as={RepeatIcon} />}
                    onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                  >
                    Edit Transaction
                  </Button>
                  <Button 
                    colorScheme="green" 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.print()}
                  >
                    Print Details
                  </Button>
                  <Button 
                    colorScheme="red" 
                    variant="outline" 
                    size="sm"
                    leftIcon={<CloseIcon />}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this transaction?')) {
                        // You can implement delete functionality here
                        navigate(-1);
                      }
                    }}
                  >
                    Delete Transaction
                  </Button>
                  <Divider />
                  <Text fontSize="xs" color={secondaryTextColor} textAlign="center">
                    Last updated: {formatDate(transaction.updated_at)}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </Box>
        </Grid>
      </Box>
    </Box>
  );
};

export default TransactionDetails;
