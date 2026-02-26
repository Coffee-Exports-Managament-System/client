"use client";

import { useEffect } from "react";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isSubmitting = false,
  onConfirm,
  onCancel,
}: Props): React.JSX.Element | null {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="confirm-modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!isSubmitting) {
          onCancel();
        }
      }}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="confirm-modal-title">{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="ghost" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </button>
          <button type="button" className="danger" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
