import React, { useEffect, useState } from "react";
import { Box, Flex, Heading, Button, Input, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue, Spinner, Text, Alert, AlertIcon } from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import AddRecipientModal from "../components/AddRecipientModal";
import EditRecipientModal from "../components/EditRecipientModal";

const API_BASE = "http://localhost:3000";

type Recipient = {
  id: string | number;
  name: string;
  recipient_type: string;
};

const RecipientsList: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editRecipient, setEditRecipient] = useState<Recipient | null>(null);

  const fetchRecipients = async () => {
    setLoading(true);
    setError("");
    try {
      if (!id) throw new Error("No account id provided");
      const res = await fetch(`${API_BASE}/recipients?account_id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch recipients");
      const data = await res.json();
      setRecipients(data);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Failed to fetch recipients"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
    // eslint-disable-next-line
  }, [id]);

  const filteredRecipients = recipients.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.recipient_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (recipientId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this recipient? This cannot be undone.")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/recipients/${recipientId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Cannot delete recipient. It may have transactions.");
        return;
      }
      await fetchRecipients();
    } catch {
      setError("Failed to delete recipient.");
    }
  };

  // Chakra UI color mode values
  const bgGradient = useColorModeValue('blue.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.900');
  const cardBorder = useColorModeValue('blue.100', 'gray.800');
  const headingColor = useColorModeValue('blue.800', 'blue.200');
  const inputBorder = useColorModeValue('gray.300', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.800');
  const inputColor = useColorModeValue('gray.800', 'gray.100');
  const inputPlaceholder = useColorModeValue('gray.400', 'gray.500');
  const tableBg = useColorModeValue('white', 'gray.900');
  const tableHeadBg = useColorModeValue('blue.50', 'gray.800');
  const thColor = useColorModeValue('blue.700', 'blue.200');
  const tdNameColor = useColorModeValue('gray.800', 'gray.100');
  const tdTypeColor = useColorModeValue('blue.600', 'blue.300');
  const noDataColor = useColorModeValue('gray.400', 'gray.500');
  const tableBorder = useColorModeValue('gray.200', 'gray.700');
  const rowHoverBg = useColorModeValue('blue.50', 'gray.800');

  return (
    <Box minH="100vh" py={12} px={2} bg={bgGradient} transition="background 0.3s">
      <Box maxW="3xl" mx="auto" borderRadius="2xl" boxShadow="2xl" p={0} borderWidth={1} borderColor={cardBorder} overflow="hidden">
        {/* Header */}
        <Box bgGradient="linear(to-r, blue.600, blue.400)" px={8} py={7}>
          <Flex align="center" justify="space-between">
            <Button colorScheme="whiteAlpha" variant="ghost" onClick={() => navigate('/')} fontWeight="bold" fontSize="lg" leftIcon={<span style={{fontSize:'1.2em'}}>&larr;</span>}>
              Back
            </Button>
            <Heading as="h2" size="lg" color="white" fontWeight="extrabold" letterSpacing="tight" textAlign="center" flex={1}>
              Recipients
            </Heading>
            <Button colorScheme="whiteAlpha" variant="ghost" opacity={0} pointerEvents="none">Back</Button>
          </Flex>
        </Box>
        {/* Add/Search Bar */}
        <Flex align="center" justify="space-between" px={8} pt={8} pb={4} bg={cardBg}>
          <Input
            type="text"
            placeholder="Search recipients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="lg"
            borderRadius="xl"
            borderColor={inputBorder}
            bg={inputBg}
            color={inputColor}
            _placeholder={{ color: inputPlaceholder }}
            boxShadow="sm"
            maxW="320px"
          />
          <Button colorScheme="blue" px={6} py={2} borderRadius="lg" boxShadow="lg" fontWeight="bold" leftIcon={<span style={{fontSize:'1.2em'}}>+</span>} onClick={() => setAddModalOpen(true)}>
            Add Recipient
          </Button>
        </Flex>
        {/* Table or Loading/Error/Empty State */}
        <Box px={8} pb={8} bg={cardBg} borderBottomRadius="2xl">
          {loading ? (
            <Flex align="center" justify="center" py={10}><Spinner color="blue.500" size="lg" /><Text ml={4} color="blue.600" fontWeight="semibold">Loading...</Text></Flex>
          ) : error ? (
            <Alert status="error" mb={4} borderRadius="md" justifyContent="center"><AlertIcon />{error}</Alert>
          ) : filteredRecipients.length === 0 ? (
            <Text color={noDataColor} textAlign="center" fontSize="lg" py={10}>No recipients found.</Text>
          ) : (
            <Box overflowX="auto" borderRadius="xl" borderWidth={1} borderColor={tableBorder} boxShadow="sm">
              <Table variant="simple" bg={tableBg} borderRadius="xl" overflow="hidden">
                <Thead bg={tableHeadBg}>
                  <Tr>
                    <Th color={thColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">Name</Th>
                    <Th color={thColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">Type</Th>
                    <Th color={thColor} fontWeight="bold" textTransform="uppercase" letterSpacing="wider">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRecipients.map(r => (
                    <Tr key={r.id} _hover={{ bg: rowHoverBg }} transition="background 0.2s">
                      <Td color={tdNameColor} fontSize="md" fontWeight="medium">{r.name}</Td>
                      <Td color={tdTypeColor} fontWeight="semibold" textTransform="capitalize">{r.recipient_type}</Td>
                      <Td>
                        <Button size="sm" colorScheme="blue" variant="outline" mr={3} onClick={() => setEditRecipient(r)}>
                          Edit
                        </Button>
                        <Button size="sm" colorScheme="red" variant="outline" onClick={() => handleDelete(r.id)}>
                          Delete
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
        <AddRecipientModal
          isOpen={addModalOpen}
          name=""
        accountId={Number(id)}
          onClose={() => setAddModalOpen(false)}
          onRecipientAdded={fetchRecipients}
        />
        {editRecipient && (
          <EditRecipientModal
            isOpen={!!editRecipient}
            recipient={editRecipient}
          accountId={Number(id)}
            onClose={() => setEditRecipient(null)}
            onSuccess={() => {
              setEditRecipient(null);
              fetchRecipients();
            }}
            existingRecipients={recipients}
          />
        )}
      </Box>
    </Box>
  );
};

export default RecipientsList;

