import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import "../css/AddTransactionModal.css";

const API_BASE = "http://localhost:3000";

type TransactionType =
  | "cheque"
  | "online"
  | "cash_deposit"
  | "internal_transfer"
  | "bank_charge"
  | "other";

type TransactionStatus =
  | "completed"
  | "pending"
  | "cancelled"
  | "failed"
  | "bounced";

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: any;
  onClose: () => void;
  onSuccess: () => void;
}

const TRANSACTION_STATUS_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
  { value: "bounced", label: "Bounced" },
];

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      transaction_type: transaction?.transaction_type || "",
      amount: transaction?.amount || 0,
      date: transaction?.transaction_date || transaction?.date || "",
      description: transaction?.description || "",
      status: transaction?.status || "completed",
    },
  });

  useEffect(() => {
    if (transaction) {
      reset({
        transaction_type: transaction.transaction_type || "",
        amount: transaction.amount || 0,
        date: transaction.transaction_date || transaction.date || "",
        description: transaction.description || "",
        status: transaction.status || "completed",
      });
    }
  }, [transaction, reset]);

  if (!isOpen || !transaction) return null;

  const onSubmit = async (data: any) => {
    try {
      const payload: any = {
        transaction_type: data.transaction_type,
        amount: data.amount,
        date: data.date,
        description: data.description,
        status: data.status,
      };
      const res = await fetch(`${API_BASE}/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update transaction");
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Error updating transaction");
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="add-transaction-modal">
        <div className="add-transaction-modal-header">
          <h2 className="add-transaction-modal-title">Edit Transaction</h2>
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
            <label htmlFor="transaction_type">Transaction Type</label>
            <input
              type="text"
              id="transaction_type"
              value={transaction.transaction_type}
              disabled
              readOnly
              style={{ background: "#f3f4f6" }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              {...register("amount", { required: true, valueAsNumber: true, min: 0.01 })}
            />
            {errors.amount && <span className="error">Amount is required and must be greater than zero.</span>}
          </div>
          <div className="form-group">
            <label htmlFor="date">Date</label>
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
            {errors.status && <span className="error">{typeof errors.status.message === "string" ? errors.status.message : "Status is required."}</span>}
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;
