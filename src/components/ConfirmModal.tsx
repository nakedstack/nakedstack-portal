'use client';

import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' colora il bottone di conferma in rosso */
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modale di conferma condiviso.
 * Chiusura via Escape, click sull'overlay o bottone Annulla.
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  variant = 'default',
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus sul bottone Annulla all'apertura
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  // Chiusura con Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onCancel}
    >
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onCancel} aria-label="Chiudi">
            <X size={16} />
          </button>
        </div>

        {message && <p className="modal__message">{message}</p>}

        <div className="modal__actions">
          <button
            ref={cancelRef}
            className="modal__btn modal__btn--cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`modal__btn modal__btn--confirm${variant === 'danger' ? ' modal__btn--danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
