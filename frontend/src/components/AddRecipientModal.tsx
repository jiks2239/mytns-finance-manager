import React, { useState } from "react";
import "../css/CommonModal.css";

const API_BASE = "http://localhost:3000";

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  id: number;
  onRecipientAdded: () => void;
}

const AddRecipientModal: React.FC<AddRecipientModalProps> = ({
  isOpen,
  onClose,
  name,
  id,
  onRecipientAdded,
}) => {
  const [recipientName, setRecipientName] = useState(name);
  const [recipientType, setRecipientType] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setRecipientName(name);
      setRecipientType("customer");
      setError("");
    }
  }, [isOpen, name]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setError("Recipient name is required.");
      return;
    }
    if (!recipientType) {
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
          name: recipientName.trim(),
          type: recipientType,
          accountId: id,
        }),
      });
      if (!res.ok) throw new Error("Failed to add recipient");
      onRecipientAdded();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message || "Failed to add recipient");
      } else {
        setError("Failed to add recipient");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="common-modal-overlay" role="dialog" aria-modal="true">
      <form className="common-modal-form" onSubmit={handleSubmit}>
        <div className="common-modal-header">
          <span className="common-modal-title">Add Recipient</span>
          <button
            className="common-modal-close"
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
            value={recipientName}
            onChange={e => setRecipientName(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="recipient-type">Recipient Type<span aria-hidden="true">*</span></label>
          <select
            id="recipient-type"
            value={recipientType}
            onChange={e => setRecipientType(e.target.value)}
            required
          >
            <option value="">-- Select --</option>
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="utility">Utility</option>
            <option value="employee">Employee</option>
            <option value="bank">Bank</option>
            <option value="other">Other</option>
          </select>
        </div>
        {error && <div className="add-account-modal-error">{error}</div>}
        <div className="common-modal-actions">
          <button type="submit" className="primary-btn" disabled={loading}>{loading ? "Saving..." : "Add Recipient"}</button>
          <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddRecipientModal;
