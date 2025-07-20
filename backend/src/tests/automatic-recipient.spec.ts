import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { RecipientsService } from '../recipients/recipients.service';
import { Account, AccountType } from '../accounts/accounts.entity';
import { Recipient, RecipientType } from '../recipients/recipients.entity';
import { Transaction } from '../transactions/transactions.entity';

describe('Automatic Recipient Creation', () => {
  let accountsService: AccountsService;
  let recipientsService: RecipientsService;
  let accountRepository: Repository<Account>;
  let recipientRepository: Repository<Recipient>;

  const mockAccountRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockRecipientRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockTransactionRepository = {
    find: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        RecipientsService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepository,
        },
        {
          provide: getRepositoryToken(Recipient),
          useValue: mockRecipientRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
      ],
    }).compile();

    accountsService = module.get<AccountsService>(AccountsService);
    recipientsService = module.get<RecipientsService>(RecipientsService);
    accountRepository = module.get<Repository<Account>>(
      getRepositoryToken(Account),
    );
    recipientRepository = module.get<Repository<Recipient>>(
      getRepositoryToken(Recipient),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Account Creation', () => {
    it('should automatically create a recipient when an account is created', async () => {
      // Arrange
      const createAccountDto = {
        account_name: 'Test Savings Account',
        account_type: AccountType.SAVINGS,
        bank_name: 'Test Bank',
        account_number: '1234567890',
        opening_balance: 1000,
      };

      const savedAccount = {
        id: 1,
        ...createAccountDto,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const expectedRecipientData = {
        name: 'Test Savings Account',
        recipient_type: RecipientType.ACCOUNT,
        account_id: 1,
        bank_account_no: '1234567890',
        notes: 'Auto-generated recipient for account: Test Savings Account',
      };

      mockAccountRepository.findOne.mockResolvedValue(null); // No duplicate
      mockAccountRepository.create.mockReturnValue(savedAccount);
      mockAccountRepository.save.mockResolvedValue(savedAccount);
      mockRecipientRepository.create.mockReturnValue(expectedRecipientData);
      mockRecipientRepository.save.mockResolvedValue({
        id: 1,
        ...expectedRecipientData,
      });

      // Act
      const result = await accountsService.create(createAccountDto);

      // Assert
      expect(result).toEqual(savedAccount);
      expect(mockRecipientRepository.create).toHaveBeenCalledWith(
        expectedRecipientData,
      );
      expect(mockRecipientRepository.save).toHaveBeenCalled();
    });

    it('should handle cash accounts without account numbers', async () => {
      // Arrange
      const createAccountDto = {
        account_name: 'Cash Wallet',
        account_type: AccountType.CASH,
        opening_balance: 500,
      };

      const savedAccount = {
        id: 2,
        ...createAccountDto,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const expectedRecipientData = {
        name: 'Cash Wallet',
        recipient_type: RecipientType.ACCOUNT,
        account_id: 2,
        bank_account_no: null,
        notes: 'Auto-generated recipient for account: Cash Wallet',
      };

      mockAccountRepository.create.mockReturnValue(savedAccount);
      mockAccountRepository.save.mockResolvedValue(savedAccount);
      mockRecipientRepository.create.mockReturnValue(expectedRecipientData);
      mockRecipientRepository.save.mockResolvedValue({
        id: 2,
        ...expectedRecipientData,
      });

      // Act
      const result = await accountsService.create(createAccountDto);

      // Assert
      expect(result).toEqual(savedAccount);
      expect(mockRecipientRepository.create).toHaveBeenCalledWith(
        expectedRecipientData,
      );
    });
  });

  describe('Account Update', () => {
    it('should update the corresponding recipient when account is updated', async () => {
      // Arrange
      const accountId = 1;
      const existingAccount = {
        id: accountId,
        account_name: 'Old Account Name',
        account_type: AccountType.CURRENT,
        bank_name: 'Old Bank',
        account_number: '0987654321',
        opening_balance: 2000,
      };

      const updateDto = {
        account_name: 'Updated Account Name',
        bank_name: 'New Bank',
      };

      const updatedAccount = { ...existingAccount, ...updateDto };

      const existingRecipient = {
        id: 1,
        name: 'Old Account Name',
        recipient_type: RecipientType.ACCOUNT,
        account_id: accountId,
        bank_account_no: '0987654321',
      };

      mockAccountRepository.findOne.mockResolvedValue(existingAccount);
      mockAccountRepository.save.mockResolvedValue(updatedAccount);
      mockRecipientRepository.find.mockResolvedValue([existingRecipient]);
      mockRecipientRepository.save.mockResolvedValue({
        ...existingRecipient,
        name: 'Updated Account Name',
      });

      // Act
      const result = await accountsService.update(accountId, updateDto);

      // Assert
      expect(result).toEqual(updatedAccount);
      // Verify recipient update was called through the service
      expect(mockRecipientRepository.find).toHaveBeenCalledWith({
        where: { account_id: accountId },
      });
    });
  });

  describe('Account Deletion', () => {
    it('should delete the corresponding recipient when account is deleted', async () => {
      // Arrange
      const accountId = 1;
      const existingAccount = {
        id: accountId,
        account_name: 'Account to Delete',
        account_type: AccountType.SAVINGS,
        bank_name: 'Test Bank',
        account_number: '1111111111',
        opening_balance: 1000,
      };

      const existingRecipient = {
        id: 1,
        name: 'Account to Delete',
        recipient_type: RecipientType.ACCOUNT,
        account_id: accountId,
        bank_account_no: '1111111111',
      };

      mockAccountRepository.findOne.mockResolvedValue(existingAccount);
      mockRecipientRepository.find.mockResolvedValue([existingRecipient]);
      mockRecipientRepository.delete.mockResolvedValue({ affected: 1 });
      mockAccountRepository.delete.mockResolvedValue({ affected: 1 });

      // Act
      await accountsService.remove(accountId);

      // Assert
      expect(mockRecipientRepository.find).toHaveBeenCalledWith({
        where: { account_id: accountId },
      });
      expect(mockAccountRepository.delete).toHaveBeenCalledWith(accountId);
    });
  });

  describe('Error Handling', () => {
    it('should not fail account creation if recipient creation fails', async () => {
      // Arrange
      const createAccountDto = {
        account_name: 'Test Account',
        account_type: AccountType.CURRENT,
        bank_name: 'Test Bank',
        account_number: '5555555555',
        opening_balance: 1000,
      };

      const savedAccount = {
        id: 1,
        ...createAccountDto,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAccountRepository.findOne.mockResolvedValue(null);
      mockAccountRepository.create.mockReturnValue(savedAccount);
      mockAccountRepository.save.mockResolvedValue(savedAccount);
      mockRecipientRepository.create.mockImplementation(() => {
        throw new Error('Recipient creation failed');
      });

      // Mock console.error to verify error is logged
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = await accountsService.create(createAccountDto);

      // Assert
      expect(result).toEqual(savedAccount);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create account recipient:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
