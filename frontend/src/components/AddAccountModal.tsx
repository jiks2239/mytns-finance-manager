import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormErrorMessage,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import api from '../api';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: () => Promise<void>;
}

type AccountType = 'current' | 'savings' | 'cash';

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAccountAdded }) => {
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setAccountName('');
    setAccountType('');
    setBankName('');
    setAccountNumber('');
    setOpeningBalance('');
    setErrors({});
    setSubmitError(null);
  };

  React.useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  if (!isOpen) return null;

  // Validation helpers
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!accountName.trim()) newErrors.accountName = 'Account Name is required';
    if (!accountType) newErrors.accountType = 'Account Type is required';
    
    // Bank name and account number are only required for bank accounts (not cash)
    if (accountType === 'current' || accountType === 'savings') {
      if (!bankName.trim()) newErrors.bankName = 'Bank Name is required';
      else if (/\d/.test(bankName)) newErrors.bankName = 'Bank Name must not contain numbers';
      if (!accountNumber.trim()) newErrors.accountNumber = 'Bank Account Number is required';
      else if (/[^0-9 ]/.test(accountNumber)) newErrors.accountNumber = 'Only numbers and spaces allowed';
    }
    
    // Opening balance is required for all account types
    if (!openingBalance.trim()) newErrors.openingBalance = 'Opening Balance is required';
    else if (isNaN(Number(openingBalance))) newErrors.openingBalance = 'Must be a number';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      interface AccountPayload {
        account_name: string;
        account_type: AccountType | '';
        bank_name?: string;
        account_number?: string;
        opening_balance?: number;
      }

      const payload: AccountPayload = {
        account_name: accountName,
        account_type: accountType,
      };
      
      if (accountType === 'current' || accountType === 'savings') {
        payload.bank_name = bankName;
        payload.account_number = accountNumber;
        payload.opening_balance = Number(openingBalance);
      } else if (accountType === 'cash') {
        payload.opening_balance = Number(openingBalance);
        // Cash accounts don't have bank_name or account_number
      }
      await api.accounts.create(payload);
      await onAccountAdded();
      onClose();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to add account'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Account</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.accountName}>
                <FormLabel>Account Name</FormLabel>
                <Input
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  autoFocus
                />
                <FormErrorMessage>{errors.accountName}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.accountType}>
                <FormLabel>Account Type</FormLabel>
                <Select
                  value={accountType}
                  onChange={e => setAccountType(e.target.value as AccountType)}
                  placeholder="-- Select --"
                >
                  <option value="current">Current Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="cash">Cash Account</option>
                </Select>
                <FormErrorMessage>{errors.accountType}</FormErrorMessage>
              </FormControl>

              {(accountType === 'current' || accountType === 'savings') && (
                <FormControl isRequired isInvalid={!!errors.bankName}>
                  <FormLabel>Bank Name</FormLabel>
                  <Input
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                  />
                  <FormErrorMessage>{errors.bankName}</FormErrorMessage>
                </FormControl>
              )}

              {(accountType === 'current' || accountType === 'savings') && (
                <FormControl isRequired isInvalid={!!errors.accountNumber}>
                  <FormLabel>Bank Account Number</FormLabel>
                  <Input
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                  />
                  <FormErrorMessage>{errors.accountNumber}</FormErrorMessage>
                </FormControl>
              )}

              <FormControl isRequired isInvalid={!!errors.openingBalance}>
                <FormLabel>Opening Balance</FormLabel>
                <Input
                  type="number"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                />
                <FormErrorMessage>{errors.openingBalance}</FormErrorMessage>
              </FormControl>

              {submitError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {submitError}
                </Alert>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              type="submit"
              colorScheme="blue"
              mr={3}
              isLoading={submitting}
              loadingText="Adding..."
            >
              Add Account
            </Button>
            <Button variant="ghost" onClick={onClose} isDisabled={submitting}>
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default AddAccountModal;