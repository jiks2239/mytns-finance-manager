import React from 'react';
import { Box, Flex, Text, IconButton, useColorModeValue, Tooltip } from '@chakra-ui/react';
import { FaUsers, FaPlusCircle, FaList, FaInfoCircle, FaEdit, FaTrash } from 'react-icons/fa';

interface AccountDashboardCardProps {
  id: number;
  name: string;
  accountType: string;
  balance: number | null;
  onViewRecipients: () => void;
  onAddTransaction: () => void;
  onViewTransactions: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AccountDashboardCard: React.FC<AccountDashboardCardProps> = ({
  name, accountType, balance,
  onViewRecipients, onAddTransaction, onViewTransactions, onViewDetails, onEdit, onDelete
}) => {

  const displayBalance = balance;
  
  return (
    <Box
      bg={useColorModeValue('#f8fafc', 'gray.800')}
      borderRadius="1.2rem"
      boxShadow="md"
      p={{ base: 4, md: 6 }}
      minW="280px"
      minH="120px"
      display="flex"
      flexDirection="column"
      alignItems="stretch"
      justifyContent="center"
      fontSize="1.1rem"
      position="relative"
      mb={2}
      overflow="hidden"
    >
      <Flex align="flex-start" justify="space-between" mb={4} gap={3}>
        <Box flex={1} minW={0}>
          <Text fontWeight="bold" color={useColorModeValue('#2d3a5a', 'blue.200')} fontSize="1.2rem" mb={1} wordBreak="break-word">
            {name}
          </Text>
          <Text color={useColorModeValue('#64748b', 'gray.400')} fontSize="1rem" fontWeight={500}>
            {accountType.replace(/^(.)/, c => c.toUpperCase())}
          </Text>
        </Box>
        <Box
          fontSize="1.1rem"
          fontWeight={600}
          color="#1e7d34"
          bg="#e6f4ea"
          borderRadius="0.7rem"
          px={4}
          py={2}
          minW="120px"
          maxW="140px"
          textAlign="right"
          flexShrink={0}
        >
          {displayBalance !== null && displayBalance !== undefined
            ? `₹${displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            : 'Loading...'}
        </Box>
      </Flex>
      <Flex gap={3} flexWrap="nowrap" justify="center" mt={2} overflowX="auto">
        <Tooltip label="View Recipients"><span><IconButton aria-label="View Recipients" icon={<FaUsers />} onClick={onViewRecipients} size="lg" colorScheme="blue" variant="ghost" /></span></Tooltip>
        <Tooltip label="Add Transaction"><span><IconButton aria-label="Add Transaction" icon={<FaPlusCircle />} onClick={onAddTransaction} size="lg" colorScheme="green" variant="ghost" /></span></Tooltip>
        <Tooltip label="View Transactions"><span><IconButton aria-label="View Transactions" icon={<FaList />} onClick={onViewTransactions} size="lg" colorScheme="purple" variant="ghost" /></span></Tooltip>
        <Tooltip label="View Details"><span><IconButton aria-label="View Details" icon={<FaInfoCircle />} onClick={onViewDetails} size="lg" colorScheme="gray" variant="ghost" /></span></Tooltip>
        <Tooltip label="Edit Account"><span><IconButton aria-label="Edit Account" icon={<FaEdit />} onClick={onEdit} size="lg" colorScheme="yellow" variant="ghost" /></span></Tooltip>
        <Tooltip label="Delete Account"><span><IconButton aria-label="Delete Account" icon={<FaTrash />} onClick={onDelete} size="lg" colorScheme="red" variant="ghost" /></span></Tooltip>
      </Flex>
    </Box>
  );
};

export default AccountDashboardCard;
