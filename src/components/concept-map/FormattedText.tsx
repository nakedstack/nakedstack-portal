// ============================================================
// FormattedText — Testo formattato: paragrafi, liste, grassetto,
// codice inline e [[termini]] cliccabili. Tronca a ---RELATED---.
// Delega il parsing markdown al renderer condiviso (render-utils),
// passando l'handler dei termini chiave (DRY + fix anti-freeze).
// ============================================================

'use client';

import { renderFormattedParagraph, splitIntoBlocks } from '@/lib/render-utils';

export interface FormattedTextProps {
  text: string;
  /** Callback quando si clicca un [[termine]]. Se undefined, naviga via exploreKeyword. */
  onKeywordClick?: (term: string) => void;
}

export default function FormattedText({ text, onKeywordClick }: FormattedTextProps) {
  // Tronca al marker ---RELATED--- e separa in paragrafi
  const displayText = text.split('---RELATED---')[0].trim();
  const paragraphs = splitIntoBlocks(displayText);

  if (paragraphs.length === 0) return null;

  return (
    <>
      {paragraphs.map((p, i) => (
        <div key={i} className="ft-block">
          {renderFormattedParagraph(p, i, onKeywordClick)}
        </div>
      ))}
    </>
  );
}
