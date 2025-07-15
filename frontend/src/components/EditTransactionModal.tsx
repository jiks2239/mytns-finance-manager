import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
// ...existing code...

const API_BASE = "http://localhost:3000";

interface Transaction {
  id: string | number;
  transaction_type: string;
  amount: number;
  transaction_date?: string;
  date?: string;
  description?: string;
  status: string;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
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

type EditTransactionFormData = {
  transaction_type: string;
  amount: number;
  date: string;
  description: string;
  status: string;
};

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
    formState: { errors, isSubmitting },
  } = useForm<EditTransactionFormData>({
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

  const onSubmit = async (data: EditTransactionFormData) => {
    try {
      const payload = {
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Error updating transaction");
      }
    }
  };
  return (
    <div className="add-account-modalv2-overlay" role="dialog" aria-modal="true">
      <form className="add-account-modalv2-form common-modal-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="add-account-modalv2-header common-modal-header">
          <span className="add-account-modalv2-title common-modal-title">Edit Transaction</span>
          <button
            className="add-account-modal-close small-close-btn"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >&#10005;</button>
        </div>
        <div className="form-group">
          <label htmlFor="transaction_type">Transaction Type</label>
          <input
            type="text"
            id="transaction_type"
            value={transaction.transaction_type}
            disabled
            readOnly
            className="common-modal-readonly-bg"
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
        <div className="add-account-modalv2-actions common-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTransactionModal;
