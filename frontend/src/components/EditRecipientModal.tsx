import React, { useState, useEffect } from "react";
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
  Stack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

const API_BASE = "http://localhost:3000";

interface EditRecipientModalProps {
  isOpen: boolean;
  recipient: { id: string | number; name: string; recipient_type: string };
  accountId: string | number;
  onClose: () => void;
  onSuccess?: () => void;
  existingRecipients: { id: string | number; name: string }[];
}

const EditRecipientModal: React.FC<EditRecipientModalProps> = ({
  isOpen,
  recipient,
  accountId,
  onClose,
  onSuccess,
  existingRecipients,
}) => {
  const [name, setName] = useState(recipient?.name || "");
  const [recipient_type, setRecipientType] = useState(recipient?.recipient_type || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && recipient) {
      setName(recipient.name);
      setRecipientType(recipient.recipient_type);
      setError("");
    }
  }, [isOpen, recipient]);

  if (!isOpen || !recipient) return null;

  // Prevent editing ACCOUNT-type recipients as they are automatically managed
  if (recipient.recipient_type === 'account') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Recipient</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="info">
              <AlertIcon />
              Account-type recipients are automatically managed by the system and cannot be edited manually.
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Recipient name is required.");
      return;
    }
    if (!recipient_type) {
      setError("Recipient type is required.");
      return;
    }
    // Duplicate name validation (case-insensitive, per account, excluding self)
    if (
      existingRecipients.some(
        (r) =>
          r.id !== recipient.id &&
          r.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      setError("A recipient with this name already exists.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/recipients/${recipient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          recipient_type,
          account_id: accountId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update recipient");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message || "Failed to update recipient");
      } else {
        setError("Failed to update recipient");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Recipient</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired isInvalid={!!error && error.includes('name')}>
                <FormLabel htmlFor="recipient-name">Recipient Name</FormLabel>
                <Input
                  id="recipient-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
                <FormErrorMessage>Recipient name is required</FormErrorMessage>
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="recipient-type">Recipient Type</FormLabel>
                <Select
                  id="recipient-type"
                  value={recipient_type}
                  onChange={e => setRecipientType(e.target.value)}
                >
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="utility">Utility</option>
                  <option value="employee">Employee</option>
                  <option value="bank">Bank</option>
                  <option value="owner">Owner</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button
              type="submit"
              colorScheme="blue"
              mr={3}
              isLoading={loading}
              loadingText="Saving..."
            >
              Update Recipient
            </Button>
            <Button variant="ghost" onClick={onClose} isDisabled={loading}>
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EditRecipientModal;
