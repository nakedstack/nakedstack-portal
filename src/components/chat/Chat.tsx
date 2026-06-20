// ============================================================
// Chat — Componente presentazionale unico e condiviso (SRP)
// ------------------------------------------------------------
// Identico ovunque. Non conosce il contesto: dipende solo da
// un ChatAdapter iniettato (DIP). Cambia solo il contenitore.
// ============================================================

'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { PaperPlaneRight } from '@phosphor-icons/react';
import FormattedText from '@/components/concept-map/FormattedText';
import type { ChatAdapter } from './types';

export interface ChatProps {
  adapter: ChatAdapter;
  /** Classe extra opzionale sul container */
  className?: string;
}

export default function Chat({ adapter, className }: ChatProps) {
  const { history, isLoading, isEnriching, placeholder, emptyHint, send, onKeywordClick } = adapter;
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={`chat${className ? ` ${className}` : ''}`}>
      <div className="chat__messages">
        {history.length === 0 && !isLoading && (
          <p className="chat__empty">{emptyHint}</p>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`chat__msg chat__msg--${msg.role}`}>
            <FormattedText text={msg.content} onKeywordClick={onKeywordClick} />
          </div>
        ))}
        {isLoading && (
          <div className="chat__msg chat__msg--assistant chat__msg--pending">
            Scrivendo…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {isEnriching && (
        <div className="chat__enriching" role="status" aria-live="polite">
          <span className="chat__enriching-dot" />
          Aggiornando la conoscenza…
        </div>
      )}

      <form className="chat__form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat__input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          aria-label={placeholder}
          autoComplete="off"
        />
        <button
          type="submit"
          className="chat__send"
          disabled={isLoading || !input.trim()}
          aria-label="Invia"
        >
          <PaperPlaneRight size={18} weight="duotone" />
        </button>
      </form>
    </div>
  );
}
