import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
  FormControl,
  FormLabel,
  Input,
  Select,
  FormErrorMessage,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

interface Account {
  id: string | number;
  account_name: string;
  account_number?: string;
  account_type: string;
  bank_name?: string;
  opening_balance?: number | string;
  notes?: string;
}

interface EditAccountModalProps {
  isOpen: boolean;
  account: Account | null;
  onClose: () => void;
  onAccountUpdated: () => void;
}

type FormValues = {
  account_name: string;
  account_number: string;
  account_type: string;
  bank_name: string;
  opening_balance: number;
  notes: string;
};

const ACCOUNT_TYPES = [
  { value: 'current', label: 'Current Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'cash', label: 'Cash' },
];

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  account,
  onClose,
  onAccountUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Memoize defaultValues so useForm re-initializes when account changes
  const defaultValues = useMemo(() => {
    let opening_balance = 0;
    if (typeof account?.opening_balance === "number") {
      opening_balance = account.opening_balance;
    } else if (typeof account?.opening_balance === "string") {
      opening_balance = parseFloat(
        account.opening_balance.replace(/[₹,]/g, '').replace('/-', '').trim()
      ) || 0;
    }
    return {
      account_name: account?.account_name ?? '',
      account_number: account?.account_number ?? '',
      account_type: account?.account_type ?? '',
      bank_name: account?.bank_name ?? '',
      opening_balance,
      notes: account?.notes ?? '',
    };
  }, [account]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues,
  });

  const watchedAccountType = watch('account_type');

  useEffect(() => {
    if (isOpen && account) {
      reset(defaultValues);
    }
  }, [isOpen, account, reset, defaultValues]);

  if (!isOpen || !account) return null;

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError('');
    try {
      const updateData: Record<string, string | number> = {
        account_name: data.account_name,
        account_type: data.account_type,
      };

      // Add fields based on account type
      if (data.account_type !== 'cash') {
        updateData.account_number = data.account_number;
        updateData.bank_name = data.bank_name;
      }

      updateData.opening_balance = data.opening_balance;
      updateData.notes = data.notes;

      await api.accounts.update(Number(account.id), updateData);
      onAccountUpdated();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message || 'Error updating account');
      } else {
        setError('Error updating account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Account</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.account_name}>
                <FormLabel>Account Name</FormLabel>
                <Input
                  {...register('account_name', { required: 'Account Name is required' })}
                  placeholder="Enter account name"
                />
                <FormErrorMessage>{errors.account_name?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.account_type}>
                <FormLabel>Account Type</FormLabel>
                <Select {...register('account_type', { required: 'Account Type is required' })}>
                  <option value="">-- Select --</option>
                  {ACCOUNT_TYPES.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.account_type?.message}</FormErrorMessage>
              </FormControl>

              {/* Account Number - not required for cash accounts */}
              {watchedAccountType !== 'cash' && (
                <FormControl isInvalid={!!errors.account_number}>
                  <FormLabel>Account Number</FormLabel>
                  <Input
                    {...register('account_number', { 
                      required: watchedAccountType !== 'cash' ? 'Account Number is required' : false
                    })}
                    placeholder="Enter account number"
                  />
                  <FormErrorMessage>{errors.account_number?.message}</FormErrorMessage>
                </FormControl>
              )}

              {/* Bank Name - not required for cash accounts */}
              {watchedAccountType !== 'cash' && (
                <FormControl isInvalid={!!errors.bank_name}>
                  <FormLabel>Bank Name</FormLabel>
                  <Input
                    {...register('bank_name', { 
                      required: watchedAccountType !== 'cash' ? 'Bank Name is required' : false
                    })}
                    placeholder="Enter bank name"
                  />
                  <FormErrorMessage>{errors.bank_name?.message}</FormErrorMessage>
                </FormControl>
              )}

              <FormControl isInvalid={!!errors.opening_balance}>
                <FormLabel>Opening Balance</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  {...register('opening_balance', { 
                    required: 'Opening Balance is required',
                    valueAsNumber: true 
                  })}
                  placeholder="Enter opening balance"
                />
                <FormErrorMessage>{errors.opening_balance?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Input
                  {...register('notes')}
                  placeholder="Enter any notes (optional)"
                />
              </FormControl>

              {error && (
                <Alert status="error">
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
            <Button colorScheme="blue" type="submit" isLoading={loading} loadingText="Updating...">
              Update Account
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EditAccountModal;