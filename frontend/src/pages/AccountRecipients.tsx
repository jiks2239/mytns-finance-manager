import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AddRecipientModal from "../components/AddRecipientModal";
import EditRecipientModal from "../components/EditRecipientModal";
import "../css/AccountDetails.css";

const API_BASE = "http://localhost:3000";

type Recipient = {
  id: string | number;
  name: string;
  recipient_type: string;
};

const AccountRecipients: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [editRecipient, setEditRecipient] = useState<Recipient | null>(null);
  const [error, setError] = useState<string>("");

  const fetchRecipients = async () => {
    try {
      const res = await fetch(`${API_BASE}/recipients?account_id=${id}`);
      if (!res.ok) {
        setRecipients([]);
        return;
      }
      const data = await res.json();
      setRecipients(data);
    } catch {
      setRecipients([]);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRecipients();
    }
    // eslint-disable-next-line
  }, [id, addRecipientOpen, editRecipient]);

  const handleDelete = async (recipientId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this recipient? This cannot be undone.")) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/recipients/${recipientId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Cannot delete recipient. It may have transactions.");
        return;
      }
      await fetchRecipients();
    } catch {
      setError("Failed to delete recipient.");
    }
  };

  return (
    <div className="account-details-bg">
      <div className="account-details-card common-maxw-600 common-mx-auto common-mt-32">
        <h2 className="account-summary-title">Recipients</h2>
        {error && <div className="add-account-modal-error common-modal-mb-12">{error}</div>}
        {recipients.length === 0 ? (
          <div className="transactions-empty-text">No recipients found.</div>
        ) : (
          <ul className="common-list-p0 common-list-none">
            {[...recipients]
              .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
              .map((r) => (
                <li key={r.id} className="common-py-8 common-border-b common-flex common-align-center common-justify-between">
                  <span>
                    <span className="common-fw-600">{r.name}</span>
                    <span className="common-ml-8 common-fs-13" style={{ color: "#666" }}>
                      ({r.recipient_type})
                    </span>
                  </span>
                  <span>
                    <button
                      className="common-action-btn edit common-mr-8 common-minw-60 common-h-32 common-fs-13"
                      onClick={() => setEditRecipient(r)}
                    >Edit</button>
                    <button
                      className="common-action-btn delete common-minw-60 common-h-32 common-fs-13"
                      onClick={() => handleDelete(r.id)}
                    >Delete</button>
                  </span>
                </li>
              ))}
          </ul>
        )}
        <button
          className="btn-primary btn-green common-modal-mt-18"
          onClick={() => setAddRecipientOpen(true)}
        >
          Add Recipient
        </button>
        <button
          className="account-details-back-btn btn-gray common-modal-mt-24"
          onClick={() => navigate(`/accounts/${id}`)}
        >
          Back to Account
        </button>
      </div>
      <AddRecipientModal
        isOpen={addRecipientOpen}
        accountId={Number(id)}
        name=""
        onClose={() => setAddRecipientOpen(false)}
        onRecipientAdded={fetchRecipients}
      />
      {editRecipient && (
        <EditRecipientModal
          isOpen={!!editRecipient}
          recipient={editRecipient}
          accountId={id!}
          onClose={() => setEditRecipient(null)}
          onSuccess={() => {
            setEditRecipient(null);
            fetchRecipients();
          }}
          existingRecipients={recipients}
        />
      )}
    </div>
  );
};

export default AccountRecipients;
