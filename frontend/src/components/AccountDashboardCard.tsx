import React from 'react';
import { Box, Flex, Text, IconButton, useColorModeValue, Tooltip, Stat, StatLabel, StatNumber, Badge } from '@chakra-ui/react';
import { FaUsers, FaPlusCircle, FaList, FaInfoCircle, FaEdit, FaTrash } from 'react-icons/fa';

interface AccountDashboardCardProps {
  id: number;
  name: string;
  accountType: string;
  balance: number | null;
  pendingTransactionsCount: number;
  onViewRecipients: () => void;
  onAddTransaction: () => void;
  onViewTransactions: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AccountDashboardCard: React.FC<AccountDashboardCardProps> = ({
  name, accountType, balance, pendingTransactionsCount,
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
      overflow="visible"
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
        
        {/* Enhanced Balance Display */}
        <Stat maxW="160px" textAlign="right" flexShrink={0}>
          <StatLabel fontSize="xs" color={useColorModeValue('gray.600', 'gray.400')} mb={1}>
            Balance
          </StatLabel>
          <Box position="relative">
            <StatNumber
              fontSize="lg"
              fontWeight="black"
              whiteSpace="nowrap"
              bg={useColorModeValue('blue.50', 'blue.900')}
              color={useColorModeValue('blue.700', 'blue.200')}
              px={3}
              py={2}
              borderRadius="lg"
              border="2px solid"
              borderColor={useColorModeValue('blue.200', 'blue.600')}
              boxShadow="md"
              textShadow="0 1px 2px rgba(0,0,0,0.1)"
            >
              {displayBalance !== null && displayBalance !== undefined
                ? `₹${displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : 'Loading...'}
            </StatNumber>
            
            {/* Balance Status Badge */}
            {displayBalance !== null && displayBalance !== undefined && (
              <Badge
                position="absolute"
                top="-8px"
                right="-8px"
                colorScheme={
                  displayBalance < 0 ? 'red' : 
                  displayBalance < 10000 ? 'orange' : 
                  displayBalance >= 100000 ? 'green' : 'blue'
                }
                borderRadius="full"
                fontSize="xs"
                px={2}
                py={1}
                boxShadow="sm"
              >
                {displayBalance < 0 ? '⚠️' : 
                 displayBalance < 10000 ? '⚡' : 
                 displayBalance >= 100000 ? '✨' : '💰'}
              </Badge>
            )}
          </Box>
        </Stat>
      </Flex>
      <Flex gap={3} flexWrap="nowrap" justify="center" mt={2} overflowX="auto" pb={1} pt={2} px={2}>
        <Tooltip label="View Recipients"><span><IconButton aria-label="View Recipients" icon={<FaUsers />} onClick={onViewRecipients} size="lg" colorScheme="blue" variant="ghost" /></span></Tooltip>
        <Tooltip label="Add Transaction"><span><IconButton aria-label="Add Transaction" icon={<FaPlusCircle />} onClick={onAddTransaction} size="lg" colorScheme="green" variant="ghost" /></span></Tooltip>
        <Tooltip label="View Transactions">
          <Box position="relative" display="inline-block" overflow="visible">
            <IconButton aria-label="View Transactions" icon={<FaList />} onClick={onViewTransactions} size="lg" colorScheme="purple" variant="ghost" />
            {pendingTransactionsCount > 0 && (
              <Box
                position="absolute"
                top="-10px"
                right="-10px"
                bg="red.500"
                color="white"
                borderRadius="full"
                minW="22px"
                h="22px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                fontWeight="bold"
                border="3px solid white"
                boxShadow="0 2px 10px rgba(0,0,0,0.4)"
                zIndex={999}
              >
                {pendingTransactionsCount}
              </Box>
            )}
          </Box>
        </Tooltip>
        <Tooltip label="View Details"><span><IconButton aria-label="View Details" icon={<FaInfoCircle />} onClick={onViewDetails} size="lg" colorScheme="gray" variant="ghost" /></span></Tooltip>
        <Tooltip label="Edit Account"><span><IconButton aria-label="Edit Account" icon={<FaEdit />} onClick={onEdit} size="lg" colorScheme="yellow" variant="ghost" /></span></Tooltip>
        <Tooltip label="Delete Account"><span><IconButton aria-label="Delete Account" icon={<FaTrash />} onClick={onDelete} size="lg" colorScheme="red" variant="ghost" /></span></Tooltip>
      </Flex>
    </Box>
  );
};

export default AccountDashboardCard;
