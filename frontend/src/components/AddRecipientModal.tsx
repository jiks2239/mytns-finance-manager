import React, { useState } from "react";
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
  Stack
} from '@chakra-ui/react';

const API_BASE = "http://localhost:3000";

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  accountId: number;
  onRecipientAdded: () => void;
}

const AddRecipientModal: React.FC<AddRecipientModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onRecipientAdded,
}) => {
  const [recipientName, setRecipientName] = useState("");
  const [recipientType, setRecipientType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setRecipientName("");
      setRecipientType("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setError("Recipient name is required.");
      return;
    }
    if (!recipientType) {
      setError("Recipient type is required.");
      return;
    }
    if (!accountId || isNaN(Number(accountId)) || Number(accountId) <= 0) {
      setError("Invalid account. Please refresh and try again from the correct account page.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recipientName.trim(),
          recipient_type: recipientType,
          account_id: Number(accountId),
        }),
      });
      if (!res.ok) throw new Error("Failed to add recipient");
      onRecipientAdded();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message || "Failed to add recipient");
      } else {
        setError("Failed to add recipient");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Recipient</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired isInvalid={!!error && error.includes('name')}>
                <FormLabel htmlFor="recipient-name">Recipient Name</FormLabel>
                <Input
                  id="recipient-name"
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  autoFocus
                  disabled={loading}
                />
                {error && error.includes('name') && <FormErrorMessage>{error}</FormErrorMessage>}
              </FormControl>
              <FormControl isRequired isInvalid={!!error && error.includes('type')}>
                <FormLabel htmlFor="recipient-type">Recipient Type</FormLabel>
                <Select
                  id="recipient-type"
                  value={recipientType}
                  onChange={e => setRecipientType(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Select --</option>
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="utility">Utility</option>
                  <option value="employee">Employee</option>
                  <option value="bank">Bank</option>
                  <option value="other">Other</option>
                </Select>
                {error && error.includes('type') && <FormErrorMessage>{error}</FormErrorMessage>}
              </FormControl>
              {error && !error.includes('name') && !error.includes('type') && (
                <FormErrorMessage>{error}</FormErrorMessage>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit" isLoading={loading} loadingText="Saving...">
              Add Recipient
            </Button>
            <Button onClick={onClose} disabled={loading} variant="ghost">Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default AddRecipientModal;
