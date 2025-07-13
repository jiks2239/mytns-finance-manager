// API utility for accounts
export interface AddAccountPayload {
  account_name: string;
  account_type: string;
  bank_name?: string;
  account_number?: string;
  opening_balance?: number;
  recurring_amount?: number;
  pigmy_start_date?: string;
  total_days?: number;
}

export async function addAccount(payload: AddAccountPayload) {
  const res = await fetch('http://localhost:3000/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add account');
  return res.json();
}
