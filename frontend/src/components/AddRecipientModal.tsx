import React, { useState } from "react";
import "../css/AddAccountModal.css";

const API_BASE = "http://localhost:3000";

interface AddRecipientModalProps {
  isOpen: boolean;
  accountId: string | number;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddRecipientModal: React.FC<AddRecipientModalProps> = ({
  isOpen,
  accountId,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [recipient_type, setRecipientType] = useState("customer"); // <-- use recipient_type
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setRecipientType("customer");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Recipient name is required.");
      return;
    }
    if (!recipient_type) {
      setError("Recipient type is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          recipient_type, // <-- send recipient_type
          account_id: accountId,
        }),
      });
      if (!res.ok) throw new Error("Failed to add recipient");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add recipient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-account-modal-overlay" role="dialog" aria-modal="true">
      <form className="add-account-modal-form" onSubmit={handleSubmit} style={{ minWidth: 320 }}>
        <div className="add-account-modal-header">
          <h2>Add Recipient</h2>
          <button
            className="add-account-modal-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >&#10005;</button>
        </div>
        <div className="form-group">
          <label htmlFor="recipient-name">Recipient Name<span aria-hidden="true">*</span></label>
          <input
            id="recipient-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="recipient-type">Recipient Type<span aria-hidden="true">*</span></label>
          <select
            id="recipient-type"
            value={recipient_type}
            onChange={e => setRecipientType(e.target.value)}
            required
          >
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="utility">Utility</option>
            <option value="employee">Employee</option>
            <option value="bank">Bank</option>
            <option value="other">Other</option>
          </select>
        </div>
        {error && <div className="add-account-modal-error">{error}</div>}
        <div className="add-account-modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading}>{loading ? "Saving..." : "Add Recipient"}</button>
        </div>
      </form>
    </div>
  );
};

export default AddRecipientModal;
