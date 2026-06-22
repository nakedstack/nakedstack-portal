'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { MagicWand, TextAlignLeft, ArrowRight, ChatText, Check, X } from '@phosphor-icons/react';
import type { InlineAction } from '@/lib/hooks/useInlineAI';
import type { TextSelection } from '@/lib/hooks/useTextSelection';

interface Props {
  selection: TextSelection;
  isLoading: boolean;
  pendingText: string | null;
  onAction: (action: InlineAction, customPrompt?: string) => void;
  onApply: () => void;
  onDiscard: () => void;
}

const QUICK_ACTIONS: { action: InlineAction; label: string; icon: React.ReactNode }[] = [
  { action: 'improve',   label: 'Migliora',  icon: <MagicWand size={13} weight="duotone" /> },
  { action: 'summarize', label: 'Riassumi',  icon: <TextAlignLeft size={13} weight="duotone" /> },
  { action: 'continue',  label: 'Continua',  icon: <ArrowRight size={13} weight="bold" /> },
];

/** Calcola la posizione viewport-relative centrata sopra/sotto la selezione */
function computePosition(sel: TextSelection): { top: number; left: number; below: boolean } {
  const TOOLBAR_H = 44;
  const MARGIN = 8;
  const above = sel.top - TOOLBAR_H - MARGIN;
  const below = above < 10;
  return {
    top: below ? sel.bottom + MARGIN : above,
    left: Math.max(10, Math.min(sel.left + sel.width / 2, window.innerWidth - 10)),
    below,
  };
}

/**
 * Toolbar floating che appare sopra il testo selezionato.
 * Responsabilità unica: renderizzare le azioni AI sulla selezione.
 * Non gestisce stato API, non conosce blocchi specifici.
 */
export function SelectionToolbar({ selection, isLoading, pendingText, onAction, onApply, onDiscard }: Props) {
  const [showAsk, setShowAsk] = useState(false);
  const [askValue, setAskValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAsk) inputRef.current?.focus();
  }, [showAsk]);

  // Reset stato locale quando selezione cambia
  useEffect(() => {
    setShowAsk(false);
    setAskValue('');
  }, [selection.text]);

  function handleAsk(e: FormEvent) {
    e.preventDefault();
    const prompt = askValue.trim();
    if (!prompt) return;
    onAction('ask', prompt);
    setShowAsk(false);
    setAskValue('');
  }

  const { top, left } = computePosition(selection);

  return (
    <div
      className="selection-toolbar"
      style={{ top, left }}
      // Previene la perdita della selezione del browser al click sulla toolbar
      onMouseDown={e => e.preventDefault()}
    >
      {/* Azioni rapide */}
      {!isLoading && !pendingText && !showAsk && (
        <div className="selection-toolbar__row">
          {QUICK_ACTIONS.map(({ action, label, icon }) => (
            <button
              key={action}
              className="selection-toolbar__btn"
              onMouseDown={e => { e.preventDefault(); onAction(action); }}
            >
              {icon}
              {label}
            </button>
          ))}
          <div className="selection-toolbar__sep" />
          <button
            className="selection-toolbar__btn"
            onMouseDown={e => { e.preventDefault(); setShowAsk(true); }}
          >
            <ChatText size={13} weight="duotone" />
            Chiedi
          </button>
        </div>
      )}

      {/* Mini input "Chiedi all'AI" */}
      {!isLoading && !pendingText && showAsk && (
        <form className="selection-toolbar__ask" onSubmit={handleAsk}>
          <input
            ref={inputRef}
            className="selection-toolbar__ask-input"
            value={askValue}
            onChange={e => setAskValue(e.target.value)}
            placeholder="Cosa vuoi fare con questo testo?"
            onKeyDown={e => { if (e.key === 'Escape') { setShowAsk(false); setAskValue(''); } }}
          />
          <button type="submit" className="selection-toolbar__btn selection-toolbar__btn--icon" aria-label="Invia">
            <ArrowRight size={13} weight="bold" />
          </button>
          <button type="button" className="selection-toolbar__btn selection-toolbar__btn--icon" onMouseDown={e => { e.preventDefault(); setShowAsk(false); }}>
            <X size={13} />
          </button>
        </form>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="selection-toolbar__loading">
          <span className="selection-toolbar__spinner" aria-hidden />
          Generando…
        </div>
      )}

      {/* Anteprima + Apply/Discard */}
      {pendingText && !isLoading && (
        <div className="selection-toolbar__result">
          <span className="selection-toolbar__result-text">
            {pendingText.length > 160 ? `${pendingText.slice(0, 160)}…` : pendingText}
          </span>
          <div className="selection-toolbar__sep" />
          <button
            className="selection-toolbar__btn selection-toolbar__btn--apply"
            onMouseDown={e => { e.preventDefault(); onApply(); }}
          >
            <Check size={13} weight="bold" />
            Sostituisci
          </button>
          <button
            className="selection-toolbar__btn selection-toolbar__btn--discard"
            onMouseDown={e => { e.preventDefault(); onDiscard(); }}
          >
            <X size={13} />
            Scarta
          </button>
        </div>
      )}
    </div>
  );
}
