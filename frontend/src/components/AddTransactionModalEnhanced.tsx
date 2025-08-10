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
  Text,
  Alert,
  AlertIcon,
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

interface AddTransactionModalEnhancedProps {
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
  to_account_id: string;

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
  cheque_given_issue_date: string;
  cheque_given_due_date: string;
  cheque_given_cleared_date: string;
  charge_type: BankChargeType;
  debit_date: string;
  debit_transfer_date: string;
  reference_number: string;
  transfer_notes: string;
  cash_notes: string;
};

const AddTransactionModalEnhanced: React.FC<AddTransactionModalEnhancedProps> = ({
  isOpen,
  onClose,
  accountId,
  onSuccess,
}) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Direction & Amount, 2: Type & Details
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      // Initialize with default values
    },
  });

  const watchedDirection = watch('transaction_direction');
  const watchedAmount = watch('amount');
  const watchedTransactionType = watch('transaction_type');

  // Get available transaction types based on direction and amount
  const getAvailableTransactionTypes = (direction: TransactionDirection, amount: number) => {
    if (!direction || !amount) return [];

    if (direction === TransactionDirection.CREDIT) {
      return [
        { type: TransactionType.DEPOSIT, label: 'Cash Deposit', disabled: false },
        { type: TransactionType.TRANSFER, label: 'Bank Transfer (Incoming)', disabled: false },
        { type: TransactionType.SETTLEMENT, label: 'UPI Settlement', disabled: false },
        { type: TransactionType.CHEQUE, label: 'Cheque Received', disabled: false },
      ];
    } else {
      // Debit transactions with amount-based restrictions
      const types = [
        { 
          type: TransactionType.CHEQUE_GIVEN, 
          label: 'Cheque Payment', 
          disabled: false 
        },
        { 
          type: TransactionType.BANK_CHARGE, 
          label: 'Bank Charges', 
          disabled: false 
        },
        { 
          type: TransactionType.NEFT, 
          label: 'NEFT Transfer', 
          disabled: amount > 200000 // Disabled if amount > 2 lakhs
        },
        { 
          type: TransactionType.IMPS, 
          label: 'IMPS Transfer', 
          disabled: amount > 200000 // Disabled if amount > 2 lakhs
        },
        { 
          type: TransactionType.RTGS, 
          label: 'RTGS Transfer', 
          disabled: amount < 200000 // Disabled if amount < 2 lakhs
        },
        { 
          type: TransactionType.UPI, 
          label: 'UPI Transfer', 
          disabled: amount > 100000 // Disabled if amount > 1 lakh
        },
      ];
      return types;
    }
  };

  // Get recipients for transfer types (excluding parent account for debits)
  const getAvailableRecipients = (transactionType: TransactionType) => {
    if (!transactionType) return recipients;

    // Define debit transfer types
    const debitTransferTypes: TransactionType[] = [
      TransactionType.NEFT, 
      TransactionType.IMPS, 
      TransactionType.RTGS, 
      TransactionType.UPI
    ];

    // For debit transfers, exclude recipients linked to the parent account
    if (watchedDirection === TransactionDirection.DEBIT && 
        debitTransferTypes.includes(transactionType)) {
      return recipients.filter(recipient => recipient.account_id !== Number(accountId));
    }

    return recipients;
  };

  // Convert TransactionType enum to string for utility function
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
      const transactionStatus = watch('status');
      if (transactionStatus !== TransactionStatus.PENDING) {
        if (currentBalance !== null && value > currentBalance) {
          return `Amount cannot exceed current balance (₹${currentBalance.toFixed(2)})`;
        }
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
  }, [isOpen, accountId]);

  const onNext = () => {
    if (watchedDirection && watchedAmount > 0) {
      setStep(2);
    }
  };

  const onBack = () => {
    setStep(1);
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const payload: CreateTransactionForm = {
        transaction_type: data.transaction_type,
        transaction_direction: data.transaction_direction,
        amount: data.amount,
        account_id: Number(accountId),
        status: data.status,
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
            notes: data.transfer_notes,
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
          payload.online_transfer_details = {
            transfer_date: data.debit_transfer_date,
          };
          break;
      }

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
        reset();
        setStep(1);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const errorData = await response.json();
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

  const renderAmountRestrictionInfo = () => {
    if (!watchedAmount || !watchedDirection || watchedDirection === TransactionDirection.CREDIT) {
      return null;
    }

    const restrictions = [];
    if (watchedAmount > 200000) {
      restrictions.push("NEFT and IMPS are disabled (amount > ₹2,00,000)");
      restrictions.push("Only RTGS is available for transfers");
    } else if (watchedAmount > 100000) {
      restrictions.push("UPI is disabled (amount > ₹1,00,000)");
      restrictions.push("NEFT, IMPS, and RTGS are available");
    } else if (watchedAmount >= 200000) {
      restrictions.push("RTGS is disabled (amount < ₹2,00,000)");
    }

    if (restrictions.length === 0) return null;

    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Transfer Restrictions:</Text>
          {restrictions.map((restriction, index) => (
            <Text key={index} fontSize="sm">{restriction}</Text>
          ))}
        </Box>
      </Alert>
    );
  };

  const renderTypeSpecificFields = () => {
    if (!watchedTransactionType) return null;

    switch (watchedTransactionType) {
      case TransactionType.DEPOSIT:
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
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea {...register('cash_notes')} rows={2} />
              </FormControl>
            </VStack>
          </Box>
        );

      case TransactionType.TRANSFER:
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
              <FormControl>
                <FormLabel>Reference Number</FormLabel>
                <Input {...register('reference_number')} />
              </FormControl>
            </VStack>
          </Box>
        );

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

      case TransactionType.CHEQUE:
      case TransactionType.CHEQUE_GIVEN:
        return (
          <Box>
            <Heading size="md" mb={4}>
              {watchedTransactionType === TransactionType.CHEQUE ? 'Cheque Received' : 'Cheque Given'} Details
            </Heading>
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

      case TransactionType.BANK_CHARGE:
        return (
          <Box>
            <Heading size="md" mb={4}>Bank Charge Details</Heading>
            <VStack spacing={4}>
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
          </Box>
        );

      case TransactionType.NEFT:
      case TransactionType.IMPS:
      case TransactionType.RTGS:
      case TransactionType.UPI:
        return (
          <Box>
            <Heading size="md" mb={4}>
              {getTransactionTypeLabel(watchedTransactionType)} Transfer Details
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

      default:
        return null;
    }
  };

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>
          Add New Transaction - Step {step} of 2
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {step === 1 && (
            <VStack spacing={6}>
              <Text fontSize="lg" fontWeight="bold" textAlign="center" color="blue.600">
                Choose Transaction Direction and Enter Amount
              </Text>
              
              <FormControl isRequired isInvalid={!!errors.transaction_direction}>
                <FormLabel>Transaction Direction</FormLabel>
                <Select 
                  {...register('transaction_direction', { required: 'Transaction direction is required' })} 
                  placeholder="Select direction"
                  size="lg"
                >
                  <option value={TransactionDirection.CREDIT}>Credit (Money Coming In)</option>
                  <option value={TransactionDirection.DEBIT}>Debit (Money Going Out)</option>
                </Select>
                <FormErrorMessage>{errors.transaction_direction?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.amount}>
                <FormLabel>Amount</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  size="lg"
                  {...register('amount', { 
                    required: 'Amount is required',
                    valueAsNumber: true,
                    min: { value: 0.01, message: 'Amount must be greater than 0' },
                    validate: validateAmount
                  })}
                />
                <FormErrorMessage>{errors.amount?.message}</FormErrorMessage>
              </FormControl>

              {watchedDirection === TransactionDirection.DEBIT && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text>Current Balance: ₹{currentBalance.toFixed(2)}</Text>
                </Alert>
              )}

              {renderAmountRestrictionInfo()}
            </VStack>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={6}>
                <Box p={4} bg="gray.50" borderRadius="md" width="100%">
                  <HStack justify="space-between">
                    <Text>
                      <strong>Direction:</strong> {watchedDirection === TransactionDirection.CREDIT ? 'Credit (Money In)' : 'Debit (Money Out)'}
                    </Text>
                    <Text>
                      <strong>Amount:</strong> ₹{watchedAmount?.toFixed(2) || '0.00'}
                    </Text>
                  </HStack>
                </Box>

                <FormControl isRequired isInvalid={!!errors.transaction_type}>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select 
                    {...register('transaction_type', { required: 'Transaction type is required' })} 
                    placeholder="Select transaction type"
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

                {watchedTransactionType && (
                  <>
                    <FormControl>
                      <FormLabel>Status</FormLabel>
                      <Select {...register('status')} placeholder="Select status">
                        {getValidStatuses(watchedTransactionType).map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Recipient selection for applicable transaction types */}
                    {watchedTransactionType !== TransactionType.SETTLEMENT && (
                      <FormControl 
                        isRequired={(() => {
                          const requiresRecipient = [
                            TransactionType.CHEQUE, 
                            TransactionType.CHEQUE_GIVEN, 
                            TransactionType.NEFT, 
                            TransactionType.IMPS, 
                            TransactionType.RTGS, 
                            TransactionType.UPI
                          ] as TransactionType[];
                          return requiresRecipient.includes(watchedTransactionType as TransactionType);
                        })()}
                        isInvalid={!!errors.recipient}
                      >
                        <FormLabel>
                          {(() => {
                            const requiresRecipient = [
                              TransactionType.CHEQUE, 
                              TransactionType.CHEQUE_GIVEN,
                              TransactionType.NEFT, 
                              TransactionType.IMPS, 
                              TransactionType.RTGS, 
                              TransactionType.UPI
                            ] as TransactionType[];
                            return requiresRecipient.includes(watchedTransactionType as TransactionType)
                              ? 'Recipient'
                              : 'Recipient (Optional)';
                          })()}
                        </FormLabel>
                        <Select 
                          {...register('recipient', {
                            required: (() => {
                              const requiresRecipient = [
                                TransactionType.CHEQUE, 
                                TransactionType.CHEQUE_GIVEN,
                                TransactionType.NEFT, 
                                TransactionType.IMPS, 
                                TransactionType.RTGS, 
                                TransactionType.UPI
                              ] as TransactionType[];
                              return requiresRecipient.includes(watchedTransactionType as TransactionType)
                                ? 'Recipient is required for this transaction type'
                                : false;
                            })()
                          })} 
                          placeholder="Select recipient"
                        >
                          {getAvailableRecipients(watchedTransactionType).map((recipient) => (
                            <option key={recipient.id} value={recipient.id}>
                              {recipient.name} ({recipient.recipient_type})
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
                  </>
                )}
              </VStack>
            </form>
          )}
        </ModalBody>

        <ModalFooter>
          {step === 1 && (
            <>
              <Button variant="ghost" mr={3} onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={onNext}
                isDisabled={!watchedDirection || !watchedAmount || watchedAmount <= 0}
              >
                Next
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="ghost" mr={3} onClick={onBack}>
                Back
              </Button>
              <Button variant="ghost" mr={3} onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleSubmit(onSubmit)} 
                isLoading={isLoading}
                loadingText="Creating..."
                isDisabled={!watchedTransactionType}
              >
                Create Transaction
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddTransactionModalEnhanced;
