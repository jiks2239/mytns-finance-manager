import React, { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  Heading,
  useToast,
  Text,
  Alert,
  AlertIcon,
  Progress,
  Badge,
  Card,
  CardBody,
  Divider,
} from '@chakra-ui/react';
import {
  TransactionType,
  TransactionDirection,
  TransactionStatus,
  TransferMode,
  BankChargeType,
  getTransactionTypeLabel,
} from '../types/transaction';
import { 
  getValidStatusOptions,
  type TransactionType as UtilTransactionType,
  type TransactionStatus as UtilTransactionStatus
} from '../utils/transactionStatusUtils';
import type { CreateTransactionForm } from '../types/transaction';

const API_BASE = 'http://localhost:3000';

interface AddTransactionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string | number;
  onSuccess?: () => void;
}

interface Recipient {
  id: string;
  name: string;
  recipient_type: string;
  account_id?: number;
}

type FormValues = {
  transaction_direction: TransactionDirection;
  amount: number;
  transaction_type: TransactionType;
  recipient: string;
  description: string;
  status: TransactionStatus;

  // Type-specific fields
  deposit_date: string;
  transfer_date: string;
  transfer_mode: TransferMode;
  settlement_date: string;
  cheque_number: string;
  cheque_issue_date: string;
  cheque_due_date: string;
  cheque_submitted_date: string;
  cheque_cleared_date: string;
  cheque_bounce_charge: number;
  charge_type: BankChargeType;
  debit_date: string;
  debit_transfer_date: string;
  reference_number: string;
  cash_notes: string;
};

const STEPS = [
  "Direction",
  "Amount", 
  "Type",
  "Recipient",
  "Description",
  "Details"
];

const AddTransactionWizard: React.FC<AddTransactionWizardProps> = ({
  isOpen,
  onClose,
  accountId,
  onSuccess,
}) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormValues>();

  const watchedDirection = watch('transaction_direction');
  const watchedAmount = watch('amount');
  const watchedTransactionType = watch('transaction_type');
  const watchedRecipient = watch('recipient');
  const watchedDescription = watch('description');

  // Get available transaction types based on direction and amount
  const getAvailableTransactionTypes = (direction: TransactionDirection, amount: number) => {
    if (!direction || !amount) return [];

    if (direction === TransactionDirection.CREDIT) {
      return [
        { type: TransactionType.DEPOSIT, label: 'Cash Deposit', disabled: false, reason: '' },
        { type: TransactionType.TRANSFER, label: 'Bank Transfer (Incoming)', disabled: false, reason: '' },
        { type: TransactionType.SETTLEMENT, label: 'UPI Settlement', disabled: false, reason: '' },
        { type: TransactionType.CHEQUE, label: 'Cheque Received', disabled: false, reason: '' },
      ];
    } else {
      // Debit transactions with amount-based restrictions
      const types = [
        { 
          type: TransactionType.CHEQUE_GIVEN, 
          label: 'Cheque Payment', 
          disabled: false,
          reason: ''
        },
        { 
          type: TransactionType.BANK_CHARGE, 
          label: 'Bank Charges', 
          disabled: false,
          reason: ''
        },
        { 
          type: TransactionType.NEFT, 
          label: 'NEFT Transfer', 
          disabled: amount > 200000,
          reason: amount > 200000 ? 'Amount exceeds ₹2,00,000 limit' : ''
        },
        { 
          type: TransactionType.IMPS, 
          label: 'IMPS Transfer', 
          disabled: amount > 200000,
          reason: amount > 200000 ? 'Amount exceeds ₹2,00,000 limit' : ''
        },
        { 
          type: TransactionType.RTGS, 
          label: 'RTGS Transfer', 
          disabled: amount < 200000,
          reason: amount < 200000 ? 'Amount below ₹2,00,000 minimum' : ''
        },
        { 
          type: TransactionType.UPI, 
          label: 'UPI Transfer', 
          disabled: amount > 100000,
          reason: amount > 100000 ? 'Amount exceeds ₹1,00,000 limit' : ''
        },
      ];
      return types;
    }
  };

  // Get recipients filtered by transaction requirements
  const getFilteredRecipients = () => {
    // Recipients are already filtered during fetch based on transaction type
    return recipients;
  };

  // Check if recipient is required for selected transaction type
  const isRecipientRequired = () => {
    const requiresRecipient = [
      TransactionType.CHEQUE, 
      TransactionType.CHEQUE_GIVEN, 
      TransactionType.NEFT, 
      TransactionType.IMPS, 
      TransactionType.RTGS, 
      TransactionType.UPI
    ] as TransactionType[];
    return requiresRecipient.includes(watchedTransactionType as TransactionType);
  };

  // Get valid statuses for transaction type
  const getValidStatuses = (type: TransactionType): TransactionStatus[] => {
    const typeMap: Partial<Record<TransactionType, UtilTransactionType>> = {
      [TransactionType.DEPOSIT]: 'cash_deposit',
      [TransactionType.TRANSFER]: 'bank_transfer_in', 
      [TransactionType.SETTLEMENT]: 'upi_settlement',
      [TransactionType.CHEQUE]: 'cheque_received',
      [TransactionType.CHEQUE_GIVEN]: 'cheque_given',
      [TransactionType.BANK_CHARGE]: 'bank_charge',
      [TransactionType.NEFT]: 'bank_transfer_out',
      [TransactionType.IMPS]: 'bank_transfer_out',
      [TransactionType.RTGS]: 'bank_transfer_out',
      [TransactionType.UPI]: 'online',
    };

    const utilType = typeMap[type];
    if (!utilType) {
      return [TransactionStatus.PENDING, TransactionStatus.CANCELLED];
    }

    const utilStatuses = getValidStatusOptions(utilType);
    
    const statusMap: Partial<Record<UtilTransactionStatus, TransactionStatus>> = {
      'pending': TransactionStatus.PENDING,
      'cancelled': TransactionStatus.CANCELLED,
      'deposited': TransactionStatus.DEPOSITED,
      'cleared': TransactionStatus.CLEARED,
      'settled': TransactionStatus.SETTLED,
      'transferred': TransactionStatus.TRANSFERRED,
      'debited': TransactionStatus.DEBITED,
      'bounced': TransactionStatus.BOUNCED,
      'failed': TransactionStatus.FAILED,
      'completed': TransactionStatus.COMPLETED,
    };

    return utilStatuses.map(status => statusMap[status]).filter(Boolean) as TransactionStatus[];
  };

  const validateAmount = (value: number): string | true => {
    if (!value || value <= 0) {
      return 'Amount must be greater than 0';
    }
    
    // For debit transactions, check balance only if not pending
    if (watchedDirection === TransactionDirection.DEBIT) {
      if (currentBalance !== null && value > currentBalance) {
        return `Amount cannot exceed current balance (₹${currentBalance.toFixed(2)})`;
      }
    }
    
    return true;
  };

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const debitTransferTypes = [TransactionType.NEFT, TransactionType.IMPS, TransactionType.RTGS, TransactionType.UPI] as TransactionType[];
        const shouldFetchForInterAccountTransfer = watchedDirection === TransactionDirection.DEBIT && 
          watchedTransactionType && 
          debitTransferTypes.includes(watchedTransactionType as TransactionType);

        if (shouldFetchForInterAccountTransfer) {
          // For inter-account transfers, we need:
          // 1. Current account's own recipients (excluding self)
          // 2. All other accounts as recipients (for transferring TO them)
          
          const [accountRecipientsResponse, allRecipientsResponse] = await Promise.all([
            fetch(`${API_BASE}/recipients/for-transactions/${accountId}`),
            fetch(`${API_BASE}/recipients`)
          ]);

          if (accountRecipientsResponse.ok && allRecipientsResponse.ok) {
            const accountRecipients = await accountRecipientsResponse.json();
            const allRecipients = await allRecipientsResponse.json();

            // Get current account's recipients (excluding account-type recipients)
            const currentAccountNonAccountRecipients = accountRecipients.filter(
              (recipient: Recipient) => recipient.recipient_type !== 'account'
            );

            // Get all account-type recipients except the current account's self-recipient
            const otherAccountRecipients = allRecipients.filter(
              (recipient: Recipient) => 
                recipient.recipient_type === 'account' && 
                recipient.account_id !== Number(accountId)
            );

            // Combine them
            const combinedRecipients = [...currentAccountNonAccountRecipients, ...otherAccountRecipients];
            setRecipients(combinedRecipients);
          }
        } else {
          // For non-transfer transactions, use account-specific recipients
          const response = await fetch(`${API_BASE}/recipients/for-transactions/${accountId}`);
          if (response.ok) {
            const data = await response.json();
            setRecipients(data);
          }
        }
      } catch (error) {
        console.error('Error fetching recipients:', error);
      }
    };

    const fetchCurrentBalance = async () => {
      try {
        const response = await fetch(`${API_BASE}/accounts/${accountId}/balance`);
        if (response.ok) {
          const data = await response.json();
          setCurrentBalance(data.balance || 0);
        }
      } catch (error) {
        console.error('Error fetching account balance:', error);
        setCurrentBalance(0);
      }
    };

    if (isOpen) {
      fetchRecipients();
      fetchCurrentBalance();
    }
  }, [isOpen, accountId, watchedDirection, watchedTransactionType]);

  const onNext = async () => {
    let isValid = true;

    // Validate current step
    switch (currentStep) {
      case 0: // Direction
        isValid = await trigger('transaction_direction');
        break;
      case 1: // Amount
        isValid = await trigger('amount');
        break;
      case 2: // Type
        isValid = await trigger('transaction_type');
        break;
      case 3: // Recipient (only if required)
        if (isRecipientRequired()) {
          isValid = await trigger('recipient');
        }
        break;
      case 4: // Description (optional)
        isValid = true; // Description is optional
        break;
    }

    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const onBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormValues) => {
    console.log('=== FRONTEND DEBUG START ===');
    console.log('Form submission data:', data);
    console.log('Transaction type:', data.transaction_type);
    console.log('Transfer date field:', data.debit_transfer_date);
    
    // Check all possible date fields
    console.log('All date fields in form data:');
    console.log('- debit_transfer_date:', data.debit_transfer_date);
    console.log('- transfer_date:', data.transfer_date);
    console.log('- deposit_date:', data.deposit_date);
    console.log('- settlement_date:', data.settlement_date);
    console.log('- cheque_issue_date:', data.cheque_issue_date);
    console.log('- debit_date:', data.debit_date);
    
    // Get all form values to see what's actually in the form
    const allFormData = watch();
    console.log('Complete form state from watch():', allFormData);
    console.log('debit_transfer_date from watch():', allFormData.debit_transfer_date);
    
    console.log('=== FRONTEND DEBUG END ===');
    
    setIsLoading(true);
    try {
      const payload: CreateTransactionForm = {
        transaction_type: data.transaction_type,
        transaction_direction: data.transaction_direction,
        amount: data.amount,
        account_id: Number(accountId),
        status: data.status || TransactionStatus.PENDING,
        description: data.description,
      };

      // Add recipient if selected
      if (data.recipient && data.recipient !== '') {
        payload.recipient_id = Number(data.recipient);
      }

      // For Settlement, automatically set the account as recipient
      if (data.transaction_type === TransactionType.SETTLEMENT) {
        const accountRecipient = recipients.find(recipient => 
          recipient.account_id === Number(accountId)
        );
        if (accountRecipient) {
          payload.recipient_id = Number(accountRecipient.id);
        }
      }

      // Add type-specific details
      switch (data.transaction_type) {
        case TransactionType.DEPOSIT:
          payload.cash_deposit_details = {
            deposit_date: data.deposit_date,
            notes: data.cash_notes,
          };
          break;

        case TransactionType.TRANSFER:
          payload.bank_transfer_details = {
            transfer_date: data.transfer_date,
            transfer_mode: data.transfer_mode,
            reference_number: data.reference_number,
            notes: data.description,
          };
          break;

        case TransactionType.SETTLEMENT:
          payload.upi_settlement_details = {
            settlement_date: data.settlement_date,
            notes: data.description,
          };
          break;

        case TransactionType.CHEQUE:
        case TransactionType.CHEQUE_GIVEN:
          payload.cheque_details = {
            cheque_number: data.cheque_number,
            cheque_issue_date: data.cheque_issue_date,
            cheque_due_date: data.cheque_due_date,
            cheque_cleared_date: data.cheque_cleared_date,
            notes: data.description,
          };
          break;

        case TransactionType.BANK_CHARGE:
          payload.bank_charge_details = {
            charge_type: data.charge_type,
            debit_date: data.debit_date,
            notes: data.description,
          };
          break;

        case TransactionType.NEFT:
        case TransactionType.IMPS:
        case TransactionType.RTGS:
        case TransactionType.UPI:
          console.log('=== TRANSFER TYPE DEBUG START ===');
          console.log('Transaction type:', data.transaction_type);
          console.log('debit_transfer_date field:', data.debit_transfer_date);
          console.log('typeof debit_transfer_date:', typeof data.debit_transfer_date);
          console.log('Is undefined?:', data.debit_transfer_date === undefined);
          console.log('Is null?:', data.debit_transfer_date === null);
          console.log('Is empty string?:', data.debit_transfer_date === '');
          console.log('=== TRANSFER TYPE DEBUG END ===');
          
          payload.online_transfer_details = {
            transfer_date: data.debit_transfer_date,
          };
          break;
      }

      console.log('=== FINAL PAYLOAD DEBUG START ===');
      console.log('Final payload:', payload);
      console.log('bank_transfer_details:', payload.bank_transfer_details);
      console.log('online_transfer_details:', payload.online_transfer_details);
      console.log('transfer_date in bank_transfer_details:', payload.bank_transfer_details?.transfer_date);
      console.log('transfer_date in online_transfer_details:', payload.online_transfer_details?.transfer_date);
      console.log('=== FINAL PAYLOAD DEBUG END ===');

      const response = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Transaction Created',
          description: 'Transaction has been created successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        const errorData = await response.json();
        console.log('=== BACKEND ERROR DEBUG ===');
        console.log('Response status:', response.status);
        console.log('Error response:', errorData);
        console.log('=== BACKEND ERROR DEBUG END ===');
        throw new Error(errorData.message || 'Failed to create transaction');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create transaction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep(0);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Direction Selection
        return (
          <VStack spacing={6}>
            <Heading size="lg" textAlign="center" color="blue.600">
              Choose Transaction Direction
            </Heading>
            <Text textAlign="center" color="gray.600">
              Will money be coming into your account or going out?
            </Text>
            
            <FormControl isRequired isInvalid={!!errors.transaction_direction}>
              <FormLabel fontSize="lg">Transaction Direction</FormLabel>
              <Select 
                {...register('transaction_direction', { required: 'Please select transaction direction' })} 
                placeholder="Select transaction direction"
                size="lg"
              >
                <option value={TransactionDirection.CREDIT}>
                  💰 Credit (Money Coming In)
                </option>
                <option value={TransactionDirection.DEBIT}>
                  💸 Debit (Money Going Out)
                </option>
              </Select>
              <FormErrorMessage>{errors.transaction_direction?.message}</FormErrorMessage>
            </FormControl>
          </VStack>
        );

      case 1: // Amount Entry
        return (
          <VStack spacing={6}>
            <Heading size="lg" textAlign="center" color="blue.600">
              Enter Transaction Amount
            </Heading>
            <Text textAlign="center" color="gray.600">
              How much money is involved in this transaction?
            </Text>
            
            <FormControl isRequired isInvalid={!!errors.amount}>
              <FormLabel fontSize="lg">Amount (₹)</FormLabel>
              <Input
                type="number"
                step="0.01"
                size="lg"
                fontSize="xl"
                textAlign="center"
                {...register('amount', { 
                  required: 'Please enter the amount',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Amount must be greater than 0' },
                  validate: validateAmount
                })}
              />
              <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
            </FormControl>

            {watchedDirection === TransactionDirection.DEBIT && currentBalance > 0 && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text>Current Account Balance: ₹{currentBalance.toFixed(2)}</Text>
              </Alert>
            )}

            {watchedDirection && watchedAmount && (
              <Card width="100%">
                <CardBody>
                  <Text fontWeight="bold">Transaction Summary:</Text>
                  <Text>Direction: {watchedDirection === TransactionDirection.CREDIT ? '💰 Money Coming In' : '💸 Money Going Out'}</Text>
                  <Text>Amount: ₹{watchedAmount.toFixed(2)}</Text>
                </CardBody>
              </Card>
            )}
          </VStack>
        );

      case 2: // Transaction Type Selection
        return (
          <VStack spacing={6}>
            <Heading size="lg" textAlign="center" color="blue.600">
              Choose Transaction Type
            </Heading>
            <Text textAlign="center" color="gray.600">
              What type of transaction is this?
            </Text>
            
            <FormControl isRequired isInvalid={!!errors.transaction_type}>
              <FormLabel fontSize="lg">Transaction Type</FormLabel>
              <Select 
                {...register('transaction_type', { required: 'Please select transaction type' })} 
                placeholder="Select transaction type"
                size="lg"
              >
                {getAvailableTransactionTypes(watchedDirection, watchedAmount).map((typeInfo) => (
                  <option 
                    key={typeInfo.type} 
                    value={typeInfo.type}
                    disabled={typeInfo.disabled}
                  >
                    {typeInfo.label} {typeInfo.disabled && '(Not Available)'}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.transaction_type?.message}</FormErrorMessage>
            </FormControl>

            {/* Show restrictions for debit transactions */}
            {watchedDirection === TransactionDirection.DEBIT && watchedAmount && (
              <VStack spacing={3} width="100%">
                {getAvailableTransactionTypes(watchedDirection, watchedAmount)
                  .filter(type => type.disabled)
                  .map((type, index) => (
                    <Alert key={index} status="warning" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">
                        <strong>{type.label}</strong> is not available: {type.reason}
                      </Text>
                    </Alert>
                  ))}
              </VStack>
            )}

            {watchedTransactionType && (
              <Card width="100%">
                <CardBody>
                  <Text fontWeight="bold">Selected:</Text>
                  <Text>{getTransactionTypeLabel(watchedTransactionType)}</Text>
                </CardBody>
              </Card>
            )}
          </VStack>
        );

      case 3: // Recipient Selection
        return (
          <VStack spacing={6}>
            <Heading size="lg" textAlign="center" color="blue.600">
              {isRecipientRequired() ? 'Select Recipient' : 'Select Recipient (Optional)'}
            </Heading>
            <Text textAlign="center" color="gray.600">
              {isRecipientRequired() 
                ? 'Who is involved in this transaction?' 
                : 'You can optionally specify who this transaction involves.'}
            </Text>
            
            <FormControl 
              isRequired={isRecipientRequired()}
              isInvalid={!!errors.recipient}
            >
              <FormLabel fontSize="lg">
                Recipient
                {!isRecipientRequired() && <Badge ml={2} colorScheme="gray">Optional</Badge>}
              </FormLabel>
              <Select 
                {...register('recipient', {
                  required: isRecipientRequired() ? 'Please select a recipient' : false
                })} 
                placeholder="Select recipient"
                size="lg"
              >
                {getFilteredRecipients().map((recipient) => (
                  <option key={recipient.id} value={recipient.id}>
                    {recipient.name} ({recipient.recipient_type})
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.recipient?.message}</FormErrorMessage>
            </FormControl>

            {watchedTransactionType === TransactionType.SETTLEMENT && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  For UPI settlements, the recipient will be automatically set to your account.
                </Text>
              </Alert>
            )}

            {watchedRecipient && (
              <Card width="100%">
                <CardBody>
                  <Text fontWeight="bold">Selected Recipient:</Text>
                  <Text>{recipients.find(r => String(r.id) === String(watchedRecipient))?.name || 'Not found'}</Text>
                  <Text fontSize="sm" color="gray.600">
                    Type: {recipients.find(r => String(r.id) === String(watchedRecipient))?.recipient_type || 'Unknown'}
                  </Text>
                </CardBody>
              </Card>
            )}
          </VStack>
        );

      case 4: // Description Entry
        return (
          <VStack spacing={6}>
            <Heading size="lg" textAlign="center" color="blue.600">
              Add Description
            </Heading>
            <Text textAlign="center" color="gray.600">
              Provide any additional details about this transaction.
            </Text>
            
            <FormControl>
              <FormLabel fontSize="lg">
                Description 
                <Badge ml={2} colorScheme="gray">Optional</Badge>
              </FormLabel>
              <Textarea 
                {...register('description')} 
                rows={4}
                placeholder="Enter transaction description, notes, or reference details..."
                size="lg"
              />
            </FormControl>

            {watchedDescription && (
              <Card width="100%">
                <CardBody>
                  <Text fontWeight="bold">Description Preview:</Text>
                  <Text>{watchedDescription}</Text>
                </CardBody>
              </Card>
            )}
          </VStack>
        );

      case 5: // Type-specific Details
        return (
          <VStack spacing={6}>
            <Heading size="lg" textAlign="center" color="blue.600">
              Complete Transaction Details
            </Heading>
            <Text textAlign="center" color="gray.600">
              Fill in the required details for your {getTransactionTypeLabel(watchedTransactionType)} transaction.
            </Text>
            
            {/* Transaction Summary */}
            <Card width="100%" bg="blue.50">
              <CardBody>
                <Text fontWeight="bold" mb={2}>Transaction Summary:</Text>
                <Text>Direction: {watchedDirection === TransactionDirection.CREDIT ? '💰 Credit' : '💸 Debit'}</Text>
                <Text>Type: {getTransactionTypeLabel(watchedTransactionType)}</Text>
                <Text>Amount: ₹{watchedAmount?.toFixed(2)}</Text>
                {watchedRecipient && (
                  <Text>Recipient: {recipients.find(r => String(r.id) === String(watchedRecipient))?.name || 'Not found'} ({recipients.find(r => String(r.id) === String(watchedRecipient))?.recipient_type || 'Unknown'})</Text>
                )}
                {watchedDescription && <Text>Description: {watchedDescription}</Text>}
                
                {/* Debug info - can be removed later */}
                {import.meta.env.DEV && (
                  <VStack spacing={1} mt={2} align="start">
                    <Text fontSize="xs" color="gray.500">Debug Info:</Text>
                    <Text fontSize="xs" color="gray.500">Recipient ID: {watchedRecipient || 'None'}</Text>
                    <Text fontSize="xs" color="gray.500">Recipients loaded: {recipients.length}</Text>
                    <Text fontSize="xs" color="gray.500">Recipient IDs: {recipients.map(r => r.id).join(', ')}</Text>
                    <Text fontSize="xs" color="gray.500">Can submit: {canGoNext().toString()}</Text>
                    <Text fontSize="xs" color="gray.500">Transfer date: {watch('debit_transfer_date') || 'Not set'}</Text>
                    <Text fontSize="xs" color="gray.500">Transaction type: {watchedTransactionType}</Text>
                    <Text fontSize="xs" color="gray.500">Form errors: {Object.keys(errors).join(', ') || 'None'}</Text>
                  </VStack>
                )}
              </CardBody>
            </Card>

            <Divider />

            {/* Status Selection */}
            <FormControl>
              <FormLabel>Transaction Status</FormLabel>
              <Select {...register('status')} placeholder="Select status (optional)">
                {watchedTransactionType && getValidStatuses(watchedTransactionType).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Type-specific fields */}
            {renderTypeSpecificFields()}
          </VStack>
        );

      default:
        return null;
    }
  };

  const renderTypeSpecificFields = () => {
    if (!watchedTransactionType) return null;

    switch (watchedTransactionType) {
      case TransactionType.DEPOSIT:
        return (
          <VStack spacing={4} width="100%">
            <FormControl isRequired isInvalid={!!errors.deposit_date}>
              <FormLabel>Date of Deposit</FormLabel>
              <Input
                type="date"
                {...register('deposit_date', { required: 'Date of deposit is required' })}
              />
              <FormErrorMessage>{errors.deposit_date?.message}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>Additional Notes</FormLabel>
              <Textarea {...register('cash_notes')} rows={2} />
            </FormControl>
          </VStack>
        );

      case TransactionType.TRANSFER:
        return (
          <VStack spacing={4} width="100%">
            <HStack spacing={4} width="100%">
              <FormControl isRequired isInvalid={!!errors.transfer_date}>
                <FormLabel>Date of Transfer</FormLabel>
                <Input
                  type="date"
                  {...register('transfer_date', { required: 'Date of transfer is required' })}
                />
                <FormErrorMessage>{errors.transfer_date?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.transfer_mode}>
                <FormLabel>Transfer Mode</FormLabel>
                <Select
                  {...register('transfer_mode', { required: 'Transfer mode is required' })}
                  placeholder="Select mode"
                >
                  <option value={TransferMode.NEFT}>NEFT</option>
                  <option value={TransferMode.IMPS}>IMPS</option>
                  <option value={TransferMode.RTGS}>RTGS</option>
                  <option value={TransferMode.UPI}>UPI</option>
                </Select>
                <FormErrorMessage>{errors.transfer_mode?.message}</FormErrorMessage>
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Reference Number</FormLabel>
              <Input {...register('reference_number')} />
            </FormControl>
          </VStack>
        );

      case TransactionType.SETTLEMENT:
        return (
          <VStack spacing={4} width="100%">
            <FormControl isRequired isInvalid={!!errors.settlement_date}>
              <FormLabel>Date of Settlement</FormLabel>
              <Input
                type="date"
                {...register('settlement_date', { required: 'Date of settlement is required' })}
              />
              <FormErrorMessage>{errors.settlement_date?.message}</FormErrorMessage>
            </FormControl>
          </VStack>
        );

      case TransactionType.CHEQUE:
      case TransactionType.CHEQUE_GIVEN:
        return (
          <VStack spacing={4} width="100%">
            <FormControl isRequired isInvalid={!!errors.cheque_number}>
              <FormLabel>Cheque Number</FormLabel>
              <Input
                type="text"
                {...register('cheque_number', { required: 'Cheque number is required' })}
              />
              <FormErrorMessage>{errors.cheque_number?.message}</FormErrorMessage>
            </FormControl>
            <HStack spacing={4} width="100%">
              <FormControl isRequired isInvalid={!!errors.cheque_issue_date}>
                <FormLabel>Date of Issue</FormLabel>
                <Input 
                  type="date" 
                  {...register('cheque_issue_date', { required: 'Date of issue is required' })} 
                />
                <FormErrorMessage>{errors.cheque_issue_date?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.cheque_due_date}>
                <FormLabel>Date of Due</FormLabel>
                <Input
                  type="date"
                  {...register('cheque_due_date', { required: 'Date of due is required' })}
                />
                <FormErrorMessage>{errors.cheque_due_date?.message}</FormErrorMessage>
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Date of Clearance</FormLabel>
              <Input type="date" {...register('cheque_cleared_date')} />
            </FormControl>
          </VStack>
        );

      case TransactionType.BANK_CHARGE:
        return (
          <VStack spacing={4} width="100%">
            <HStack spacing={4} width="100%">
              <FormControl isRequired isInvalid={!!errors.charge_type}>
                <FormLabel>Charge Type</FormLabel>
                <Select
                  {...register('charge_type', { required: 'Charge type is required' })}
                  placeholder="Select charge type"
                >
                  <option value={BankChargeType.NEFT_CHARGE}>NEFT Charge</option>
                  <option value={BankChargeType.IMPS_CHARGE}>IMPS Charge</option>
                  <option value={BankChargeType.RTGS_CHARGE}>RTGS Charge</option>
                  <option value={BankChargeType.CHEQUE_RETURN_CHARGE}>Cheque Return Charge</option>
                  <option value={BankChargeType.ATM_CHARGE}>ATM Charge</option>
                  <option value={BankChargeType.CASH_DEPOSIT_CHARGE}>Cash Deposit Charge</option>
                  <option value={BankChargeType.MAINTENANCE_FEE}>Maintenance Fee</option>
                  <option value={BankChargeType.OTHER}>Other</option>
                </Select>
                <FormErrorMessage>{errors.charge_type?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.debit_date}>
                <FormLabel>Date of Debit</FormLabel>
                <Input
                  type="date"
                  {...register('debit_date', { required: 'Date of debit is required' })}
                />
                <FormErrorMessage>{errors.debit_date?.message}</FormErrorMessage>
              </FormControl>
            </HStack>
          </VStack>
        );

      case TransactionType.NEFT:
      case TransactionType.IMPS:
      case TransactionType.RTGS:
      case TransactionType.UPI:
        return (
          <VStack spacing={4} width="100%">
            <FormControl isRequired isInvalid={!!errors.debit_transfer_date}>
              <FormLabel>Date of Transfer</FormLabel>
              <Input
                type="date"
                {...register('debit_transfer_date', { required: 'Date of transfer is required' })}
              />
              <FormErrorMessage>{errors.debit_transfer_date?.message}</FormErrorMessage>
            </FormControl>
          </VStack>
        );

      default:
        return null;
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return !!watchedDirection;
      case 1: return !!watchedAmount && watchedAmount > 0;
      case 2: return !!watchedTransactionType;
      case 3: return !isRecipientRequired() || !!watchedRecipient;
      case 4: return true; // Description is optional
      case 5: {
        // Final step - validate that we have all required fields
        const hasBasicFields = !!watchedDirection && !!watchedAmount && !!watchedTransactionType;
        const hasRequiredRecipient = !isRecipientRequired() || !!watchedRecipient;
        
        // Additional type-specific field validation
        let hasRequiredTypeFields = true;
        const watchedData = watch(); // Get all form data
        
        switch (watchedTransactionType) {
          case TransactionType.DEPOSIT:
            hasRequiredTypeFields = !!watchedData.deposit_date;
            break;
          case TransactionType.TRANSFER:
            hasRequiredTypeFields = !!watchedData.transfer_date && !!watchedData.transfer_mode;
            break;
          case TransactionType.SETTLEMENT:
            hasRequiredTypeFields = !!watchedData.settlement_date;
            break;
          case TransactionType.CHEQUE:
          case TransactionType.CHEQUE_GIVEN:
            hasRequiredTypeFields = !!watchedData.cheque_number && !!watchedData.cheque_issue_date && !!watchedData.cheque_due_date;
            break;
          case TransactionType.BANK_CHARGE:
            hasRequiredTypeFields = !!watchedData.charge_type && !!watchedData.debit_date;
            break;
          case TransactionType.NEFT:
          case TransactionType.IMPS:
          case TransactionType.RTGS:
          case TransactionType.UPI:
            hasRequiredTypeFields = !!watchedData.debit_transfer_date;
            break;
        }
        
        return hasBasicFields && hasRequiredRecipient && hasRequiredTypeFields;
      }
      default: return false;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <VStack spacing={2} align="start">
            <Text>Create New Transaction</Text>
            <Text fontSize="sm" color="gray.500">
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
            </Text>
            <Progress 
              value={(currentStep + 1) / STEPS.length * 100} 
              width="100%" 
              colorScheme="blue" 
              size="sm"
              borderRadius="md"
            />
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {renderStepContent()}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              variant="ghost" 
              onClick={onBack}
              isDisabled={currentStep === 0}
            >
              Back
            </Button>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button 
                colorScheme="blue" 
                onClick={onNext}
                isDisabled={!canGoNext()}
              >
                Next
              </Button>
            ) : (
              <Button 
                colorScheme="blue" 
                onClick={handleSubmit(onSubmit)} 
                isLoading={isLoading}
                loadingText="Creating..."
                isDisabled={!canGoNext()}
              >
                Create Transaction
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddTransactionWizard;
