// API utility for accounts

export interface Account {
  id: number;
  account_name: string;
  account_type: string;
  bank_name?: string;
  account_number?: string;
  opening_balance?: number;
}

export interface AddAccountPayload {
  account_name: string;
  account_type: string;
  bank_name?: string;
  account_number?: string;
  opening_balance?: number;
}

export async function addAccount(payload: AddAccountPayload): Promise<Account> {
  const res = await fetch('http://localhost:3000/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add account');
  return res.json();
}

export async function getAccounts(): Promise<Account[]> {
  const res = await fetch('http://localhost:3000/accounts');
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}
