import React from "react";
// ...existing code...

interface CustomPopupProps {
  open: boolean;
  message: string;
  type?: "error" | "warning" | "info" | "success";
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const getColorClass = (type: string) => {
  switch (type) {
    case "error":
      return "custom-popup-error";
    case "warning":
      return "custom-popup-warning";
    case "success":
      return "custom-popup-success";
    default:
      return "custom-popup-info";
  }
};

const CustomPopup: React.FC<CustomPopupProps> = ({
  open,
  message,
  type = "info",
  onClose,
  onConfirm,
  confirmLabel = "Yes, Delete",
  cancelLabel = "Cancel",
}) => {
  if (!open) return null;
  return (
    <div className="custom-popup-overlay" onClick={onClose}>
      <div
        className={`custom-popup-card ${getColorClass(type)}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="custom-popup-title">
          {type === "error"
            ? "Error"
            : type === "warning"
            ? "Warning"
            : type === "success"
            ? "Success"
            : "Info"}
        </div>
        <div className="custom-popup-message">{message}</div>
        {onConfirm ? (
          <div className="custom-popup-actions">
            <button
              className={`custom-popup-btn custom-popup-btn-confirm ${getColorClass(type)}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
            <button
              className="custom-popup-btn custom-popup-btn-cancel"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          </div>
        ) : (
          <button
            className={`custom-popup-btn custom-popup-btn-confirm ${getColorClass(type)}`}
            onClick={onClose}
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomPopup;
