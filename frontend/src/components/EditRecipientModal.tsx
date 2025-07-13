import React, { useState, useEffect } from "react";
import "../css/AddAccountModalV2.css";

const API_BASE = "http://localhost:3000";

interface EditRecipientModalProps {
  isOpen: boolean;
  recipient: { id: string | number; name: string; recipient_type: string };
  accountId: string | number;
  onClose: () => void;
  onSuccess?: () => void;
  existingRecipients: { id: string | number; name: string }[];
}

const EditRecipientModal: React.FC<EditRecipientModalProps> = ({
  isOpen,
  recipient,
  accountId,
  onClose,
  onSuccess,
  existingRecipients,
}) => {
  const [name, setName] = useState(recipient?.name || "");
  const [recipient_type, setRecipientType] = useState(recipient?.recipient_type || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && recipient) {
      setName(recipient.name);
      setRecipientType(recipient.recipient_type);
      setError("");
    }
  }, [isOpen, recipient]);

  if (!isOpen || !recipient) return null;

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
    // Duplicate name validation (case-insensitive, per account, excluding self)
    if (
      existingRecipients.some(
        (r) =>
          r.id !== recipient.id &&
          r.name.trim().toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      setError("A recipient with this name already exists.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/recipients/${recipient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          recipient_type,
          account_id: accountId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update recipient");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message || "Failed to update recipient");
      } else {
        setError("Failed to update recipient");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-account-modalv2-overlay" role="dialog" aria-modal="true">
      <form className="add-account-modalv2-form common-modal-form" onSubmit={handleSubmit}>
        <div className="add-account-modalv2-header common-modal-header">
          <span className="add-account-modalv2-title common-modal-title">Edit Recipient</span>
          <button
            className="add-account-modalv2-close small-close-btn"
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
        {error && <div className="add-account-modalv2-error">{error}</div>}
        <div className="add-account-modalv2-actions common-modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="primary-btn" disabled={loading}>{loading ? "Saving..." : "Update Recipient"}</button>
        </div>
      </form>
    </div>
  );
};

export default EditRecipientModal;
