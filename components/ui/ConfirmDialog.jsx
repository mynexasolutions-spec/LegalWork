"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger = false, onConfirm, onClose }) {
  return (
    <Modal
      size="sm"
      title={title}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button
            autoFocus
            onClick={() => { onConfirm(); onClose(); }}
            className={`rounded-lg px-6 py-2.5 text-sm font-semibold text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-brand-dark"}`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        {danger && <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle size={22} /></span>}
        <p className="text-sm leading-relaxed text-slate-600">{message}</p>
      </div>
    </Modal>
  );
}
