import React, { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import "../css/AddTransactionModal.css";

const API_BASE = 'http://localhost:3000';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string | number;
  onSuccess?: () => void;
}

type TransactionType =
  | "cheque"
  | "online"
  | "cash_deposit"
  | "internal_transfer"
  | "bank_charge";

interface Recipient {
  id: string;
  name: string;
}

interface Account {
  id: string | number;
  name: string;
}

type FormValues = {
  transaction_type: TransactionType;
  recipient: string;
  amount: number;
  date: string;
  description: string;
  status: string; // <-- add status
  cheque_number: string;
  cheque_given_date: string;
  cheque_due_date: string;
  transfer_date: string;
  to_account_id: string;
  charge_type: string;
  charge_note: string;
};

const TRANSACTION_STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
  { value: "bounced", label: "Bounced" },
];

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onSuccess,
}) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientType, setRecipientType] = useState<string>("all");
  const [accounts, setAccounts] = useState<Account[]>([]); // <-- MISSING STATE

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormValues>({
    defaultValues: {
      transaction_type: "" as TransactionType,
      recipient: "",
      amount: 0,
      date: "",
      description: "",
      status: "", // <-- set default to empty string for status
      cheque_number: "",
      cheque_given_date: "",
      cheque_due_date: "",
      transfer_date: "",
      to_account_id: "",
      charge_type: "",
      charge_note: "",
    },
  });

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  useEffect(() => {
    // Fetch recipients from API
    let url = `${API_BASE}/recipients`;
    if (recipientType && recipientType !== 'all') {
      url += `?type=${recipientType}`;
    }
    fetch(url)
      .then(res => res.ok ? res.json() : [])
      .then(data => setRecipients(data))
      .catch(() => setRecipients([]));

    // Fetch accounts from API and ensure correct field for name
    fetch(`${API_BASE}/accounts`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch accounts");
        return res.json();
      })
      .then((data) => {
        setAccounts(
          data
            .filter((acc: any) => acc && acc.id && acc.account_name)
            .map((acc: any) => ({
              id: acc.id,
              name: acc.account_name,
            }))
        );
      })
      .catch(() => setAccounts([]));
  }, [accountId, recipientType]);

  const transaction_type = watch("transaction_type");
  const dateValue = watch("date");
  const statusValue = watch("status");

  // Validation: If date is in the past, status cannot be "pending"
  useEffect(() => {
    if (!dateValue || !statusValue) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const txDate = new Date(dateValue);
    txDate.setHours(0, 0, 0, 0);
    if (statusValue === "pending" && txDate < today) {
      setError("status", {
        type: "manual",
        message: "Cannot set status as Pending for a past date.",
      });
    } else {
      clearErrors("status");
    }
  }, [dateValue, statusValue, setError, clearErrors]);

  const onSubmit = async (data: FormValues) => {
    // transform data to submission format
    const submissionData: any = {
      transaction_type: data.transaction_type,
      amount: data.amount,
      account_id: accountId,
      transaction_date: data.date, // <-- use transaction_date for backend
      description: data.description || undefined,
      status: data.status,
    };
    if (data.recipient) {
      submissionData.recipient_id = data.recipient;
    }
    if (data.to_account_id) {
      submissionData.to_account_id = data.to_account_id;
    }
    if (transaction_type === "cheque") {
      submissionData.cheque_details = {
        cheque_number: data.cheque_number,
        cheque_given_date: data.cheque_given_date,
        cheque_due_date: data.cheque_due_date,
      };
    } else if (transaction_type === "online") {
      submissionData.online_transfer_details = {
        transfer_date: data.transfer_date,
      };
    } else if (transaction_type === "bank_charge") {
      submissionData.bank_charge_details = {
        charge_type: data.charge_type,
        narration: data.charge_note,
      };
    }
    // Remove this line to respect user-selected status:
    // submissionData.status = "completed";
    try {
      const response = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });
      if (!response.ok) throw new Error("Failed to add transaction");
      await response.json();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      alert("Error adding transaction: " + error);
    }
  };

  // Make sure to always render the modal if isOpen is true
  if (!isOpen) return null;

  // Helper to determine if recipient dropdown should show
  const showRecipientDropdown = ["cheque", "online"].includes(watch("transaction_type"));

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-transaction-title">
      <div className="add-transaction-modal">
        <div className="add-transaction-modal-header">
          <h2 className="add-transaction-modal-title">Add Transaction</h2>
          <button
            className="add-transaction-modal-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            &#10005;
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" noValidate>
          <div className="form-group">
            <label htmlFor="transaction_type">Transaction Type<span aria-hidden="true">*</span></label>
            <select
              id="transaction_type"
              {...register("transaction_type", { required: true })}
            >
              <option value="">-- Select --</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
              <option value="cash_deposit">Cash Deposit</option>
              <option value="internal_transfer">Internal Transfer</option>
              <option value="bank_charge">Bank Charge</option>
            </select>
            {errors.transaction_type && <span className="error">Transaction Type is required.</span>}
          </div>

          {showRecipientDropdown && (
            <div className="form-group">
              <label htmlFor="recipient-type">Recipient Type</label>
              <select
                id="recipient-type"
                value={recipientType}
                onChange={e => setRecipientType(e.target.value)}
                style={{ marginBottom: 8 }}
              >
                <option value="all">All</option>
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
                <option value="utility">Utility</option>
                <option value="employee">Employee</option>
                <option value="bank">Bank</option>
                <option value="other">Other</option>
              </select>
              <label htmlFor="recipient">Recipient<span aria-hidden="true">*</span></label>
              <select
                id="recipient"
                {...register("recipient", { required: true })}
                style={{ flex: 1 }}
              >
                <option value="">-- Select Recipient --</option>
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.recipient && <span className="error">Recipient is required.</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="amount">Amount<span aria-hidden="true">*</span></label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0"
              {...register("amount", { required: true, valueAsNumber: true, min: 0.01 })}
            />
            {errors.amount && <span className="error">Amount is required and must be greater than zero.</span>}
          </div>

          <div className="form-group">
            <label htmlFor="date">Date<span aria-hidden="true">*</span></label>
            <input
              type="date"
              id="date"
              {...register("date", { required: true })}
            />
            {errors.date && <span className="error">Date is required.</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <input
              type="text"
              id="description"
              {...register("description")}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status<span aria-hidden="true">*</span></label>
            <select
              id="status"
              {...register("status", { required: true })}
            >
              <option value="">-- Select --</option>
              {TRANSACTION_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.status && <span className="error">{errors.status.message || "Status is required."}</span>}
          </div>

          {transaction_type === "cheque" && (
            <>
              <div className="form-group">
                <label htmlFor="cheque_number">Cheque Number<span aria-hidden="true">*</span></label>
                <input
                  type="text"
                  id="cheque_number"
                  {...register("cheque_number", { required: true })}
                />
                {errors.cheque_number && <span className="error">Cheque Number is required.</span>}
              </div>
              <div className="form-group">
                <label htmlFor="cheque_given_date">Cheque Given Date<span aria-hidden="true">*</span></label>
                <input
                  type="date"
                  id="cheque_given_date"
                  {...register("cheque_given_date", { required: true })}
                />
                {errors.cheque_given_date && <span className="error">Cheque Given Date is required.</span>}
              </div>
              <div className="form-group">
                <label htmlFor="cheque_due_date">Cheque Due Date<span aria-hidden="true">*</span></label>
                <input
                  type="date"
                  id="cheque_due_date"
                  {...register("cheque_due_date", { required: true })}
                />
                {errors.cheque_due_date && <span className="error">Cheque Due Date is required.</span>}
              </div>
            </>
          )}

          {transaction_type === "online" && (
            <>
              <div className="form-group">
                <label htmlFor="transfer_date">Transfer Date<span aria-hidden="true">*</span></label>
                <input
                  type="date"
                  id="transfer_date"
                  {...register("transfer_date", { required: true })}
                />
                {errors.transfer_date && <span className="error">Transfer Date is required.</span>}
              </div>
            </>
          )}

          {transaction_type === "internal_transfer" && (
            <div className="form-group">
              <label htmlFor="to_account_id">To Account<span aria-hidden="true">*</span></label>
              <select
                id="to_account_id"
                {...register("to_account_id", { required: true })}
              >
                <option value="">-- Select Account --</option>
                {accounts
                  .filter((acc) => String(acc.id) !== String(accountId))
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </select>
              {errors.to_account_id && <span className="error">To Account is required.</span>}
            </div>
          )}

          {transaction_type === "bank_charge" && (
            <>
              <div className="form-group">
                <label htmlFor="charge_type">Charge Type<span aria-hidden="true">*</span></label>
                <input
                  type="text"
                  id="charge_type"
                  {...register("charge_type", { required: true })}
                />
                {errors.charge_type && <span className="error">Charge Type is required.</span>}
              </div>
              <div className="form-group">
                <label htmlFor="charge_note">Charge Note<span aria-hidden="true">*</span></label>
                <input
                  type="text"
                  id="charge_note"
                  {...register("charge_note", { required: true })}
                />
                {errors.charge_note && <span className="error">Charge Note is required.</span>}
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;