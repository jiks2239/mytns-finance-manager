# API Migration Plan

## Phase 1: Core Files ✅ COMPLETED
- ✅ Created centralized API (`/frontend/src/api/index.ts`)
- ✅ AddAccountModal.tsx
- ✅ Home.tsx  
- ✅ EditAccountModal.tsx
- ✅ DeleteAccountModal.tsx

## Phase 2: Complex Pages (Next Priority)
These files need careful type reconciliation:

### AccountDetails.tsx - PARTIALLY MIGRATED
- ✅ Account fetch: `api.accounts.getById()`
- ✅ Transactions fetch: `api.accounts.getTransactions()`
- ❌ Transaction delete: still needs `api.transactions.delete()`
- ❌ Balance fetch: still needs `api.accounts.getBalance()`
- ❌ Type conflicts: Local Transaction/Account types vs centralized types

### TransactionsList.tsx
- ❌ Account name fetch: use `api.accounts.getById()`
- ❌ Balance fetch: use `api.accounts.getBalance()`
- ❌ Transactions fetch: use `api.accounts.getTransactions()`
- ❌ Transaction delete: use `api.transactions.delete()`

### RecipientsList.tsx
- ❌ Account fetch: use `api.accounts.getById()`
- ❌ Recipients fetch: use `api.recipients.getByAccountId()`
- ❌ Recipient delete: use `api.recipients.delete()`

### TransactionDetails.tsx
- ❌ Transaction fetch: use `api.transactions.getById()`

## Phase 3: Modal Components
### AddTransactionModal.tsx
- ❌ Recipients fetch: use `api.accounts.getRecipientsForTransactions()`
- ❌ Accounts fetch: use `api.accounts.getAll()`
- ❌ Transaction create: use `api.transactions.create()`

### EditTransactionModal.tsx
- ❌ Transaction update: use `api.transactions.update()`

### AddRecipientModal.tsx
- ❌ Recipient create: use `api.recipients.create()`

### EditRecipientModal.tsx
- ❌ Recipient update: use `api.recipients.update()`

## Major Issues to Resolve:

### 1. Type Conflicts
The centralized API uses:
- `Account.id: number`
- `Transaction.id: number`

But some files expect:
- `Account.id: string` 
- `Transaction.id: string`

### 2. Transaction Detail Types
The centralized API uses `Record<string, unknown>` for transaction details, but files expect specific types like:
```typescript
upi_settlement_details?: {
  settlement_date?: string;
}
```

### 3. Missing Properties
Some files expect properties not in centralized types:
- `Transaction.created_at`
- `Transaction.date`

## Recommended Next Steps:

1. **Fix Type Definitions**: Update centralized API types to match actual backend response
2. **Standardize ID Types**: Decide on number vs string for IDs across the app
3. **Complete AccountDetails.tsx**: Finish migrating remaining API calls
4. **Migrate Remaining Files**: Follow the phase plan above
5. **Test Integration**: Ensure all API calls work correctly
6. **Remove Legacy Code**: Clean up any remaining direct fetch calls

## Benefits Already Achieved:
- ✅ Centralized error handling
- ✅ Consistent request formatting
- ✅ Single source of truth for API endpoints
- ✅ Better TypeScript support
- ✅ Easier maintenance and testing
