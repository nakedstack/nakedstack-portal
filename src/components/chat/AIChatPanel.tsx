'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { X, PaperPlaneRight, Check, Trash } from '@phosphor-icons/react';
import { BlockPreview } from './BlockPreview';
import type { ChatAdapter } from './types';
import type { AIAction } from '@/lib/types/ai';

interface Props {
  adapter: ChatAdapter;
  onClose: () => void;
}

const ACTION_LABELS: Record<AIAction, string> = {
  chat: 'Chat',
  generate: 'Genera',
  append: 'Aggiungi',
  rewrite: 'Riscrivi',
  rewrite_selection: 'Selezione',
};

/**
 * AI Chat Panel — docked to the right of the page editor.
 * Single Responsibility: renders the AI panel UI only.
 * Depends on ChatAdapter abstraction (DIP).
 */
export function AIChatPanel({ adapter, onClose }: Props) {
  const {
    history, isLoading, send,
    placeholder, emptyHint,
    pendingOps = [], applyOps, discardOps,
    currentAction = 'chat', setAction,
  } = adapter;

  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    send(trimmed);
    setInput('');
  }, [input, isLoading, send]);

  const hasPending = pendingOps.length > 0 && pendingOps.some(op => op.blocks.length > 0);

  return (
    <div className="ai-chat-panel">
      {/* Header */}
      <div className="ai-chat-panel__header">
        <span className="ai-chat-panel__title">AI Assistant</span>
        <button className="ai-chat-panel__close" onClick={onClose} aria-label="Chiudi pannello AI">
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Action mode selector */}
      {setAction && (
        <div className="ai-chat-panel__actions-bar" role="group" aria-label="Modalità AI">
          {(Object.keys(ACTION_LABELS) as AIAction[])
        .filter(a => a !== 'rewrite_selection') // azione interna, non selezionabile dall'utente
        .map(action => (
            <button
              key={action}
              className={`ai-action-btn${currentAction === action ? ' ai-action-btn--active' : ''}`}
              onClick={() => setAction(action)}
              aria-pressed={currentAction === action}
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      )}

      {/* Message history */}
      <div className="ai-chat-panel__messages">
        {history.length === 0 && !isLoading && (
          <p className="ai-chat-panel__empty">{emptyHint}</p>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`ai-chat-panel__msg ai-chat-panel__msg--${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="ai-chat-panel__msg ai-chat-panel__msg--assistant ai-chat-panel__msg--loading">
            Elaborando…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Block preview + apply/discard */}
      {hasPending && (
        <div className="ai-apply-bar">
          <BlockPreview ops={pendingOps} />
          <div className="ai-apply-bar__buttons">
            <button
              className="ai-apply-btn"
              onClick={applyOps}
              disabled={isLoading}
              aria-label="Applica blocchi alla pagina"
            >
              <Check size={14} weight="bold" />
              Applica
            </button>
            <button
              className="ai-discard-btn"
              onClick={discardOps}
              disabled={isLoading}
              aria-label="Scarta modifiche"
            >
              <Trash size={14} />
              Scarta
            </button>
          </div>
        </div>
      )}

      {/* Input form */}
      <form className="ai-chat-panel__form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="ai-chat-panel__input"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
          autoComplete="off"
          aria-label={placeholder}
        />
        <button
          type="submit"
          className="ai-chat-panel__send"
          disabled={isLoading || !input.trim()}
          aria-label="Invia"
        >
          <PaperPlaneRight size={16} weight="duotone" />
        </button>
      </form>
    </div>
  );
}
