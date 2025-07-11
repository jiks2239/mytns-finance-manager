import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AddRecipientModal from "../components/AddRecipientModal";
import "../css/AccountDetails.css";

const API_BASE = "http://localhost:3000";

const AccountRecipients: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<any[]>([]);
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);

  useEffect(() => {
    async function fetchRecipients() {
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
    }
    if (id && showRecipients) {
      fetchRecipients();
    }
  }, [id, addRecipientOpen, showRecipients]);

  return (
    <div className="account-details-bg">
      <div className="account-details-card" style={{ maxWidth: 600, margin: "32px auto" }}>
        <h2 style={{ marginBottom: 18, fontSize: 22, color: "#222" }}>Recipients</h2>
        <button
          className="btn-primary btn-blue"
          style={{ marginBottom: 18 }}
          onClick={() => setShowRecipients((v) => !v)}
        >
          {showRecipients ? "Hide Recipients" : "View Recipients"}
        </button>
        {showRecipients && (
          <>
            {recipients.length === 0 ? (
              <div style={{ color: "#888", textAlign: "center" }}>No recipients found.</div>
            ) : (
              <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                {recipients.map((r) => (
                  <li key={r.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                    <span style={{ color: "#666", marginLeft: 8, fontSize: 13 }}>
                      ({r.recipient_type})
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button
              className="btn-primary btn-green"
              style={{ marginTop: 18 }}
              onClick={() => setAddRecipientOpen(true)}
            >
              Add Recipient
            </button>
          </>
        )}
        <button
          className="account-details-back-btn btn-gray"
          style={{ marginTop: 24 }}
          onClick={() => navigate(`/accounts/${id}`)}
        >
          Back to Account
        </button>
      </div>
      <AddRecipientModal
        isOpen={addRecipientOpen}
        accountId={id!}
        onClose={() => setAddRecipientOpen(false)}
        onSuccess={() => setAddRecipientOpen(false)}
      />
    </div>
  );
};

export default AccountRecipients;
