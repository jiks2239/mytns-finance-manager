// Centralized API client for all backend calls

const API_BASE = 'http://localhost:3000';

// Helper function for making API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    // Try to get the error message from the response body
    try {
      const errorData = await response.json();
      // If the backend returns a message field, use that; otherwise fall back to status text
      const message = errorData.message || `API Error: ${response.status} ${response.statusText}`;
      throw new Error(message);
    } catch (parseError) {
      // Only catch JSON parsing errors, not the Error we just threw
      if (parseError instanceof SyntaxError) {
        // If we can't parse the error response, fall back to status text
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      // Re-throw our custom error message
      throw parseError;
    }
  }

  // Handle empty responses (like DELETE operations)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}

// ========================
// TYPE DEFINITIONS
// ========================

export interface Account {
  id: number;
  account_name: string;
  account_type: string;
  bank_name?: string;
  account_number?: string;
  opening_balance?: number;
  current_balance?: number;
}

export interface CreateAccountPayload {
  account_name: string;
  account_type: string;
  bank_name?: string;
  account_number?: string;
  opening_balance?: number;
}

export interface UpdateAccountPayload {
  account_name?: string;
  account_type?: string;
  bank_name?: string;
  account_number?: string;
  opening_balance?: number;
}

export interface Transaction {
  id: number;
  account_id: number;
  recipient_id?: number;
  transaction_type: string;
  transaction_direction: string;
  amount: number;
  status: string;
  description?: string;
  transaction_date: string;
  reference_number?: string;
  created_at: string;
  updated_at: string;
  // Parent-child relationship for account transfers
  parent_transaction_id?: number;
  parent_transaction?: Transaction;
  // Related entities
  recipient?: Recipient;
  to_account?: Account;
  // Transaction detail fields will vary based on type
  bank_charge_details?: Record<string, unknown>;
  cheque_details?: Record<string, unknown>;
  online_transfer_details?: Record<string, unknown>;
  upi_settlement_details?: Record<string, unknown>;
  account_transfer_details?: Record<string, unknown>;
  bank_transfer_details?: Record<string, unknown>;
  cash_deposit_details?: Record<string, unknown>;
}

export interface CreateTransactionPayload {
  account_id: number;
  recipient_id?: number;
  transaction_type: string;
  transaction_direction: string;
  amount: number;
  status: string;
  description?: string;
  transaction_date: string;
  reference_number?: string;
  bank_charge_details?: Record<string, unknown>;
  cheque_details?: Record<string, unknown>;
  online_transfer_details?: Record<string, unknown>;
  upi_settlement_details?: Record<string, unknown>;
  account_transfer_details?: Record<string, unknown>;
  bank_transfer_details?: Record<string, unknown>;
  cash_deposit_details?: Record<string, unknown>;
}

export interface UpdateTransactionPayload {
  account_id?: number;
  recipient_id?: number;
  transaction_type?: string;
  transaction_direction?: string;
  amount?: number;
  status?: string;
  description?: string;
  transaction_date?: string;
  reference_number?: string;
}

export interface Recipient {
  id: number;
  name: string;
  recipient_type: string;
  account_id?: number;
  bank_account_no?: string;
  ifsc_code?: string;
  upi_id?: string;
  notes?: string;
}

export interface CreateRecipientPayload {
  name: string;
  recipient_type: string;
  account_id?: number;
  bank_account_no?: string;
  ifsc_code?: string;
  upi_id?: string;
  notes?: string;
}

export interface UpdateRecipientPayload {
  name?: string;
  recipient_type?: string;
  account_id?: number;
  bank_account_no?: string;
  ifsc_code?: string;
  upi_id?: string;
  notes?: string;
}

export interface AccountBalance {
  id: number;
  balance: number;
}

// ========================
// ACCOUNTS API
// ========================

export const accountsApi = {
  // Get all accounts
  getAll: (): Promise<Account[]> => 
    apiRequest<Account[]>('/accounts'),

  // Get account by ID
  getById: (id: number): Promise<Account> => 
    apiRequest<Account>(`/accounts/${id}`),

  // Create new account
  create: (payload: CreateAccountPayload): Promise<Account> => 
    apiRequest<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Update account
  update: (id: number, payload: UpdateAccountPayload): Promise<Account> => 
    apiRequest<Account>(`/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Delete account
  delete: (id: number): Promise<void> => 
    apiRequest<void>(`/accounts/${id}`, {
      method: 'DELETE',
    }),

  // Get account balance
  getBalance: (id: number): Promise<AccountBalance> => 
    apiRequest<AccountBalance>(`/accounts/${id}/balance`),

  // Get account transactions
  getTransactions: (id: number): Promise<Transaction[]> => 
    apiRequest<Transaction[]>(`/accounts/${id}/transactions`),

  // Get recipients for transactions (filtered by account)
  getRecipientsForTransactions: (id: number): Promise<Recipient[]> => 
    apiRequest<Recipient[]>(`/accounts/${id}/recipients/for-transactions`),

  // Get global pending transactions count
  getPendingTransactionsCount: (): Promise<{ pendingCount: number }> => 
    apiRequest<{ pendingCount: number }>('/accounts/pending-transactions/count'),

  // Get pending transactions count for a specific account
  getPendingTransactionsCountByAccount: (id: number): Promise<{ pendingCount: number }> => 
    apiRequest<{ pendingCount: number }>(`/accounts/${id}/pending-transactions/count`),
};

// ========================
// TRANSACTIONS API
// ========================

export const transactionsApi = {
  // Get transaction by ID
  getById: (id: number): Promise<Transaction> => 
    apiRequest<Transaction>(`/transactions/${id}`),

  // Create new transaction
  create: (payload: CreateTransactionPayload): Promise<Transaction> => 
    apiRequest<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Update transaction
  update: (id: number, payload: UpdateTransactionPayload): Promise<Transaction> => 
    apiRequest<Transaction>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Delete transaction
  delete: (id: number): Promise<void> => 
    apiRequest<void>(`/transactions/${id}`, {
      method: 'DELETE',
    }),

  // Get transactions for account (with pagination support)
  getByAccount: (accountId: number, page?: number, limit?: number): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<Transaction[]>(endpoint);
  },

  // Get all transactions (for account without specifying account ID in URL)
  getAll: (): Promise<Transaction[]> => 
    apiRequest<Transaction[]>('/transactions'),

  // Search transactions with filters
  search: (filters: Record<string, string | number | boolean>): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const queryString = params.toString();
    return apiRequest<Transaction[]>(`/transactions${queryString ? `?${queryString}` : ''}`);
  },
};

// ========================
// RECIPIENTS API
// ========================

export const recipientsApi = {
  // Get recipients by account ID
  getByAccountId: (accountId: number): Promise<Recipient[]> => 
    apiRequest<Recipient[]>(`/recipients?account_id=${accountId}`),

  // Get recipient by ID
  getById: (id: number): Promise<Recipient> => 
    apiRequest<Recipient>(`/recipients/${id}`),

  // Create new recipient
  create: (payload: CreateRecipientPayload): Promise<Recipient> => 
    apiRequest<Recipient>('/recipients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Update recipient
  update: (id: number, payload: UpdateRecipientPayload): Promise<Recipient> => 
    apiRequest<Recipient>(`/recipients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Delete recipient
  delete: (id: number): Promise<void> => 
    apiRequest<void>(`/recipients/${id}`, {
      method: 'DELETE',
    }),
};

// ========================
// UNIFIED API OBJECT
// ========================

export const api = {
  accounts: accountsApi,
  transactions: transactionsApi,
  recipients: recipientsApi,
};

// Export default for convenience
export default api;

// Also export the old interface for backward compatibility during migration
export type { Account as AccountType, CreateAccountPayload as AddAccountPayload };
export { accountsApi as accounts };
