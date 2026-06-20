// ============================================================
// FormattedText — Renderizza testo con [[termini]] evidenziati
// ============================================================

'use client';

import { useCallback } from 'react';

const KEYWORD_REGEX = /\[\[(.+?)\]\]/g;

export interface FormattedTextProps {
  text: string;
  /** Callback quando si clicca un [[termine]]. Se undefined, i termini non sono cliccabili. */
  onKeywordClick?: (term: string) => void;
}

/**
 * Trasforma `testo con [[termini chiave]]` in React nodes
 * dove i termini sono evidenziati e opzionalmente cliccabili.
 * Tronca al marker ---RELATED--- se presente.
 */
export default function FormattedText({ text, onKeywordClick }: FormattedTextProps) {
  const handleClick = useCallback((term: string) => {
    onKeywordClick?.(term);
  }, [onKeywordClick]);

  const clickable = !!onKeywordClick;

  // Tronca al marker ---RELATED---
  const displayText = text.split('---RELATED---')[0].trim();

  const parts = displayText.split(KEYWORD_REGEX);

  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          return clickable ? (
            <button
              key={i}
              className="ft-keyword"
              onClick={() => handleClick(part)}
              title={`Approfondisci "${part}"`}
            >
              {part}
            </button>
          ) : (
            <span key={i} className="ft-keyword ft-keyword--static">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
