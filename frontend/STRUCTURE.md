# Frontend Structure Guide

## 📁 Folder Organization

### **Pages (`src/pages/`)**
These are full-screen components that correspond to specific routes in your application:

- **`Home.tsx`** - Main dashboard page (Route: `/`)
  - Shows account cards, navigation to other pages
  - Uses: `AccountDashboardCard`, `AddAccountModal`

- **`AccountDetails.tsx`** - Individual account details (Route: `/accounts/:id`)
  - Shows account info, transactions, and management options
  - Uses: `AddTransactionModal`, `EditTransactionModal`

- **`TransactionsList.tsx`** - List of transactions (Route: `/accounts/:accountId/transactions`)
  - Shows all transactions for a specific account
  - Uses: `TransactionRow`, `AddTransactionModal`, `EditTransactionModal`

- **`TransactionDetails.tsx`** - Individual transaction details (Route: `/transactions/:id`)
  - Shows detailed information about a specific transaction

- **`RecipientsList.tsx`** - List of recipients per account (Route: `/accounts/:id/recipients`)
  - Shows and manages recipients for a specific account
  - Uses: `AddRecipientModal`, `EditRecipientModal`

### **Components (`src/components/`)**
These are reusable UI components used within pages:

#### **Cards & Display Components:**
- **`AccountDashboardCard.tsx`** - Account card for dashboard
- **`AccountRow.tsx`** - Table row for account lists
- **`TransactionRow.tsx`** - Table row for transaction lists

#### **Modal Components:**
- **`AddAccountModal.tsx`** - Modal for adding new accounts
- **`EditAccountModal.tsx`** - Modal for editing existing accounts
- **`AddRecipientModal.tsx`** - Modal for adding recipients
- **`EditRecipientModal.tsx`** - Modal for editing recipients
- **`AddTransactionModal.tsx`** - Modal for adding transactions
- **`EditTransactionModal.tsx`** - Modal for editing transactions

#### **Utility Components:**
- **`CustomPopup.tsx`** - Reusable popup/confirmation dialog

## 🔄 Component Usage Pattern

```
Pages (Route Components)
├── Import and use multiple Components
├── Handle navigation between pages
├── Manage page-level state
└── Connect to API endpoints

Components (Reusable UI)
├── Accept props for data and callbacks
├── Focus on specific UI functionality
├── Can be used in multiple pages
└── Should be modular and reusable
```

## 🎯 Best Practices

1. **Pages should only contain routing logic and page-level state**
2. **Components should be pure and reusable**
3. **Keep API calls in pages, not components**
4. **Pass data down through props**
5. **Use callbacks for child-to-parent communication**

## 📝 Current Status

✅ **Clean Structure**
- All pages are properly routed
- Components are reusable and well-defined
- No duplicate or unused files

❌ **Removed Files**
- `AccountsList.tsx` - Unused duplicate of Home.tsx
- `AddAccountModalV2.tsx` - Duplicate of AddAccountModal.tsx
