export interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  transaction_date?: string;
  date?: string;
  created_at?: string;
  description?: string;
  status: string; // <-- ensure this is always string, not string | undefined
}
