import React from 'react';
import {
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent,
  AlertDialogOverlay, Button, Text, VStack, HStack, Icon, useColorModeValue
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Transaction",
  message,
  itemName,
  isLoading = false,
}) => {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const warningColor = useColorModeValue('red.500', 'red.300');

  const defaultMessage = itemName 
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : "Are you sure you want to delete this transaction? This action cannot be undone.";

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <HStack spacing={3}>
              <Icon as={WarningIcon} color={warningColor} />
              <Text>{title}</Text>
            </HStack>
          </AlertDialogHeader>

          <AlertDialogBody>
            <VStack spacing={3} align="start">
              <Text>{message || defaultMessage}</Text>
              <Text fontSize="sm" color="gray.500">
                This action is permanent and cannot be reversed.
              </Text>
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button 
              ref={cancelRef} 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={onConfirm} 
              ml={3}
              isLoading={isLoading}
              loadingText="Deleting..."
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
