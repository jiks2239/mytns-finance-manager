import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, FormErrorMessage, Input, Select, Button, VStack, HStack,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Textarea, Text, useColorModeValue, Alert, AlertIcon, Box, Heading,
  useToast
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { 
  getValidStatusOptions, 
  getStatusLabel,
  type TransactionType
} from '../utils/transactionStatusUtils';
import api, { type Transaction as APITransaction } from '../api';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

// Extend the API Transaction interface to include fields needed by this component
interface Transaction extends APITransaction {
  account?: {
    id: number;
    account_name: string;
  };
  date?: string; // fallback field name
}

// Define types for transaction details
interface CashDepositDetails {
  deposit_date?: string;
  notes?: string;
}

interface ChequeDetails {
  cheque_number?: string;
  cheque_issue_date?: string;        // Renamed from cheque_given_date
  cheque_due_date?: string;
  cheque_cleared_date?: string;
  cheque_bounce_charge?: number;     // New field for bounce charges
  notes?: string;
}

interface BankTransferDetails {
  transfer_date?: string;
  settlement_date?: string;
  transfer_mode?: string;
  reference_number?: string;
  notes?: string;
}

interface UpiSettlementDetails {
  settlement_date?: string;
  upi_reference_number?: string;
  batch_number?: string;
  notes?: string;
}

interface AccountTransferDetails {
  transfer_date?: string;
  transfer_reference?: string;
  purpose?: string;
  notes?: string;
}

interface BankChargeDetails {
  charge_type?: string;
  debit_date?: string;              // Renamed from charge_date
  notes?: string;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: (id: string | number) => void;
}

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

type EditTransactionFormData = {
  transaction_type: string;
  amount: number;
  description: string;
  status: string;
  recipient: string;
  // Cheque details
  cheque_number: string;
  cheque_issue_date: string;          // Renamed from cheque_given_date
  cheque_due_date: string;
  cheque_cleared_date: string;
  cheque_bounce_charge: number;       // New field
  // Bank charge details
  charge_type: string;
  debit_date: string;                 // Renamed from charge_date
  // Other details
  deposit_date: string;
  transfer_date: string;
  settlement_date: string;
  upi_settlement_date: string;        // For UPI settlements
  transfer_mode: string;
  reference_number: string;
  upi_reference_number: string;
  batch_number: string;
  to_account_id: string;             // For account transfers
  account_transfer_date: string;     // For account transfers
  transfer_reference: string;
  purpose: string;
  notes: string;
  // Legacy field (backward compatibility)
  charge_date: string;
};

// Helper function to get the primary transaction date from form data
const getTransactionDateFromFormData = (data: EditTransactionFormData): string => {
  switch (data.transaction_type) {
    case 'cash_deposit':
      return formatDateForAPI(data.deposit_date) || '';
    case 'cheque_received':
    case 'cheque_given':
      return formatDateForAPI(data.cheque_issue_date) || '';
    case 'bank_transfer_in':
    case 'bank_transfer_out':
      return formatDateForAPI(data.transfer_date) || '';
    case 'upi_settlement':
      return formatDateForAPI(data.upi_settlement_date) || '';
    case 'account_transfer':
      return formatDateForAPI(data.account_transfer_date) || '';
    case 'bank_charge':
      return formatDateForAPI(data.debit_date) || '';
    default:
      return '';
  }
};

// Helper function to format date for HTML date input (YYYY-MM-DD)
const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Format as YYYY-MM-DD for HTML date input
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// Helper function to convert YYYY-MM-DD date to ISO 8601 string
const formatDateForAPI = (dateString: string | undefined): string | undefined => {
  if (!dateString) return undefined;
  
  // Handle common placeholder or empty values
  const trimmed = dateString.trim();
  if (trimmed === '' || trimmed === 'dd/mm/yyyy' || trimmed === 'mm/dd/yyyy' || 
      trimmed === 'yyyy-mm-dd' || trimmed === 'null' || trimmed === 'undefined') {
    return undefined;
  }
  
  try {
    // Create date object from YYYY-MM-DD string
    const date = new Date(dateString + 'T00:00:00.000Z');
    if (isNaN(date.getTime())) return undefined;
    
    // Return full ISO 8601 string
    return date.toISOString();
  } catch {
    return undefined;
  }
};

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSuccess,
  onDelete,
}) => {
  const toast = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recipients, setRecipients] = useState<Array<{id: number, name: string}>>([]);
  const [accounts, setAccounts] = useState<Array<{id: number, account_name: string}>>([]);
  
  // Color mode values - moved to top level
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const readOnlyBg = useColorModeValue('gray.50', 'gray.700');

  // Get the transaction type from the transaction
  const transactionType = (transaction?.transaction_type as TransactionType) || 'cash_deposit';
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditTransactionFormData>({
    defaultValues: {
      transaction_type: "",
      amount: 0,
      description: "",
      status: "completed",
      recipient: "",
      // Initialize all transaction-specific fields
      deposit_date: "",
      cheque_number: "",
      cheque_issue_date: "",
      cheque_due_date: "",
      cheque_cleared_date: "",
      transfer_date: "",
      settlement_date: "",
      transfer_mode: "",
      reference_number: "",
      upi_settlement_date: "",
      upi_reference_number: "",
      batch_number: "",
      to_account_id: "",
      account_transfer_date: "",
      transfer_reference: "",
      purpose: "",
      charge_type: "",
      charge_date: "",
    },
  });

  // Watch the transaction type for conditional rendering
  const watchedTransactionType = watch('transaction_type') || transaction?.transaction_type;

  // Get valid status options for the transaction type
  const getStatusOptionsForType = (transactionType: TransactionType) => {
    const validStatuses = getValidStatusOptions(transactionType);
    
    if (validStatuses.length === 0) {
      console.warn('No valid statuses found for transaction type:', transactionType);
      return [
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ];
    }
    
    return validStatuses.map(status => ({
      value: status,
      label: getStatusLabel(status),
    }));
  };

  useEffect(() => {
    if (transaction) {
      // Prepare all field values based on transaction details
      const formValues: Partial<EditTransactionFormData> = {
        transaction_type: transaction.transaction_type || "",
        amount: transaction.amount || 0,
        description: transaction.description || "",
        status: transaction.status || "completed",
        recipient: "", // Reset to empty, will be set separately
      };

      // Add transaction-specific details based on type
      switch (transaction.transaction_type) {
        case 'cash_deposit':
          if (transaction.cash_deposit_details) {
            const details = transaction.cash_deposit_details as CashDepositDetails;
            formValues.deposit_date = formatDateForInput(details.deposit_date);
          }
          break;
          
        case 'cheque_received':
        case 'cheque_given':
          if (transaction.cheque_details) {
            const details = transaction.cheque_details as ChequeDetails;
            formValues.cheque_number = details.cheque_number || "";
            formValues.cheque_issue_date = formatDateForInput(details.cheque_issue_date);
            formValues.cheque_due_date = formatDateForInput(details.cheque_due_date);
            formValues.cheque_cleared_date = formatDateForInput(details.cheque_cleared_date);
          }
          break;
          
        case 'bank_transfer_in':
        case 'bank_transfer_out':
          if (transaction.bank_transfer_details) {
            const details = transaction.bank_transfer_details as BankTransferDetails;
            formValues.transfer_date = formatDateForInput(details.transfer_date);
            formValues.settlement_date = formatDateForInput(details.settlement_date);
            formValues.transfer_mode = details.transfer_mode || "";
            formValues.reference_number = details.reference_number || "";
          }
          break;
          
        case 'upi_settlement':
          if (transaction.upi_settlement_details) {
            const details = transaction.upi_settlement_details as UpiSettlementDetails;
            formValues.upi_settlement_date = formatDateForInput(details.settlement_date);
            formValues.upi_reference_number = details.upi_reference_number || "";
            formValues.batch_number = details.batch_number || "";
          }
          break;
          
        case 'account_transfer':
          if (transaction.account_transfer_details) {
            const details = transaction.account_transfer_details as AccountTransferDetails;
            formValues.to_account_id = transaction.to_account?.id?.toString() || "";
            formValues.account_transfer_date = formatDateForInput(details.transfer_date);
            formValues.transfer_reference = details.transfer_reference || "";
            formValues.purpose = details.purpose || "";
          }
          break;
          
        case 'bank_charge':
          if (transaction.bank_charge_details) {
            const details = transaction.bank_charge_details as BankChargeDetails;
            formValues.charge_type = details.charge_type || "";
            formValues.debit_date = formatDateForInput(details.debit_date);
          }
          break;
      }
      
      // Reset form with all values
      reset(formValues);

      // Fetch recipients for the account when transaction changes
      if (transaction.account?.id) {
        fetchRecipients(transaction.account.id);
      } else {
        setRecipients([]);
      }
      
      // Fetch accounts for account transfer transactions
      fetchAccounts();
    }
  }, [transaction, reset]);

  // Separate useEffect to set recipient value after recipients are loaded
  useEffect(() => {
    if (transaction && recipients.length >= 0) { // Check even for empty array (in case no recipients)
      const recipientValue = transaction.recipient?.id?.toString() || "";
      console.log('Setting recipient value:', {
        recipient: recipientValue,
        recipientObject: transaction.recipient,
        availableRecipients: recipients.length,
        recipientsList: recipients.map(r => `${r.id}: ${r.name}`)
      });
      
      // Set recipient value specifically
      setValue('recipient', recipientValue);
    }
  }, [transaction, recipients, setValue]);

  // Function to fetch recipients
  const fetchRecipients = async (accountId: number): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:3000/recipients/for-transactions/${accountId}`);
      if (response.ok) {
        const data = await response.json();
        setRecipients(data);
      } else {
        console.error('Failed to fetch recipients');
        setRecipients([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
      setRecipients([]); // Set empty array on error
    }
  };

  // Function to fetch accounts
  const fetchAccounts = async (): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:3000/accounts`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        console.error('Failed to fetch accounts');
        setAccounts([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]); // Set empty array on error
    }
  };

  // Render transaction-type specific fields
  const renderTypeSpecificFields = () => {
    switch (watchedTransactionType) {
      case 'cash_deposit':
        return (
          <Box>
            <Heading size="md" mb={4}>Cash Deposit Details</Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.deposit_date}>
                <FormLabel>Deposit Date</FormLabel>
                <Input
                  type="date"
                  {...register('deposit_date', { required: 'Deposit date is required' })}
                />
                <FormErrorMessage>{errors.deposit_date?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </Box>
        );

      case 'cheque_received':
      case 'cheque_given':
        return (
          <Box>
            <Heading size="md" mb={4}>Cheque Details</Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.cheque_number}>
                <FormLabel>Cheque Number</FormLabel>
                <Input
                  type="text"
                  {...register('cheque_number', { required: 'Cheque number is required' })}
                />
                <FormErrorMessage>{errors.cheque_number?.message}</FormErrorMessage>
              </FormControl>
              <HStack spacing={4} width="100%">
                <FormControl>
                  <FormLabel>
                    {watchedTransactionType === 'cheque_received' ? 'Received Date' : 'Given Date'}
                  </FormLabel>
                  <Input type="date" {...register('cheque_issue_date')} />
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.cheque_due_date}>
                  <FormLabel>Due Date</FormLabel>
                  <Input
                    type="date"
                    {...register('cheque_due_date', { required: 'Due date is required' })}
                  />
                  <FormErrorMessage>{errors.cheque_due_date?.message}</FormErrorMessage>
                </FormControl>
              </HStack>
              <FormControl isInvalid={!!errors.cheque_cleared_date}>
                <FormLabel>Cleared Date</FormLabel>
                <Input
                  type="date"
                  {...register('cheque_cleared_date', {
                    validate: (value) => {
                      const currentStatus = watch('status');
                      if (value && currentStatus !== 'cleared') {
                        return 'Cleared date can only be entered when status is "Cleared"';
                      }
                      if (!value && currentStatus === 'cleared') {
                        return 'Cleared date is required when status is "Cleared"';
                      }
                      return true;
                    }
                  })}
                />
                <FormErrorMessage>{errors.cheque_cleared_date?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </Box>
        );

      case 'bank_transfer_in':
        return (
          <Box>
            <Heading size="md" mb={4}>Bank Transfer Details</Heading>
            <VStack spacing={4}>
              <HStack spacing={4} width="100%">
                <FormControl isRequired isInvalid={!!errors.transfer_date}>
                  <FormLabel>Transfer Date</FormLabel>
                  <Input
                    type="date"
                    {...register('transfer_date', { required: 'Transfer date is required' })}
                  />
                  <FormErrorMessage>{errors.transfer_date?.message}</FormErrorMessage>
                </FormControl>
                <FormControl>
                  <FormLabel>Settlement Date</FormLabel>
                  <Input type="date" {...register('settlement_date')} />
                </FormControl>
              </HStack>
              <FormControl isRequired isInvalid={!!errors.transfer_mode}>
                <FormLabel>Transfer Mode</FormLabel>
                <Select {...register('transfer_mode', { required: 'Transfer mode is required' })} placeholder="--Select--">
                  <option value="neft">NEFT</option>
                  <option value="imps">IMPS</option>
                  <option value="rtgs">RTGS</option>
                </Select>
                <FormErrorMessage>{errors.transfer_mode?.message}</FormErrorMessage>
              </FormControl>
              <FormControl>
                <FormLabel>Reference Number</FormLabel>
                <Input type="text" {...register('reference_number')} />
              </FormControl>
            </VStack>
          </Box>
        );

      case 'bank_transfer_out':
        return (
          <Box>
            <Heading size="md" mb={4}>Bank Transfer Details</Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.transfer_date}>
                <FormLabel>Transfer Date</FormLabel>
                <Input
                  type="date"
                  {...register('transfer_date', { required: 'Transfer date is required' })}
                />
                <FormErrorMessage>{errors.transfer_date?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.transfer_mode}>
                <FormLabel>Transfer Mode</FormLabel>
                <Select {...register('transfer_mode', { required: 'Transfer mode is required' })} placeholder="--Select--">
                  <option value="neft">NEFT</option>
                  <option value="imps">IMPS</option>
                  <option value="rtgs">RTGS</option>
                </Select>
                <FormErrorMessage>{errors.transfer_mode?.message}</FormErrorMessage>
              </FormControl>
              <FormControl>
                <FormLabel>Reference Number</FormLabel>
                <Input type="text" {...register('reference_number')} />
              </FormControl>
            </VStack>
          </Box>
        );

      case 'upi_settlement':
        return (
          <Box>
            <Heading size="md" mb={4}>UPI Settlement Details</Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.upi_settlement_date}>
                <FormLabel>Settlement Date</FormLabel>
                <Input
                  type="date"
                  {...register('upi_settlement_date', { required: 'Settlement date is required' })}
                />
                <FormErrorMessage>{errors.upi_settlement_date?.message}</FormErrorMessage>
              </FormControl>
              <HStack spacing={4} width="100%">
                <FormControl>
                  <FormLabel>UPI Reference Number</FormLabel>
                  <Input type="text" {...register('upi_reference_number')} />
                </FormControl>
                <FormControl>
                  <FormLabel>Batch Number</FormLabel>
                  <Input type="text" {...register('batch_number')} />
                </FormControl>
              </HStack>
            </VStack>
          </Box>
        );

      case 'account_transfer':
        return (
          <Box>
            <Heading size="md" mb={4}>Account Transfer Details</Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.to_account_id}>
                <FormLabel>To Account</FormLabel>
                <Select {...register('to_account_id', { required: 'Destination account is required' })} placeholder="--Select--">
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.to_account_id?.message}</FormErrorMessage>
              </FormControl>
              <HStack spacing={4} width="100%">
                <FormControl isRequired isInvalid={!!errors.account_transfer_date}>
                  <FormLabel>Transfer Date</FormLabel>
                  <Input
                    type="date"
                    {...register('account_transfer_date', { required: 'Transfer date is required' })}
                  />
                  <FormErrorMessage>{errors.account_transfer_date?.message}</FormErrorMessage>
                </FormControl>
                <FormControl>
                  <FormLabel>Transfer Reference</FormLabel>
                  <Input type="text" {...register('transfer_reference')} />
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel>Purpose</FormLabel>
                <Input type="text" {...register('purpose')} />
              </FormControl>
            </VStack>
          </Box>
        );

      case 'bank_charge':
        return (
          <Box>
            <Heading size="md" mb={4}>Bank Charge Details</Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.charge_type}>
                <FormLabel>Charge Type</FormLabel>
                <Select {...register('charge_type', { required: 'Charge type is required' })} placeholder="--Select--">
                  <option value="neft_charge">NEFT Charge</option>
                  <option value="imps_charge">IMPS Charge</option>
                  <option value="rtgs_charge">RTGS Charge</option>
                  <option value="cheque_return_charge">Cheque Return Charge</option>
                  <option value="atm_charge">ATM Charge</option>
                  <option value="cash_deposit_charge">Cash Deposit Charge</option>
                  <option value="maintenance_fee">Maintenance Fee</option>
                  <option value="other">Other</option>
                </Select>
                <FormErrorMessage>{errors.charge_type?.message}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={!!errors.charge_date}>
                <FormLabel>Charge Date</FormLabel>
                <Input
                  type="date"
                  {...register('charge_date', { required: 'Charge date is required' })}
                />
                <FormErrorMessage>{errors.charge_date?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </Box>
        );

      default:
        return null;
    }
  };

  const onSubmit = async (data: EditTransactionFormData) => {
    if (!transaction) return;
    
    try {
      const payload: {
        transaction_type: string;
        amount: number;
        transaction_date: string;
        description: string;
        status: string;
        recipient_id?: number;
        to_account_id?: number;
        cash_deposit_details?: object;
        cheque_details?: object;
        bank_transfer_details?: object;
        upi_settlement_details?: object;
        account_transfer_details?: object;
        bank_charge_details?: object;
      } = {
        transaction_type: data.transaction_type,
        amount: data.amount,
        transaction_date: getTransactionDateFromFormData(data),
        description: data.description,
        status: data.status,
      };

      // Add recipient if selected
      if (data.recipient && data.recipient !== '') {
        payload.recipient_id = Number(data.recipient);
      }

      // Add to_account for account transfers
      if (data.transaction_type === 'account_transfer' && data.to_account_id) {
        payload.to_account_id = Number(data.to_account_id);
      }

      // Add type-specific details
      switch (data.transaction_type) {
        case 'cash_deposit':
          payload.cash_deposit_details = {
            deposit_date: formatDateForAPI(data.deposit_date),
          };
          break;

        case 'cheque_received':
        case 'cheque_given': {
          const chequeDetails: Record<string, string | undefined> = {
            cheque_number: data.cheque_number,
          };
          
          // Only add date fields if they have values
          if (data.cheque_issue_date) {
            chequeDetails.cheque_issue_date = formatDateForAPI(data.cheque_issue_date);
          }
          if (data.cheque_due_date) {
            chequeDetails.cheque_due_date = formatDateForAPI(data.cheque_due_date);
          }
          if (data.cheque_cleared_date) {
            chequeDetails.cheque_cleared_date = formatDateForAPI(data.cheque_cleared_date);
          }
          
          payload.cheque_details = chequeDetails;
          break;
        }

        case 'bank_transfer_in':
        case 'bank_transfer_out':
          payload.bank_transfer_details = {
            transfer_date: formatDateForAPI(data.transfer_date),
            settlement_date: formatDateForAPI(data.settlement_date),
            transfer_mode: data.transfer_mode,
            reference_number: data.reference_number,
          };
          break;

        case 'upi_settlement':
          payload.upi_settlement_details = {
            settlement_date: formatDateForAPI(data.upi_settlement_date),
            upi_reference_number: data.upi_reference_number,
            batch_number: data.batch_number,
          };
          break;

        case 'account_transfer':
          payload.account_transfer_details = {
            transfer_date: formatDateForAPI(data.account_transfer_date),
            transfer_reference: data.transfer_reference,
            purpose: data.purpose,
          };
          break;

        case 'bank_charge':
          payload.bank_charge_details = {
            charge_type: data.charge_type,
            charge_date: formatDateForAPI(data.charge_date),
          };
          break;
      }
      
      console.log('UPDATE PAYLOAD:', JSON.stringify(payload, null, 2));
      
      await api.transactions.update(Number(transaction.id), payload);
      
      toast({
        title: "Transaction updated",
        description: "Transaction has been updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update transaction";
      toast({
        title: "Update failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async () => {
    if (!transaction || !onDelete) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!transaction || !onDelete) return;
    
    setIsDeleting(true);
    try {
      onDelete(transaction.id);
      toast({
        title: "Transaction deleted",
        description: "Transaction has been deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setShowDeleteDialog(false);
      onClose();
    } catch {
      toast({
        title: "Delete failed",
        description: "Failed to delete transaction. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !transaction) return null;
  return (
    <>
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="lg" 
      closeOnOverlayClick={false}
      key={transaction.id} // Force re-render when transaction changes
    >
      <ModalOverlay />
      <ModalContent bg={bgColor} borderColor={borderColor} borderWidth={1}>
        <ModalHeader borderBottomWidth={1} borderBottomColor={borderColor}>
          <HStack spacing={3}>
            <EditIcon color="blue.500" />
            <Text fontSize="lg" fontWeight="bold">Edit Transaction</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody py={6}>
            <VStack spacing={5} align="stretch">
              {/* Transaction Info Alert */}
              {transaction.account && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontSize="sm">
                      Account: {transaction.account.account_name}
                    </Text>
                  </Box>
                </Alert>
              )}

              {/* Transaction Type (Read-only) */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Transaction Type</FormLabel>
                <Input
                  value={TRANSACTION_TYPE_LABELS[transaction.transaction_type] || transaction.transaction_type}
                  isReadOnly
                  bg={readOnlyBg}
                  cursor="not-allowed"
                />
              </FormControl>

              {/* Recipient Selection */}
              <FormControl 
                isRequired={
                  watchedTransactionType === 'cheque_received' || 
                  watchedTransactionType === 'cheque_given'
                }
                isInvalid={!!errors.recipient}
              >
                <FormLabel fontSize="sm" fontWeight="medium">
                  {(watchedTransactionType === 'cheque_received' || 
                    watchedTransactionType === 'cheque_given') 
                    ? 'Recipient' 
                    : 'Recipient (Optional)'
                  }
                </FormLabel>
                <Select 
                  {...register('recipient', {
                    required: (watchedTransactionType === 'cheque_received' || 
                              watchedTransactionType === 'cheque_given' ||
                              watchedTransactionType === 'bank_transfer_in' ||
                              watchedTransactionType === 'bank_transfer_out') 
                              ? (watchedTransactionType === 'cheque_received' || 
                                 watchedTransactionType === 'cheque_given')
                                ? 'Recipient is required for cheque transactions'
                                : 'Recipient is required for bank transfer transactions'
                              : false
                  })} 
                  placeholder="--Select--"
                >
                  {recipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.recipient?.message}</FormErrorMessage>
              </FormControl>

              {/* Amount */}
              <FormControl isInvalid={!!errors.amount}>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Amount <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <NumberInput min={0.01} precision={2}>
                  <NumberInputField
                    {...register("amount", { 
                      required: "Amount is required", 
                      valueAsNumber: true, 
                      min: { value: 0.01, message: "Amount must be greater than zero" }
                    })}
                    placeholder="Enter amount"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
              </FormControl>

              {/* Status */}
              <FormControl isInvalid={!!errors.status}>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Status <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <Select
                  placeholder="Select status"
                  {...register("status", { required: "Status is required" })}
                >
                  {getStatusOptionsForType(transactionType).map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
              </FormControl>

              {/* Description */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Description (Optional)</FormLabel>
                <Textarea
                  {...register("description")}
                  placeholder="Enter description or notes"
                  resize="none"
                  rows={3}
                />
              </FormControl>

              {/* Type-specific fields */}
              {renderTypeSpecificFields()}
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth={1} borderTopColor={borderColor}>
            <HStack spacing={3} width="full" justify="space-between">
              {onDelete && (
                <Button 
                  variant="outline"
                  colorScheme="red"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  leftIcon={<DeleteIcon />}
                >
                  Delete
                </Button>
              )}
              <HStack spacing={3} ml="auto">
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  colorScheme="blue" 
                  isLoading={isSubmitting}
                  loadingText="Updating..."
                >
                  Update Transaction
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
    
    {/* Delete Confirmation Dialog */}
    {transaction && (
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        itemName={`Transaction #${transaction.id}`}
        message={`Are you sure you want to delete this ${TRANSACTION_TYPE_LABELS[transaction.transaction_type]?.toLowerCase() || transaction.transaction_type} transaction?`}
        isLoading={isDeleting}
      />
    )}
    </>
  );
};

export default EditTransactionModal;
