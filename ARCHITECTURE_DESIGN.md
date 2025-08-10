# Finance Manager - Architecture Design Document

**Version:** 1.0  
**Date:** August 10, 2025  
**Status:** In Progress

---

## Overview

This document defines the complete architecture design for the Finance Manager application. It will be updated as we design each object/entity in the system.

## UI/UX Standards

### Dropdown Behavior
- **All dropdown fields must display "Select" as the default pre-selected value**
- No actual option should be pre-selected in any dropdown
- Users must explicitly select an option from the dropdown list
- This applies to all dropdowns across Account, Recipients, and Transaction wizards

---

## UI Architecture

### Landing Page Requirements

#### Landing Page Layout
- **Primary Purpose:** Display list of accounts as the main dashboard
- **Design:** Good-looking, clean interface focusing on account overview

#### No Accounts State
- **When no accounts exist:** Display a prominent "Create New Account" button
- **Call-to-Action:** Guide users to create their first account

#### Accounts Display (When accounts exist)
- **Layout:** Card-based design for each account
- **Account Cards:** Show basic account details in an attractive card format
- **Card Content:** Account name, type, current balance, and other essential info

#### Account Actions (Per Account Card)
Each account card must have the following action buttons:

1. **View Recipients**
   - Button to navigate to a separate Recipients page for that account
   - Recipients page is account-specific (only shows recipients for selected account)

2. **View Transactions** 
   - Button to navigate to a separate Transactions page for that account
   - Transactions page is account-specific (only shows transactions for selected account)

3. **View Account Details**
   - Button to navigate to a separate Account Details page
   - Shows complete account information and settings

#### Navigation Structure
```
Landing Page (Account List)
├── Create Account Wizard (if no accounts)
├── Account 1 Card
│   ├── → Recipients Page (Account 1)
│   ├── → Transactions Page (Account 1) 
│   └── → Account Details Page (Account 1)
├── Account 2 Card
│   ├── → Recipients Page (Account 2)
│   ├── → Transactions Page (Account 2)
│   └── → Account Details Page (Account 2)
└── ... (more accounts)
```

#### Recipient Creation Access
- **"Add Recipient" functionality is only available within the Recipients page of a specific account**
- Recipients are always created in the context of the currently viewed account
- No global recipient creation option

*Note: Further UI requirements will be updated as design evolves*

---

## API Requirements

### CRUD Operations Standard
All objects in this architecture require complete CRUD (Create, Read, Update, Delete) operations in the backend.

### Nested Architecture & Cascading Deletes
- **Architecture Type:** Nested/Hierarchical
- **Cascade Rule:** Deleting a parent entity automatically deletes all related child entities
- **Hierarchy:** Account → Recipients → Transactions

### Account API Endpoints

#### Create Account
- **POST** `/accounts`
- **Payload:** Account creation data per wizard requirements

#### Update Account  
- **PUT** `/accounts/:accountId`
- **Parameter:** `accountId` - Unique account identifier
- **Payload:** Updated account data

#### Get Account(s)
- **GET** `/accounts` - Get all accounts
- **GET** `/accounts/search` - Get accounts with query parameters:

**Supported Query Parameters:**
- `accountName` - Filter by account name
- `accountId` - Get specific account by ID  
- `bankAccountName` - Filter by bank account name
- `bankAccountNumber` - Filter by bank account number
- `recipientId` - Get accounts associated with specific recipient

**Examples:**
```
GET /accounts?accountName=MyAccount
GET /accounts?accountId=123
GET /accounts?bankAccountName=SBI-Business
GET /accounts?bankAccountNumber=12345678901
GET /accounts?recipientId=456
```

#### Delete Account
- **DELETE** `/accounts/:accountId`
- **Parameter:** `accountId` - Account to delete
- **Cascade Effect:** Automatically deletes:
  - All recipients associated with this account
  - All transactions associated with this account
  - All transactions where this account appears as a recipient

#### Delete All Accounts
- **DELETE** `/accounts`
- **Cascade Effect:** Deletes entire database:
  - All accounts
  - All recipients 
  - All transactions

### Cascade Deletion Rules

#### When Account is Deleted:
1. **Direct Recipients:** All recipients where `parentAccountID` = deleted account ID
2. **Account Transactions:** All transactions where `accountId` = deleted account ID
3. **Recipient Transactions:** All transactions associated with deleted recipients
4. **Cross-Account References:** Remove account from other accounts' recipient lists

#### Data Integrity
- Cascading deletes maintain referential integrity
- No orphaned records allowed
- Transaction history preserved until parent account deletion

### Recipients API Endpoints

#### Create Recipient
- **POST** `/recipients`
- **Payload:** Recipient creation data per wizard requirements (includes parentAccountID)

#### Update Recipient
- **PUT** `/recipients/:recipientId`
- **Parameter:** `recipientId` - Unique recipient identifier
- **Payload:** Updated recipient data

#### Get Recipient(s)
- **GET** `/recipients` - Get all recipients
- **GET** `/recipients/search` - Get recipients with query parameters:

**Supported Query Parameters:**
- `recipientName` - Filter by recipient name
- `recipientType` - Filter by recipient type (Supplier, Customer, Account, Owner, Vendor)
- `recipientId` - Get specific recipient by ID
- `parentAccountId` - Get all recipients for specific account

**Examples:**
```
GET /recipients?recipientName=John Supplier
GET /recipients?recipientType=Supplier
GET /recipients?recipientId=789
GET /recipients?parentAccountId=123
```

#### Delete Recipient
- **DELETE** `/recipients/:recipientId`
- **Parameter:** `recipientId` - Recipient to delete
- **Cascade Effect:** Automatically deletes:
  - All transactions associated with this recipient

#### Delete All Recipients by Account
- **DELETE** `/recipients/account/:parentAccountId`
- **Parameter:** `parentAccountId` - Delete all recipients for specific account
- **Cascade Effect:** Automatically deletes:
  - All recipients where `parentAccountID` = specified account ID
  - All transactions associated with these recipients

### Transactions API Endpoints

#### Create Transaction
- **POST** `/transactions`
- **Payload:** Transaction creation data per wizard requirements

#### Update Transaction
- **PUT** `/transactions/:transactionId`
- **Parameter:** `transactionId` - Unique transaction identifier
- **Payload:** Updated transaction data (status updates only for completed transactions)

#### Get Transaction(s)
- **GET** `/transactions` - Get all transactions
- **GET** `/transactions/search` - Get transactions with query parameters:

**Supported Query Parameters:**
- `parentAccountId` - Filter by parent account (the account that owns the transaction)
- `recipientId` - Filter by recipient  
- `transactionCategory` - Filter by category (CREDIT, DEBIT)
- `transactionSubtype` - Filter by subtype (CREDIT_DEPOSIT, DEBIT_UPI, etc.)
- `status` - Filter by status (subtype-specific values)
- `amount` - Filter by amount (accepts range with `minAmount` and `maxAmount`)
- `description` - Filter by transaction description
- `dateRange` - Filter by subtype-specific dates (accepts `startDate` and `endDate`)

**Examples:**
```
GET /transactions?parentAccountId=123
GET /transactions?transactionCategory=CREDIT&status=Deposited
GET /transactions?transactionSubtype=DEBIT_UPI&status=Transferred
GET /transactions?minAmount=1000&maxAmount=5000
GET /transactions?startDate=2025-01-01&endDate=2025-01-31
```

#### Update Transaction Status
- **PATCH** `/transactions/:transactionId/status`
- **Parameter:** `transactionId` - Transaction to update
- **Payload:** `{ "status": "COMPLETED|FAILED|CANCELLED" }`
- **Business Rules:** Only PENDING transactions can be updated

#### Delete Transaction
- **DELETE** `/transactions/:transactionId`
- **Parameter:** `transactionId` - Transaction to delete
- **Cascade Effect:** Automatically deletes:
  - All transaction detail records (type-specific details)
  - Updates account balance if transaction was COMPLETED

#### Delete All Transactions by Account
- **DELETE** `/transactions/account/:parentAccountId`
- **Parameter:** `parentAccountId` - Delete all transactions for specific account
- **Cascade Effect:** Automatically deletes:
  - All transactions where `parentAccountId` = specified account ID
  - All transaction detail records for these transactions
  - Recalculates account balance to opening balance

#### Delete All Transactions by Recipient
- **DELETE** `/transactions/recipient/:recipientId`
- **Parameter:** `recipientId` - Delete all transactions for specific recipient
- **Cascade Effect:** Automatically deletes:
  - All transactions where `recipientId` = specified recipient ID
  - All transaction detail records for these transactions
  - Updates account balances accordingly

*Note: Additional CRUD requirements for Recipients and Transactions will be documented as objects are designed*

---

## 1. Account Object

### 1.1 Account Types

The application supports three distinct types of accounts:

1. **Current Account**
2. **Savings Account** 
3. **Cash Account**

### 1.2 Account Properties

#### 1.2.1 Complete Account Structure
All accounts contain these core properties:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `accountType` | Enum | Required | Type: Current Account, Savings Account, Cash Account |
| `accountName` | String | Required, Unique | Display name for the account |
| `bankAccountName` | String | Required for Current/Savings, N/A for Cash | Official bank account name |
| `bankAccountNumber` | String | Required for Current/Savings, N/A for Cash | Bank account number |
| `branchName` | String | Required for Current/Savings, N/A for Cash | Bank branch name |
| `openingBalance` | Number | Required | Initial balance when account is created |
| `currentBalance` | Number | Auto-calculated | Current account balance (updated via transactions) |
| `accountStatus` | Enum | Required, Default: Active | Status: Active, Inactive, Closed |
| `description` | String | Optional | Account description/notes |
| `createdAt` | DateTime | Auto-generated | Account creation timestamp |
| `updatedAt` | DateTime | Auto-generated | Last modification timestamp |
| `recipients` | Relationship | Auto-generated | List of associated recipients |

#### 1.2.2 Type-Specific Requirements

**Current Account & Savings Account:**
- All fields are required except `description` (optional)
- `bankAccountName` must be unique across Current/Savings accounts
- `bankAccountNumber` must be unique across Current/Savings accounts
- `branchName` is required for banking operations

**Cash Account:**
- Required: `accountType`, `accountName`, `openingBalance`, `accountStatus`
- Optional: `description`
- Not applicable: `bankAccountName`, `bankAccountNumber`, `branchName`

### 1.3 UI Requirements - Account Creation Wizard

The account creation follows a multi-step wizard approach:

#### 1.3.1 Step 1: Account Type & Name
- **Account Name** (text input, required)
- **Account Type** (dropdown: "Select" as default, options: Current Account, Savings Account, Cash Account)

#### 1.3.2 Step 2: Bank Details (Conditional)
- **If Current/Savings Account selected:**
  - Bank Account Name (text input, required)
  - Bank Account Number (text input, required)
  - Branch Name (text input, required)
- **If Cash Account selected:**
  - Skip this step entirely

#### 1.3.3 Step 3: Opening Balance & Details
- **Opening Balance** (number input, required)
- **Account Status** (dropdown: "Select" as default, options: Active, Inactive, Closed, default: Active)
- **Description** (textarea, optional)

#### 1.3.4 Step 4: Creation Summary
- Display all entered information for review
- **Save Button** to create the account
- **Back Button** to modify any details

### 1.4 Business Rules

1. **Account Type Logic:**
   - `accountType` determines which fields are required
   - Current/Savings accounts require all bank-related fields
   - Cash accounts skip bank-related fields entirely

2. **Uniqueness Constraints:**
   - `accountName` must be unique across all account types
   - `bankAccountName` must be unique across Current/Savings accounts only
   - `bankAccountNumber` must be unique across Current/Savings accounts only

3. **Required Fields:**
   - Always required: `accountType`, `accountName`, `openingBalance`, `accountStatus`
   - Conditionally required: `bankAccountName`, `bankAccountNumber`, `branchName` (only for Current/Savings)
   - Optional: `description`

4. **Balance Management:**
   - `openingBalance` set during account creation
   - `currentBalance` auto-calculated and updated via transaction operations
   - Balance calculations detailed in Transaction section

5. **Auto-Recipient Creation:**
   - When an account is created, automatically create a corresponding recipient of type "Account"
   - This enables inter-account transfers
   - Auto-created recipient inherits account name

6. **Data Validation:**
   - Account name: Basic string validation, reasonable length limits
   - Bank account number: Numeric validation
   - Recipient name: Alphanumeric characters, hyphens (-), and spaces only

7. **Wizard Flow:**
   - Step 1: Account Name + Account Type selection
   - Step 2: Bank details (conditional based on account type)
   - Step 3: Opening Balance, Status, and Description entry
   - Step 4: Summary review and confirmation

8. **Audit Trail:**
   - System automatically tracks `createdAt` and `updatedAt` timestamps
   - These timestamps are not user-editable

8. **Audit Trail:**
   - System automatically tracks `createdAt` and `updatedAt` timestamps
   - These timestamps are not user-editable

9. **Relationships:**
   - Each account will have associated recipients (via junction table)
   - Accounts can have relationships with other entities (to be defined)

---

## 2. Recipients Object

### 2.1 Overview

The recipient object represents the replica of receiver or sender persons/entities in transactions with minimum information. Recipients serve dual purposes:
- **Receiver persons:** Suppliers, customers, employees, owners who receive money
- **Sender persons:** Source accounts when transferring money between accounts (inter-account transfers)

### 2.2 Recipient Relationships

- **Many-to-Many:** Recipients and accounts have many-to-many relationships via junction table
- **Cross-Account:** Recipients can be shared across different accounts
- **Junction Table:** `account_recipients` manages the relationships between accounts and recipients

### 2.3 Recipient Properties

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `recipientName` | String | Required, Unique Globally | Name of the recipient person/entity |
| `recipientType` | Enum | Required | Type: Supplier, Customer, Account, Owner, Vendor |
| `createdAt` | DateTime | Auto-generated | Recipient creation timestamp |
| `updatedAt` | DateTime | Auto-generated | Last modification timestamp |
| `transactions` | Relationship | Auto-generated | List of associated transactions |

### 2.4 Junction Table: Account-Recipients

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `accountId` | Number | Required, Foreign Key | Reference to Account |
| `recipientId` | Number | Required, Foreign Key | Reference to Recipient |
| `createdAt` | DateTime | Auto-generated | Relationship creation timestamp |

**Composite Primary Key:** (`accountId`, `recipientId`)

---

## 2. Recipients Object

### 2.1 Overview

The recipient object represents the replica of receiver or sender persons/entities in transactions with minimum information. Recipients serve dual purposes:
- **Receiver persons:** Suppliers, customers, employees, owners who receive money
- **Sender persons:** Source accounts when transferring money between accounts (inter-account transfers)

### 2.2 Recipient Relationships

- **One-to-Many:** Each account may contain multiple recipients
- **Many-to-Many:** One recipient may appear in multiple accounts
- **Cross-Account:** Recipients can be shared across different accounts

### 2.3 Recipient Properties

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `recipientName` | String | Required, Unique | Name of the recipient person/entity |
| `recipientType` | Enum | Required | Type: Supplier, Customer, Account, Owner, Vendor |
| `parentAccountID` | Number | Required, Foreign Key | ID of the account this recipient belongs to |
| `createdAt` | DateTime | Auto-generated | Recipient creation timestamp |
| `updatedAt` | DateTime | Auto-generated | Last modification timestamp |
| `transactions` | Relationship | Auto-generated | List of associated transactions |

### 2.5 Recipient Types

1. **Supplier** - Vendors/suppliers who provide goods/services
2. **Customer** - Clients/customers who purchase goods/services  
3. **Account** - Other accounts for inter-account transfers (auto-created)
4. **Owner** - Business owners or stakeholders
5. **Vendor** - General vendors/service providers

### 2.6 UI Requirements - Recipient Creation Wizard

The recipient creation follows a multi-step wizard approach:

#### 2.6.1 UI Access Point
- **Recipients can only be created under an existing account**
- The "Add Recipient" option is available only within account views/contexts
- Recipients are always associated with the currently selected account via junction table

#### 2.6.2 Step 1: Recipient Name
- **Recipient Name** (text input, required)
- **Validation:** Alphanumeric characters, hyphens (-), and spaces only

#### 2.6.3 Step 2: Recipient Type
- **Recipient Type** (dropdown: "Select" as default, options: Supplier, Customer, Account, Owner, Vendor)

#### 2.6.4 Step 3: Creation Summary
- Display all entered information for review:
  - Recipient Name
  - Recipient Type
  - Current Account (context where recipient is being added)
- **Save Button** to create the recipient and junction table entry
- **Back Button** to modify any details

### 2.7 Business Rules

1. **Global Uniqueness:**
   - `recipientName` must be unique globally across all recipients
   - Recipients represent unique external entities
   
2. **Required Fields:**
   - All fields except auto-generated timestamps are mandatory
   
3. **Many-to-Many Relationships:**
   - Recipients can be associated with multiple accounts via junction table
   - Junction table manages account-recipient relationships
   - One recipient can appear in multiple accounts' recipient lists
   
4. **Auto-Creation for Inter-Account Transfers:**
   - When an account is created, automatically create a recipient of type "Account"
   - Auto-created recipient enables inter-account transfers
   - Auto-created recipient inherits the account name
   
5. **UI Access Control:**
   - Recipients can only be created from within an account context
   - "Add Recipient" functionality available when viewing/managing an account
   - Creates junction table entry linking recipient to current account
   
6. **Data Validation:**
   - Recipient name: Alphanumeric characters, hyphens (-), and spaces only
   - No special characters except hyphen and space
   
7. **Wizard Flow:**
   - Step 1: Recipient Name entry with validation
   - Step 2: Recipient Type selection  
   - Step 3: Summary review and confirmation (shows current account context)
   
8. **Transaction Flow:**
   - Recipients serve as the "other party" in transactions
   - For inter-account transfers, source account becomes a recipient of destination account
   
9. **Audit Trail:**
   - System automatically tracks `createdAt` and `updatedAt` timestamps
   
10. **Relationships:**
    - Each recipient can have multiple associated transactions
    - Many-to-many relationship with accounts via junction table

---

## 3. Transactions Object  
*[To be designed]*

---

## 4. Relationships
*[To be designed after all objects are defined]*

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Aug 10, 2025 | MAJOR REDESIGN: Completely redesigned transaction architecture based on user requirements - Credit/Debit categorization, 10 transaction subtypes, subtype-specific status values, multiple date fields per subtype, wizard-based UI, status-date validation rules, inter-account transfer automation |
| 1.9 | Aug 10, 2025 | Added complete Transactions object design with 6 transaction types, status flow, type-specific details, business rules, UI requirements, validation rules, and comprehensive API endpoints |
| 1.8 | Aug 10, 2025 | Major updates: Added currentBalance, accountStatus, description, branchName to Account; Implemented many-to-many relationships via junction table; Added auto-recipient creation; Enhanced validation rules |
| 1.7 | Aug 10, 2025 | Added Recipients API endpoints with CRUD operations, query parameters, and cascading delete rules |
| 1.6 | Aug 10, 2025 | Added comprehensive API Requirements section with CRUD operations, query parameters, and cascading delete rules |
| 1.5 | Aug 10, 2025 | Added UI Architecture section with landing page, navigation structure, and account-specific page requirements |
| 1.4 | Aug 10, 2025 | Added UI/UX standard for dropdown behavior - all dropdowns default to "Select" |
| 1.3 | Aug 10, 2025 | Added Recipients wizard UI flow and account-contextual creation requirements |
| 1.2 | Aug 10, 2025 | Added Recipients object design with types, relationships, and business rules |
| 1.1 | Aug 10, 2025 | Updated Account object with accountType field, wizard UI flow, and refined business rules |
| 1.0 | Aug 10, 2025 | Initial Account object design |

---

## 7. TRANSACTIONS OBJECT

### 7.1 Object Purpose
The Transactions object is the core operational entity that records all financial movements within the system. It supports multiple transaction types with specific business rules and maintains detailed transaction information for comprehensive financial tracking.

### 7.2 Transaction Properties (UPDATED)

| Property | Type | Required | Description | Business Rules |
|----------|------|----------|-------------|----------------|
| id | UUID | Auto | Unique transaction identifier | Auto-generated primary key |
| transactionCategory | ENUM | Yes | Credit or Debit | PRIMARY CATEGORIZATION |
| transactionSubtype | ENUM | Yes | Specific subtype within category | See Transaction Subtypes below |
| parentAccountId | UUID | Yes | Source account for the transaction | Must reference existing Account |
| recipientId | UUID | Conditional | Target recipient for the transaction | Required for most subtypes (see rules) |
| amount | DECIMAL(15,2) | Yes | Transaction amount | Must be positive, max 2 decimal places |
| description | TEXT | No | Transaction description/memo | Free text, max 500 characters |
| createdAt | TIMESTAMP | Auto | When record was created | Auto-generated |
| updatedAt | TIMESTAMP | Auto | When record was last modified | Auto-updated |
| status | ENUM | Yes | Current transaction status | Subtype-specific values |

### 7.3 Transaction Categories and Subtypes

#### 7.3.1 Credit Transactions
| Subtype | Code | Description | Recipient Required | Status Values |
|---------|------|-------------|-------------------|---------------|
| Deposit | CREDIT_DEPOSIT | Cash/bank deposits | No | Pending, Deposited, Cancelled |
| Transfer | CREDIT_TRANSFER | Incoming bank transfers | Yes | Pending, Transferred, Cancelled |
| Settlement | CREDIT_SETTLEMENT | UPI wallet settlements | No | Pending, Settled |
| Cheque | CREDIT_CHEQUE | Received cheques | Yes | Pending, Submitted, Cleared, Bounced |

#### 7.3.2 Debit Transactions
| Subtype | Code | Description | Recipient Required | Status Values |
|---------|------|-------------|-------------------|---------------|
| Cheque | DEBIT_CHEQUE | Issued cheques | Yes | Pending, Cleared, Stopped, Bounced |
| Bank Charge | DEBIT_BANK_CHARGE | Bank fees and charges | No | Pending, Debited |
| NEFT | DEBIT_NEFT | NEFT transfers | Yes | Pending, Transferred, Received |
| IMPS | DEBIT_IMPS | IMPS transfers | Yes | Pending, Transferred, Received |
| RTGS | DEBIT_RTGS | RTGS transfers | Yes | Pending, Transferred, Received |
| UPI | DEBIT_UPI | UPI transfers | Yes | Pending, Transferred, Received |

### 7.4 Transaction Status Flow

```
PENDING → COMPLETED (successful transaction)
PENDING → FAILED (transaction failed)
PENDING → CANCELLED (user cancelled)
COMPLETED → [final state]
FAILED → [final state]
CANCELLED → [final state]
```

### 7.5 Transaction Details (Subtype-Specific)

#### 7.5.1 Credit Deposit Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dateOfDeposit | DATE | Yes | Date when deposit occurred/planned |

**Status-Date Validation:**
- Status "Pending" → dateOfDeposit cannot be past date
- Status "Deposited" → dateOfDeposit cannot be future date

#### 7.5.2 Credit Transfer Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dateOfTransfer | DATE | Yes | Date when transfer occurred/expected |
| transferMode | ENUM | Yes | NEFT, IMPS, RTGS, UPI |

**Status-Date Validation:**
- Status "Pending" → dateOfTransfer cannot be past date
- Status "Transferred" → dateOfTransfer cannot be future date

#### 7.5.3 Credit Settlement Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dateOfSettlement | DATE | Yes | Date when UPI settlement occurred/expected |

**Status-Date Validation:**
- Status "Pending" → dateOfSettlement cannot be past date
- Status "Settled" → dateOfSettlement cannot be future date

#### 7.5.4 Credit Cheque Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dateOfChequeIssue | DATE | Yes | Date cheque was issued |
| dateOfChequeDue | DATE | Yes | Date cheque is due for clearance |
| dateOfChequeSubmitted | DATE | No | Date cheque was submitted to bank |
| dateOfChequeCleared | DATE | No | Date cheque was cleared |
| chequeBounceCharge | DECIMAL(10,2) | No | Charge for bounced cheque |

**Date Validation Chain:**
- dateOfChequeCleared >= dateOfChequeSubmitted >= dateOfChequeDue >= dateOfChequeIssue

**Status-Field Validation:**
- Status "Pending/Bounced" → dateOfChequeCleared must be empty
- Status "Cleared" → dateOfChequeCleared must have value

#### 7.5.5 Debit Cheque Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dateOfChequeIssue | DATE | Yes | Date cheque was issued |
| dateOfChequeDue | DATE | Yes | Date cheque is due for clearance |
| dateOfChequeCleared | DATE | No | Date cheque was cleared |

**Date Validation Chain:**
- dateOfChequeCleared >= dateOfChequeDue >= dateOfChequeIssue

#### 7.5.6 Debit Bank Charge Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bankChargeType | ENUM | Yes | MAINTENANCE, TRANSACTION, PENALTY, OTHER |
| dateOfDebit | DATE | Yes | Date when charge was/will be debited |

**Status-Date Validation:**
- Status "Pending" → dateOfDebit cannot be past date

#### 7.5.7 Debit Transfer Details (NEFT/IMPS/RTGS/UPI)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dateOfTransfer | DATE | Yes | Date when transfer occurred/planned |

**Status-Date Validation:**
- Status "Pending" → dateOfTransfer cannot be past date

**Special Inter-Account Transfer Logic:**
- When recipient is another user account → Auto-create "Credit Transfer" in receiver account
- Receiver transaction status = "Received" when sender status = "Transferred"

### 7.6 Business Rules (UPDATED)

#### 7.6.1 Transaction Creation Rules
1. **Amount Validation**: All amounts must be positive and greater than 0
2. **Category-Subtype Validation**: Subtype must be valid for selected category
3. **Recipient Requirements**: Based on subtype-specific rules (see table above)
4. **Status Validation**: Status must be valid for selected subtype
5. **Date Validation**: Subtype-specific date validation rules

#### 7.6.2 Status Management Rules
1. **Default Status**: All new transactions start with first status in their subtype's status list
2. **Status Transitions**: Subtype-specific allowed transitions
3. **Balance Impact**: Only certain statuses affect account balance (see subtype rules)
4. **Date-Status Consistency**: Dates must be consistent with status values

#### 7.6.3 Subtype-Specific Business Rules

**Credit Transactions:**
1. **Deposit**: Increases balance only when status = "Deposited"
2. **Transfer**: Increases balance only when status = "Transferred" 
3. **Settlement**: Increases balance only when status = "Settled"
4. **Cheque**: Increases balance only when status = "Cleared"

**Debit Transactions:**
1. **Cheque**: Decreases balance only when status = "Cleared"
2. **Bank Charge**: Decreases balance only when status = "Debited"
3. **NEFT/IMPS/RTGS/UPI**: Decreases balance only when status = "Transferred"

#### 7.6.4 Inter-Account Transfer Logic (UPDATED)
1. **Source Account Transaction**: User creates debit transfer in source account
2. **Automatic Acknowledgment**: System automatically creates corresponding credit transfer in destination account
3. **Linked Transactions**: Both transactions reference the same recipient (which represents the destination account)
4. **Status Synchronization**: 
   - Source account: Status = "Transferred" when transfer completes
   - Destination account: Status = "Received" when acknowledgment is auto-created
5. **Balance Coordination**: 
   - Source account balance decreases when status = "Transferred"
   - Destination account balance increases when status = "Received"
6. **Transaction Relationship**: Both transactions maintain reference to the same recipient but belong to different parent accounts

### 7.7 Relationships

#### 7.7.1 Account Relationship
- **Type**: One-to-Many (One account has many transactions)
- **Constraint**: parentAccountId must reference existing active account
- **Cascade**: When account is deleted, transactions are archived (not deleted)

#### 7.7.2 Recipient Relationship
- **Type**: One-to-Many (One recipient can have multiple transactions across different accounts)
- **Constraint**: recipientId must reference existing recipient
- **Business Logic**: Recipient must be associated with the parentAccount via junction table
- **Cascade**: When recipient is deleted, existing transactions retain recipient data

#### 7.7.3 Transaction Details Relationship
- **Type**: One-to-One (Each transaction has one detail record based on subtype)
- **Implementation**: Separate tables for each transaction subtype detail
- **Cascade**: When transaction is deleted, details are also deleted

### 7.8 UI Requirements (WIZARD-BASED)

#### 7.8.1 Transaction Creation Wizard
**Wizard Trigger:** "Add Transaction" button navigates to multi-step wizard

**Step 1: Transaction Category & Subtype Selection**
- **Transaction Category** (radio buttons: "Credit" and "Debit")
- **Transaction Subtype** (dynamic dropdown based on selected category)
  - Credit options: Deposit, Transfer, Settlement, Cheque
  - Debit options: Cheque, Bank Charge, NEFT, IMPS, RTGS, UPI
- **Next Button** to proceed to Step 2

**Step 2: Common Information**
- **Amount** (numeric input, 2 decimal places, required)
- **Description** (textarea, optional, free text)
- **Recipient Selection** (conditional dropdown based on subtype)
  - Show only if subtype requires recipient
  - "Add New Recipient" option available
  - Display recipient type and details
- **Next Button** to proceed to Step 3

**Step 3: Subtype-Specific Details**
- **Dynamic form fields** based on selected subtype:
  - Date fields specific to each subtype (e.g., Date of Deposit, Date of Transfer)
  - Status selection with subtype-specific values
  - Additional fields per subtype requirements (e.g., Transfer Mode, Bank Charge Type)
- **Real-time validation** based on subtype rules
- **Status-date validation** enforcement
- **Next Button** to proceed to Step 4

**Step 4: Creation Summary**
- **Review Section:** Display all entered information for final review:
  - Transaction Category (Credit/Debit)
  - Transaction Subtype
  - Amount and Description
  - Recipient (if applicable)
  - All subtype-specific fields and their values
  - Selected status
- **Editable Access:** All fields remain editable with "Back" button navigation
- **Save Button** to create the transaction with all details
- **Back Button** to modify any details in previous steps

#### 7.8.2 Wizard Navigation & Flow
**Navigation Structure:**
```
Step 1: Category & Subtype → Step 2: Common Info → Step 3: Specific Details → Step 4: Summary
     ↑_________________________Back Navigation Available_________________________↑
```

**Wizard Behavior:**
- Each step validates required fields before allowing "Next"
- Back navigation preserves entered data
- Step 4 summary shows complete transaction preview
- Save only available in Step 4 after full review

#### 7.8.3 Field Positioning & Style
**Consistent with Current Wizard Design:**
- Multi-step wizard layout and navigation
- Form field styling and positioning
- Step indicators and progress bar
- Save/back/next button placement

**Updated Elements:**
- Step 1: Credit/Debit radio buttons + dynamic subtype dropdown
- Step 3: Dynamic field display based on subtype selection
- Step 4: Comprehensive summary with all transaction details

### 7.9 Validation Rules

#### 7.9.1 Data Validation
1. **Amount**: Positive decimal with max 2 decimal places, minimum 0.01
2. **Reference Numbers**: Alphanumeric with hyphens and underscores only
3. **Description**: Maximum 500 characters, no special characters except basic punctuation
4. **Account Numbers**: Numeric only, length validation based on bank standards
5. **IFSC Codes**: 11 characters, specific format validation
6. **UPI IDs**: Valid UPI format validation
7. **Cheque Numbers**: Alphanumeric, maximum 20 characters

#### 7.9.2 Business Logic Validation
1. **Duplicate Prevention**: Same amount, recipient, and date within 5 minutes
2. **Balance Checking**: Sufficient balance for debit transactions
3. **Account Status**: Can only transact with active accounts
4. **Recipient Status**: Can only transact with active recipients
5. **Date Range**: Transaction date within acceptable business range
6. **Transfer Limits**: Daily/monthly transaction limits per account type

---

## 8. OBJECT RELATIONSHIPS

### 8.1 Complete System Architecture (UPDATED)

The financial management system follows a hierarchical nested architecture with three core entities:

```
ACCOUNTS (Root Level)
    ↓ One-to-Many
RECIPIENTS (Second Level - via Junction Table for Many-to-Many)
    ↓ One-to-Many  
TRANSACTIONS (Third Level - Each transaction belongs to ONE account and ONE recipient)
    ↓ One-to-One
TRANSACTION DETAILS (Fourth Level - Subtype Specific)
```

**Key Relationships:**
- **Accounts ↔ Recipients**: Many-to-Many via Junction Table
- **Accounts ↔ Transactions**: One-to-Many (via parentAccountId)
- **Recipients ↔ Transactions**: One-to-Many (one recipient can have transactions in multiple accounts)

### 8.2 Detailed Relationship Mapping

#### 8.2.1 Account ↔ Recipients Relationship
- **Type**: Many-to-Many via Junction Table `account_recipients`
- **Business Logic**: 
  - One account can have multiple recipients
  - One recipient can be associated with multiple accounts
  - Junction table manages the relationships
  - Auto-recipient creation for inter-account transfers
- **Database Implementation**:
  ```sql
  accounts (id, accountName, ...)
  recipients (id, recipientName, ...)
  account_recipients (accountId, recipientId, createdAt)
  ```

#### 8.2.2 Account ↔ Transactions Relationship (UPDATED)
- **Type**: One-to-Many (One account has many transactions)
- **Business Logic**:
  - Every transaction belongs to exactly one parent account (via parentAccountId)
  - Account balance is calculated from its own transaction history
  - Each transaction also references one recipient (who may appear in multiple accounts)
- **Database Implementation**:
  ```sql
  transactions (id, parentAccountId, recipientId, amount, status, ...)
  FOREIGN KEY (parentAccountId) REFERENCES accounts(id)
  FOREIGN KEY (recipientId) REFERENCES recipients(id)
  ```

#### 8.2.3 Recipients ↔ Transactions Relationship (UPDATED)
- **Type**: One-to-Many (One recipient can have multiple transactions across different accounts)
- **Business Logic**:
  - Each transaction belongs to one recipient and one parent account
  - Same recipient can have transactions in multiple accounts
  - Recipient must be associated with the parent account via junction table
  - For inter-account transfers: Both source and destination transactions reference the same recipient
- **Database Implementation**:
  ```sql
  transactions (id, parentAccountId, recipientId, ...)
  -- Recipient can appear in transactions across multiple accounts
  -- Junction table ensures recipient is associated with parent account
  ```

#### 8.2.4 Transactions ↔ Transaction Details Relationship
- **Type**: One-to-One (Each transaction has one detail record based on type)
- **Business Logic**:
  - Different detail tables for each transaction type
  - Transaction type determines which detail table to use
  - Cascading: Transaction deletion removes detail records
- **Database Implementation**:
  ```sql
  cash_deposit_details (transactionId, ...)
  bank_transfer_details (transactionId, bankName, accountNumber, ...)
  account_transfer_details (transactionId, targetAccountId, ...)
  online_transfer_details (transactionId, platformType, reference, ...)
  cheque_transaction_details (transactionId, chequeNumber, ...)
  bank_charge_details (transactionId, chargeType, ...)
  ```

### 8.3 Business Rules for Relationships

#### 8.3.1 Data Integrity Rules
1. **Orphaned Data Prevention**: Foreign key constraints prevent orphaned records
2. **Balance Consistency**: Account balance must equal sum of completed transaction amounts
3. **Recipient Association**: Transactions can only use recipients associated with source account
4. **Status Consistency**: Transaction details cannot exist without parent transaction

#### 8.3.2 Cascading Delete Rules
1. **Account Deletion**: 
   - Archives all transactions (sets account_id to null)
   - Removes account-recipient junction entries
   - Preserves transaction history for audit
   
2. **Recipient Deletion**:
   - Retains existing transaction data
   - Removes account-recipient junction entries
   - Prevents new transactions with deleted recipient
   
3. **Transaction Deletion**:
   - Deletes associated transaction detail record
   - Updates account balance if transaction was COMPLETED
   - Maintains data consistency

#### 8.3.3 Auto-Creation Rules
1. **Inter-Account Recipients**: When an account is created, auto-create recipient of type "Account"
2. **Junction Entries**: Auto-create junction table entries for auto-generated recipients
3. **Balance Initialization**: Set currentBalance to openingBalance for new accounts

### 8.4 Query Patterns

#### 8.4.1 Common Query Scenarios
1. **Account Dashboard**: Get account with current balance and recent transactions
2. **Recipient Management**: Get all recipients for specific account via junction table
3. **Transaction History**: Get transactions with account and recipient details
4. **Balance Calculation**: Sum completed transactions for account balance
5. **Cross-Account Reporting**: Use junction table for multi-account recipient analysis

#### 8.4.2 Performance Considerations
1. **Indexes**: Create indexes on foreign keys and frequently queried fields
2. **Junction Table**: Index on both accountId and recipientId for fast lookups
3. **Transaction Queries**: Index on accountId, transactionDate, and status
4. **Balance Queries**: Consider materialized views for real-time balance calculations

### 8.5 Data Flow

#### 8.5.1 Transaction Creation Flow
1. User selects source account → System validates account status
2. User selects recipient → System validates recipient association via junction table
3. User enters transaction details → System validates based on transaction type
4. System creates transaction record → System creates type-specific detail record
5. On completion → System updates account currentBalance

#### 8.5.2 Inter-Account Transfer Flow (UPDATED for Correct Relationship)
1. **Setup**: User creates Account A → System auto-creates Recipient "Account A"
2. **Setup**: User creates Account B → System auto-creates Recipient "Account B" 
3. **Junction Links**: 
   - Account A ↔ Recipient "Account B" (enables A to transfer to B)
   - Account B ↔ Recipient "Account A" (enables B to transfer to A)
4. **Source Transaction**: User initiates transfer via wizard in Account A:
   - **Step 1:** Category = "Debit", Subtype = "NEFT/IMPS/RTGS/UPI"
   - **Step 2:** Amount, Recipient = "Account B"  
   - **Step 3:** Date of Transfer, Status
   - **Step 4:** Review and save
5. **Source Creation**: System creates transaction:
   ```
   Transaction {
     parentAccountId: Account A,
     recipientId: Recipient "Account B",
     category: DEBIT,
     subtype: UPI,
     status: "Transferred"
   }
   ```
6. **Automatic Acknowledgment**: System auto-creates corresponding transaction in Account B:
   ```
   Transaction {
     parentAccountId: Account B,
     recipientId: Recipient "Account B" (same recipient!),
     category: CREDIT,
     subtype: TRANSFER,
     status: "Received"
   }
   ```
7. **Balance Coordination**: 
   - Account A balance decreases (debit transaction)
   - Account B balance increases (credit transaction)

**Key Insight**: Both transactions reference the same recipient ("Account B") but belong to different parent accounts, creating a linked pair for complete inter-account transfer tracking.

This comprehensive relationship structure ensures data integrity, supports complex financial operations, and maintains clear separation of concerns while enabling flexible financial management workflows.
