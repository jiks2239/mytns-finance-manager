import React from 'react';
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
  useColorModeValue,
  Textarea} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: () => Promise<void>;
}

type FormValues = {
  account_name: string;
  account_number: string;
  account_type: string;
  bank_name: string;
  opening_balance: number;
  description: string;
};

const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountAdded,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      account_name: '',
      account_number: '',
      account_type: '',
      bank_name: '',
      opening_balance: 0,
      description: '',
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);



  const onSubmit = async (data: FormValues) => {
    // Send data to backend here
    try {
      const res = await fetch('http://localhost:3000/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add account');
      await onAccountAdded();
      onClose();
    } catch {
      alert('Failed to add account');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent borderRadius="xl" boxShadow="2xl" bg={useColorModeValue('white', 'gray.800')}>
        <ModalHeader fontWeight="bold">Add Account</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <ModalBody pb={6}>
            <FormControl isInvalid={!!errors.account_name} mb={4} isRequired>
              <FormLabel>Account Name</FormLabel>
              <Input
                type="text"
                {...register('account_name', { required: 'Account Name is required' })}
                autoFocus
                autoComplete="off"
              />
              <FormErrorMessage>{errors.account_name && errors.account_name.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.account_number} mb={4} isRequired>
              <FormLabel>Account Number</FormLabel>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9\s]+"
                {...register('account_number', {
                  required: 'Account Number is required',
                  validate: value =>
                    /^[0-9\s]+$/.test(value) || 'Account Number must contain only numbers',
                })}
              />
              <FormErrorMessage>{errors.account_number && errors.account_number.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.account_type} mb={4} isRequired>
              <FormLabel>Account Type</FormLabel>
              <Select
                placeholder="-- Select --"
                {...register('account_type', { required: 'Account Type is required' })}
              >
                <option value="current">Current Account</option>
                <option value="savings">Savings Account</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="loan">Loan</option>
                <option value="other">Other</option>
              </Select>
              <FormErrorMessage>{errors.account_type && errors.account_type.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.bank_name} mb={4} isRequired>
              <FormLabel>Bank Name</FormLabel>
              <Input
                type="text"
                {...register('bank_name', {
                  required: 'Bank Name is required',
                  validate: value =>
                    /^[A-Za-z\s]+$/.test(value) || 'Bank Name must contain only letters',
                })}
              />
              <FormErrorMessage>{errors.bank_name && errors.bank_name.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.opening_balance} mb={4} isRequired>
              <FormLabel>Opening Balance</FormLabel>
              <Input
                type="number"
                {...register('opening_balance', {
                  required: 'Opening Balance is required',
                  valueAsNumber: true,
                })}
              />
              <FormErrorMessage>{errors.opening_balance && errors.opening_balance.message}</FormErrorMessage>
            </FormControl>
            <FormControl mb={2}>
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea
                {...register('description')}
                resize="vertical"
                minH="40px"
                maxH="120px"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit">
              Add Account
            </Button>
            <Button onClick={onClose} variant="ghost">Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default AddAccountModal;