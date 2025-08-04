import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Alert,
  AlertIcon,
  VStack,
  Box,
  Badge,
  Flex,
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';

interface Account {
  id: number;
  account_name: string;
  account_type: string;
  opening_balance?: number;
}

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onAccountDeleted: () => void;
}

const ACCOUNT_TYPE_LABELS: { [key: string]: string } = {
  current: 'Current Account',
  savings: 'Savings Account',
  cash: 'Cash',
  credit_card: 'Credit Card',
  loan: 'Loan',
  other: 'Other'
};

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onAccountDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingTransactions, setCheckingTransactions] = useState(false);
  const [hasTransactions, setHasTransactions] = useState(false);

  // Check if account has transactions when modal opens
  useEffect(() => {
    if (isOpen && account) {
      setCheckingTransactions(true);
      setError('');
      
      api.accounts.getTransactions(account.id)
        .then(transactions => {
          setHasTransactions(Array.isArray(transactions) && transactions.length > 0);
        })
        .catch(() => {
          setHasTransactions(false); // Assume no transactions if we can't check
        })
        .finally(() => {
          setCheckingTransactions(false);
        });
    }
  }, [isOpen, account]);

  if (!account) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    
    try {
      await api.accounts.delete(account.id);
      onAccountDeleted();
      onClose();
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Network error occurred while deleting the account.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number | null | undefined) =>
    val == null || isNaN(Number(val))
      ? '₹0.00'
      : Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="red.600">
          <Flex align="center" gap={3}>
            <WarningIcon boxSize={6} />
            Delete Account
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">This action cannot be undone!</Text>
                <Text fontSize="sm">
                  Deleting this account will permanently remove all its data.
                </Text>
              </Box>
            </Alert>

            <Box bg="gray.50" p={4} borderRadius="md" border="1px" borderColor="gray.200">
              <Text fontSize="sm" color="gray.600" mb={2}>Account to be deleted:</Text>
              <VStack align="stretch" spacing={2}>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="lg">{account.account_name}</Text>
                  <Badge colorScheme="blue" px={2} py={1}>
                    {ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type}
                  </Badge>
                </Flex>
                {account.opening_balance !== undefined && (
                  <Flex justify="space-between">
                    <Text color="gray.600">Opening Balance:</Text>
                    <Text fontWeight="semibold" whiteSpace="nowrap">{formatCurrency(account.opening_balance)}</Text>
                  </Flex>
                )}
              </VStack>
            </Box>

            <Text fontSize="sm" color="gray.600">
              Please type the account name to confirm deletion:
            </Text>
            
            {checkingTransactions ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                Checking for existing transactions...
              </Alert>
            ) : hasTransactions ? (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Cannot delete account!</Text>
                  <Text fontSize="sm">
                    This account has transactions. Please delete all transactions first before deleting the account.
                  </Text>
                </Box>
              </Alert>
            ) : (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm" color="orange.700">
                  This account has no transactions and can be safely deleted.
                </Text>
              </Alert>
            )}

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={loading}>
            Cancel
          </Button>
          <Button
            colorScheme="red"
            onClick={handleDelete}
            isLoading={loading}
            loadingText="Deleting..."
            isDisabled={hasTransactions || checkingTransactions}
          >
            {hasTransactions ? 'Cannot Delete' : 'Delete Account'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteAccountModal;
