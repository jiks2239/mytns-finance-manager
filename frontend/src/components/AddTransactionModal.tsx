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
  Box,
  Heading,
  useToast,
} from '@chakra-ui/react';
import {
  TransactionType,
  TransactionDirection,
  TransactionStatus,
  TransferMode,
  BankChargeType,
  TRANSACTION_TYPE_GROUPS,
  getTransactionTypeLabel,
} from '../types/transaction';
import { 
  getValidStatusOptions,
  type TransactionType as UtilTransactionType,
  type TransactionStatus as UtilTransactionStatus
} from '../utils/transactionStatusUtils';
import type { CreateTransactionForm } from '../types/transaction';

const API_BASE = 'http://localhost:3000';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string | number;
  onSuccess?: () => void;
}

interface Recipient {
  id: string;
  name: string;
  account_id?: number;
}

interface Account {
  id: number;
  account_name: string;
  bank_name: string;
}

type FormValues = {
  transaction_type: TransactionType;
  recipient: string;
  amount: number;
  description: string;
  status: TransactionStatus;
  to_account_id: string;

  // DEPOSIT (Credit Transaction) - Cash deposit to bank account
  deposit_date: string;

  // TRANSFER (Credit Transaction) - Incoming bank transfers
  transfer_date: string;
  transfer_mode: TransferMode;

  // SETTLEMENT (Credit Transaction) - UPI wallet daily settlements  
  settlement_date: string;

  // CHEQUE (Credit Transaction) - Cheque received
  cheque_number: string;
  cheque_issue_date: string;        // Date of Cheque Issue (Required)
  cheque_due_date: string;          // Date of Cheque Due (Required)
  cheque_submitted_date: string;    // Date of Cheque Submitted
  cheque_cleared_date: string;      // Date of Cheque Cleared
  cheque_bounce_charge: number;     // Cheque Bounce Charge

  // CHEQUE_GIVEN (Debit Transaction) - Cheque given
  cheque_given_issue_date: string;  // Date of Cheque Issue (Required)
  cheque_given_due_date: string;    // Date of Cheque Due (Required)  
  cheque_given_cleared_date: string;// Date of Cheque Cleared

  // BANK_CHARGE (Debit Transaction) - Bank charges and fees
  charge_type: BankChargeType;
  debit_date: string;               // Date of Debit (Required)

  // NEFT, IMPS, RTGS, UPI (Debit Transactions) - Fund transfers
  debit_transfer_date: string;      // Date of Transfer (Required)

  // Legacy fields for backward compatibility
  cash_notes: string;
  cheque_given_date: string;
  settlement_date_legacy: string;
  reference_number: string;
  transfer_notes: string;
  upi_settlement_date: string;
  upi_reference_number: string;
  batch_number: string;
  upi_notes: string;
  account_transfer_date: string;
  transfer_reference: string;
  purpose: string;
  account_transfer_notes: string;
  charge_date: string;
  charge_notes: string;
};

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onSuccess,
}) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      // No default values - let user select everything
    },
  });

  const watchedTransactionType = watch('transaction_type');

  // Determine transaction direction based on type
  const getTransactionDirection = (type: TransactionType): TransactionDirection => {
    const creditTypes = [
      TransactionType.DEPOSIT,          // NEW: Cash deposit to bank account
      TransactionType.TRANSFER,         // NEW: Incoming bank transfers
      TransactionType.SETTLEMENT,       // NEW: UPI wallet daily settlements  
      TransactionType.CHEQUE,           // NEW: Cheque received (Credit)
      // Legacy credit types
      TransactionType.CASH_DEPOSIT,
      TransactionType.CHEQUE_RECEIVED,
      TransactionType.BANK_TRANSFER_IN,
    ] as const;
    return (creditTypes as readonly string[]).includes(type) ? TransactionDirection.CREDIT : TransactionDirection.DEBIT;
  };

  // Convert TransactionType enum to string for utility function
  const getValidStatuses = (type: TransactionType): TransactionStatus[] => {
    // Map enum values to string values for our utility
    const typeMap: Partial<Record<TransactionType, UtilTransactionType>> = {
      // New transaction types
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
      // Legacy transaction types
      [TransactionType.CASH_DEPOSIT]: 'cash_deposit',
      [TransactionType.CHEQUE_RECEIVED]: 'cheque_received',
      [TransactionType.BANK_TRANSFER_IN]: 'bank_transfer_in',
      [TransactionType.BANK_TRANSFER_OUT]: 'bank_transfer_out',
      [TransactionType.ACCOUNT_TRANSFER]: 'account_transfer',
      [TransactionType.ONLINE]: 'online',
      [TransactionType.INTERNAL_TRANSFER]: 'internal_transfer',
      [TransactionType.OTHER]: 'other',
    };

    const utilType = typeMap[type];
    if (!utilType) {
      console.warn(`Unknown transaction type: ${type}`);
      return [TransactionStatus.PENDING, TransactionStatus.CANCELLED];
    }

    const utilStatuses = getValidStatusOptions(utilType);
    
    // Map utility status strings back to TransactionStatus enum
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
      // Note: 'received' is not in the frontend TransactionStatus enum
    };

    return utilStatuses.map(status => statusMap[status]).filter(Boolean) as TransactionStatus[];
  };

  const validateAmount = (value: number): string | true => {
    if (!value || value <= 0) {
      return 'Amount must be greater than 0';
    }
    
    const transactionType = watch('transaction_type');
    const transactionStatus = watch('status');
    
    // For debit transactions (money going out), check balance only if not pending
    if (
      transactionType && 
      (transactionType === TransactionType.CHEQUE_GIVEN ||
       transactionType === TransactionType.BANK_TRANSFER_OUT ||
       transactionType === TransactionType.ACCOUNT_TRANSFER ||
       transactionType === TransactionType.BANK_CHARGE)
    ) {
      // Skip balance validation for pending transactions
      if (transactionStatus === TransactionStatus.PENDING) {
        return true;
      }
      
      // Apply balance validation for non-pending transactions
      if (currentBalance !== null && value > currentBalance) {
        return `Amount cannot exceed current balance (₹${currentBalance.toFixed(2)})`;
      }
    }
    
    return true;
  };

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const response = await fetch(`${API_BASE}/recipients/for-transactions/${accountId}`);
        if (response.ok) {
          const data = await response.json();
          setRecipients(data);
        }
      } catch (error) {
        console.error('Error fetching recipients:', error);
      }
    };

    const fetchAccounts = async () => {
      try {
        const response = await fetch(`${API_BASE}/accounts`);
        if (response.ok) {
          const data = await response.json();
          // Filter out current account for transfers
          setAccounts(data.filter((acc: Account) => acc.id !== Number(accountId)));
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
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
      fetchAccounts();
      fetchCurrentBalance();
    }
  }, [isOpen, accountId]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const transactionDirection = getTransactionDirection(data.transaction_type);
      
      const payload: CreateTransactionForm = {
        transaction_type: data.transaction_type,
        transaction_direction: transactionDirection,
        amount: data.amount,
        account_id: Number(accountId),
        status: data.status,
        description: data.description,
        // transaction_date will be auto-generated on backend as current timestamp
      };

      // Add recipient if selected
      if (data.recipient && data.recipient !== '') {
        payload.recipient_id = Number(data.recipient);
      }

      // For Settlement, automatically set the account as recipient
      if (data.transaction_type === TransactionType.SETTLEMENT) {
        // Find the account-type recipient that matches the current account
        const accountRecipient = recipients.find(recipient => 
          recipient.account_id === Number(accountId)
        );
        if (accountRecipient) {
          payload.recipient_id = Number(accountRecipient.id);
        }
      }

      // Add to_account for account transfers
      if (data.transaction_type === TransactionType.ACCOUNT_TRANSFER && data.to_account_id) {
        payload.to_account_id = Number(data.to_account_id);
      }

      // Add type-specific details
      switch (data.transaction_type) {
        case TransactionType.CASH_DEPOSIT:
          payload.cash_deposit_details = {
            deposit_date: data.deposit_date,
            notes: data.cash_notes,
          };
          break;

        case TransactionType.CHEQUE_RECEIVED:
        case TransactionType.CHEQUE_GIVEN:
          payload.cheque_details = {
            cheque_number: data.cheque_number,
            cheque_issue_date: data.cheque_issue_date,
            cheque_due_date: data.cheque_due_date,
            cheque_cleared_date: data.cheque_cleared_date,
            notes: data.description,
          };
          break;

        case TransactionType.BANK_TRANSFER_IN:
        case TransactionType.BANK_TRANSFER_OUT:
          payload.bank_transfer_details = {
            transfer_date: data.transfer_date,
            settlement_date: data.settlement_date,
            transfer_mode: data.transfer_mode,
            reference_number: data.reference_number,
            notes: data.transfer_notes,
          };
          break;

        case TransactionType.SETTLEMENT:
          payload.upi_settlement_details = {
            settlement_date: data.settlement_date,
            upi_reference_number: data.upi_reference_number,
            batch_number: data.batch_number,
            notes: data.upi_notes,
          };
          break;

        case TransactionType.ACCOUNT_TRANSFER:
          payload.account_transfer_details = {
            transfer_date: data.account_transfer_date,
            transfer_reference: data.transfer_reference,
            purpose: data.purpose,
            notes: data.account_transfer_notes,
          };
          break;

        case TransactionType.BANK_CHARGE:
          payload.bank_charge_details = {
            charge_type: data.charge_type,
            debit_date: data.debit_date,
            notes: data.description,
          };
          break;
      }

      const response = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Transaction created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onSuccess?.();
        onClose();
        reset();
      } else {
        const errorData = await response.json();
        console.error('Transaction creation failed:', errorData);
        toast({
          title: "Failed to create transaction",
          description: errorData.message || 'Unknown error',
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Failed to create transaction",
        description: "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch (watchedTransactionType) {
      // ===============================
      // DEPOSIT (Credit Transaction)
      // ===============================
      case TransactionType.DEPOSIT:
      case TransactionType.CASH_DEPOSIT:
        return (
          <Box>
            <Heading size="md" mb={4}>Cash Deposit Details</Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.deposit_date}>
                <FormLabel>Date of Deposit</FormLabel>
                <Input
                  type="date"
                  {...register('deposit_date', { required: 'Date of deposit is required' })}
                />
                <FormErrorMessage>{errors.deposit_date?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </Box>
        );

      // ===============================
      // TRANSFER (Credit Transaction)
      // ===============================
      case TransactionType.TRANSFER:
      case TransactionType.BANK_TRANSFER_IN:
        return (
          <Box>
            <Heading size="md" mb={4}>Incoming Transfer Details</Heading>
            <VStack spacing={4}>
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
                    placeholder="Select transfer mode"
                  >
                    <option value={TransferMode.NEFT}>NEFT</option>
                    <option value={TransferMode.IMPS}>IMPS</option>
                    <option value={TransferMode.RTGS}>RTGS</option>
                    <option value={TransferMode.UPI}>UPI</option>
                  </Select>
                  <FormErrorMessage>{errors.transfer_mode?.message}</FormErrorMessage>
                </FormControl>
              </HStack>
            </VStack>
          </Box>
        );

      // ===============================
      // SETTLEMENT (Credit Transaction)
      // ===============================
      case TransactionType.SETTLEMENT:
        return (
          <Box>
            <Heading size="md" mb={4}>UPI Settlement Details</Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.settlement_date}>
                <FormLabel>Date of Settlement</FormLabel>
                <Input
                  type="date"
                  {...register('settlement_date', { required: 'Date of settlement is required' })}
                />
                <FormErrorMessage>{errors.settlement_date?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </Box>
        );

      // ===============================
      // CHEQUE (Credit Transaction) - Cheque Received
      // ===============================
      case TransactionType.CHEQUE:
        return (
          <Box>
            <Heading size="md" mb={4}>Cheque Received Details</Heading>
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
                <FormControl isRequired isInvalid={!!errors.cheque_issue_date}>
                  <FormLabel>Date of Cheque Issue</FormLabel>
                  <Input 
                    type="date" 
                    {...register('cheque_issue_date', { required: 'Date of cheque issue is required' })} 
                  />
                  <FormErrorMessage>{errors.cheque_issue_date?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.cheque_due_date}>
                  <FormLabel>Date of Cheque Due</FormLabel>
                  <Input
                    type="date"
                    {...register('cheque_due_date', { required: 'Date of cheque due is required' })}
                  />
                  <FormErrorMessage>{errors.cheque_due_date?.message}</FormErrorMessage>
                </FormControl>
              </HStack>
              <HStack spacing={4} width="100%">
                <FormControl isInvalid={!!errors.cheque_submitted_date}>
                  <FormLabel>Date of Cheque Submitted</FormLabel>
                  <Input type="date" {...register('cheque_submitted_date')} />
                  <FormErrorMessage>{errors.cheque_submitted_date?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.cheque_cleared_date}>
                  <FormLabel>Date of Cheque Cleared</FormLabel>
                  <Input
                    type="date"
                    {...register('cheque_cleared_date', {
                      validate: (value) => {
                        const currentStatus = watch('status');
                        if (value && currentStatus !== TransactionStatus.CLEARED) {
                          return 'Cleared date can only be entered when status is "Cleared"';
                        }
                        if (!value && currentStatus === TransactionStatus.CLEARED) {
                          return 'Cleared date is required when status is "Cleared"';
                        }
                        return true;
                      }
                    })}
                  />
                  <FormErrorMessage>{errors.cheque_cleared_date?.message}</FormErrorMessage>
                </FormControl>
              </HStack>
              <FormControl isInvalid={!!errors.cheque_bounce_charge}>
                <FormLabel>Cheque Bounce Charge</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  {...register('cheque_bounce_charge', {
                    valueAsNumber: true,
                    validate: (value) => {
                      const currentStatus = watch('status');
                      if (value && currentStatus !== TransactionStatus.BOUNCED) {
                        return 'Bounce charge can only be entered when status is "Bounced"';
                      }
                      return true;
                    }
                  })}
                />
                <FormErrorMessage>{errors.cheque_bounce_charge?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </Box>
        );

      // ===============================
      // CHEQUE_GIVEN (Debit Transaction) - Cheque Given
      // ===============================
      case TransactionType.CHEQUE_GIVEN:
        return (
          <Box>
            <Heading size="md" mb={4}>Cheque Given Details</Heading>
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
                <FormControl isRequired isInvalid={!!errors.cheque_given_issue_date}>
                  <FormLabel>Date of Cheque Issue</FormLabel>
                  <Input 
                    type="date" 
                    {...register('cheque_given_issue_date', { required: 'Date of cheque issue is required' })} 
                  />
                  <FormErrorMessage>{errors.cheque_given_issue_date?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.cheque_given_due_date}>
                  <FormLabel>Date of Cheque Due</FormLabel>
                  <Input
                    type="date"
                    {...register('cheque_given_due_date', { required: 'Date of cheque due is required' })}
                  />
                  <FormErrorMessage>{errors.cheque_given_due_date?.message}</FormErrorMessage>
                </FormControl>
              </HStack>
              <FormControl isInvalid={!!errors.cheque_given_cleared_date}>
                <FormLabel>Date of Cheque Cleared</FormLabel>
                <Input
                  type="date"
                  {...register('cheque_given_cleared_date', {
                    validate: (value) => {
                      const currentStatus = watch('status');
                      if (value && currentStatus !== TransactionStatus.CLEARED) {
                        return 'Cleared date can only be entered when status is "Cleared"';
                      }
                      if (!value && currentStatus === TransactionStatus.CLEARED) {
                        return 'Cleared date is required when status is "Cleared"';
                      }
                      return true;
                    }
                  })}
                />
                <FormErrorMessage>{errors.cheque_given_cleared_date?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </Box>
        );

      // ===============================
      // NEFT, IMPS, RTGS, UPI (Debit Transactions)
      // ===============================
      case TransactionType.NEFT:
      case TransactionType.IMPS:
      case TransactionType.RTGS:
      case TransactionType.UPI:
        return (
          <Box>
            <Heading size="md" mb={4}>
              {watchedTransactionType.toUpperCase()} Transfer Details
            </Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.debit_transfer_date}>
                <FormLabel>Date of Transfer</FormLabel>
                <Input
                  type="date"
                  {...register('debit_transfer_date', { required: 'Date of transfer is required' })}
                />
                <FormErrorMessage>{errors.debit_transfer_date?.message}</FormErrorMessage>
              </FormControl>
            </VStack>
          </Box>
        );

      // ===============================
      // Legacy cases for backward compatibility
      // ===============================

      case TransactionType.CHEQUE_RECEIVED:
        // Use same form fields as CHEQUE (credit)
        return (
          <Box>
            <Heading size="md" mb={4}>Cheque Received Details</Heading>
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
                <FormControl isRequired isInvalid={!!errors.cheque_issue_date}>
                  <FormLabel>Date of Cheque Issue</FormLabel>
                  <Input 
                    type="date" 
                    {...register('cheque_issue_date', { required: 'Date of cheque issue is required' })} 
                  />
                  <FormErrorMessage>{errors.cheque_issue_date?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.cheque_due_date}>
                  <FormLabel>Date of Cheque Due</FormLabel>
                  <Input
                    type="date"
                    {...register('cheque_due_date', { required: 'Date of cheque due is required' })}
                  />
                  <FormErrorMessage>{errors.cheque_due_date?.message}</FormErrorMessage>
                </FormControl>
              </HStack>
            </VStack>
          </Box>
        );

      case TransactionType.BANK_TRANSFER_OUT:
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
                  <option value={TransferMode.NEFT}>NEFT</option>
                  <option value={TransferMode.IMPS}>IMPS</option>
                  <option value={TransferMode.RTGS}>RTGS</option>
                </Select>
                <FormErrorMessage>{errors.transfer_mode?.message}</FormErrorMessage>
              </FormControl>
              <FormControl>
                <FormLabel>Reference Number</FormLabel>
                <Input type="text" {...register('reference_number')} />
              </FormControl>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea {...register('transfer_notes')} rows={3} />
              </FormControl>
            </VStack>
          </Box>
        );

      case TransactionType.ACCOUNT_TRANSFER:
        return (
          <Box>
            <Heading size="md" mb={4}>Account Transfer Details</Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.to_account_id}>
                <FormLabel>To Account</FormLabel>
                <Select {...register('to_account_id', { required: 'Destination account is required' })} placeholder="--Select--">
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name} - {account.bank_name}
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
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea {...register('account_transfer_notes')} rows={3} />
              </FormControl>
            </VStack>
          </Box>
        );

      case TransactionType.BANK_CHARGE:
        return (
          <Box>
            <Heading size="md" mb={4}>Bank Charge Details</Heading>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.charge_type}>
                <FormLabel>Bank Charge Type</FormLabel>
                <Select {...register('charge_type', { required: 'Charge type is required' })} placeholder="--Select--">
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
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea {...register('description')} rows={3} />
              </FormControl>
            </VStack>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>Add New Transaction</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={6}>
              <HStack spacing={4} width="100%">
                <FormControl isRequired isInvalid={!!errors.transaction_type}>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select {...register('transaction_type', { required: 'Transaction type is required' })} placeholder="--Select--">
                    {TRANSACTION_TYPE_GROUPS.map((group) => (
                      <optgroup key={group.direction} label={group.label}>
                        {group.types.map((type) => (
                          <option key={type} value={type}>
                            {getTransactionTypeLabel(type)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.transaction_type?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.amount}>
                  <FormLabel>Amount</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    {...register('amount', { 
                      required: 'Amount is required',
                      valueAsNumber: true,
                      min: { value: 0.01, message: 'Amount must be greater than 0' },
                      validate: (value: number) => {
                        return validateAmount(value);
                      }
                    })}
                  />
                  <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select {...register('status')} placeholder="--Select--">
                  {watchedTransactionType ? getValidStatuses(watchedTransactionType).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  )) : (
                    <option value={TransactionStatus.PENDING}>
                      {TransactionStatus.PENDING.charAt(0).toUpperCase() + TransactionStatus.PENDING.slice(1)}
                    </option>
                  )}
                </Select>
              </FormControl>

              {/* Recipient selection for non-account-transfer and non-UPI-settlement transactions */}
              {watchedTransactionType !== TransactionType.ACCOUNT_TRANSFER && 
               watchedTransactionType !== TransactionType.SETTLEMENT && (
                <FormControl 
                  isRequired={
                    watchedTransactionType === TransactionType.CHEQUE_RECEIVED || 
                    watchedTransactionType === TransactionType.CHEQUE_GIVEN
                  }
                  isInvalid={!!errors.recipient}
                >
                  <FormLabel>
                    {(watchedTransactionType === TransactionType.CHEQUE_RECEIVED || 
                      watchedTransactionType === TransactionType.CHEQUE_GIVEN) 
                      ? 'Recipient' 
                      : 'Recipient (Optional)'
                    }
                  </FormLabel>
                  <Select 
                    {...register('recipient', {
                      required: (watchedTransactionType === TransactionType.CHEQUE_RECEIVED || 
                                watchedTransactionType === TransactionType.CHEQUE_GIVEN ||
                                watchedTransactionType === TransactionType.BANK_TRANSFER_IN ||
                                watchedTransactionType === TransactionType.BANK_TRANSFER_OUT) 
                                ? (watchedTransactionType === TransactionType.CHEQUE_RECEIVED || 
                                   watchedTransactionType === TransactionType.CHEQUE_GIVEN)
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
              )}

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea {...register('description')} rows={3} />
              </FormControl>

              {/* Type-specific fields */}
              {renderTypeSpecificFields()}
            </VStack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit(onSubmit)} 
            isLoading={isLoading}
            loadingText="Creating..."
          >
            Create Transaction
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddTransactionModal;
