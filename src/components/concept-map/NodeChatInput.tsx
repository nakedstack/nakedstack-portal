// ============================================================
// NodeChatInput — Input chat per approfondire il nodo (SRP)
// ============================================================

'use client';

import { useState, useCallback } from 'react';

export interface NodeChatInputProps {
  /** Etichetta del nodo corrente (placeholder) */
  nodeLabel: string;
  /** Callback per inviare il messaggio */
  onSend: (message: string) => void;
  /** Se sta caricando */
  loading: boolean;
}

export default function NodeChatInput({ nodeLabel, onSend, loading }: NodeChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const msg = value.trim();
    if (!msg || loading) return;
    onSend(msg);
    setValue('');
  }, [value, loading, onSend]);

  return (
    <form className="ns-chat-input" onSubmit={handleSubmit}>
      <input
        className="ns-chat-field"
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={`Approfondisci "${nodeLabel}"...`}
        disabled={loading}
        autoComplete="off"
      />
      <button
        className="ns-chat-send"
        type="submit"
        disabled={!value.trim() || loading}
        title="Invia domanda"
      >
        →
      </button>
    </form>
  );
}
