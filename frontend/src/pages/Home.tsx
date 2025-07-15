import React, { useState, useEffect } from 'react';
import { useNavigate} from 'react-router-dom';
import { Box, Button, Heading, Text, SimpleGrid, IconButton } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import AddAccountModal from '../components/AddAccountModal';
import AccountDashboardCard from '../components/AccountDashboardCard';

interface Account {
  id: number;
  account_name: string;
  account_type: string;
  // ...other fields as needed
}
const Home: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<number, number | null>>({});
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    const res = await fetch('http://localhost:3000/accounts');
    if (res.ok) {
      const data = await res.json();
      setAccounts(data);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length === 0) return;
    const fetchBalances = async () => {
      const newBalances: Record<number, number | null> = {};
      await Promise.all(accounts.map(async (acc) => {
        try {
          const res = await fetch(`http://localhost:3000/accounts/${acc.id}/balance`);
          const data = await res.json();
          newBalances[acc.id] = data.balance;
        } catch {
          newBalances[acc.id] = null;
        }
      }));
      setBalances(newBalances);
    };
    fetchBalances();
  }, [accounts]);

  // Chakra v3+ (Panda) does not export useColorModeValue. Use hardcoded values or implement your own color mode logic if needed.
  const bgGradient = 'linear(to-br, #bfdbfe, #fff, #93c5fd)';
  const cardBg = '#fff';
  const cardBorder = '#dbeafe';
  const headingColor = '#1e40af';
  const textColor = '#475569';

  return (
    <Box minH="100vh" py={12} px={2} bgGradient={bgGradient} transition="background 0.3s">
      <Box maxW="4xl" mx="auto" bg={cardBg} borderRadius="3xl" boxShadow="2xl" p={10} borderWidth={1} borderColor={cardBorder}>
        <Heading as="h1" size="2xl" color={headingColor} mb={1} textAlign="center" fontWeight="extrabold" letterSpacing="tight" whiteSpace="nowrap">
          Welcome to MyTNS - Finance Manager
        </Heading>
        <Text fontSize="xl" color={textColor} mb={10} textAlign="center" fontWeight="bold">
          Shri Lakshmi Bakery & Sweet Mart
        </Text>
        {accounts.length === 0 ? (
          <Button w="full" py={6} borderRadius="xl" colorScheme="blue" fontWeight="bold" fontSize="xl" boxShadow="lg" mb={2} onClick={() => setAddModalOpen(true)}>
            + Add Account
          </Button>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
            {accounts.map(acc => (
              <AccountDashboardCard
                key={acc.id}
                id={acc.id}
                name={acc.account_name}
                type={acc.account_type}
                balance={balances[acc.id]}
                onViewRecipients={() => navigate(`/accounts/${acc.id}/recipients`)}
                onAddTransaction={() => alert('Add Transaction for ' + acc.account_name)}
                onViewTransactions={() => alert('View Transactions for ' + acc.account_name)}
                onViewDetails={() => navigate(`/accounts/${acc.id}`)}
                onEdit={() => alert('Edit Account ' + acc.account_name)}
                onDelete={() => alert('Delete Account ' + acc.account_name)}
              />
            ))}
          </SimpleGrid>
        )}
        <IconButton
          icon={<AddIcon boxSize="2rem" />}
          colorScheme="blue"
          borderRadius="full"
          size="lg"
          position="fixed"
          bottom={8}
          right={8}
          boxShadow="2xl"
          aria-label="Add Account"
          onClick={() => setAddModalOpen(true)}
          zIndex={50}
        />
      </Box>
      <AddAccountModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAccountAdded={fetchAccounts} />
      {/* Route for recipients list is defined in App.tsx, not here */}
    </Box>
  );
};

export default Home;
