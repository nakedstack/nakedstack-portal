// ============================================================
// DiffReview — componente condiviso per la review delle modifiche
// prodotte dagli agenti (enrichment, inline expand, ecc.).
// Mostra paragrafi aggiunti/rimossi/modificati evidenziati.
// I paragrafi 'modified' mostrano un diff a livello di parola.
// ============================================================

'use client';

import { renderFormattedParagraph } from '@/lib/render-utils';
import type { DiffSegment, WordDiffToken } from '@/lib/diff';

interface DiffReviewProps {
  diff: DiffSegment[];
  onDone: () => void;
}

export default function DiffReview({ diff, onDone }: DiffReviewProps) {
  return (
    <>
      <div className="enrich-diff__bar">
        <span className="enrich-diff__legend">
          <span className="enrich-diff__swatch enrich-diff__swatch--added" />
          <span>aggiunte</span>
          <span className="enrich-diff__swatch enrich-diff__swatch--removed" />
          <span>rimosse</span>
          <span className="enrich-diff__swatch enrich-diff__swatch--modified" />
          <span>modificate</span>
        </span>
        <button
          className="enrich-diff__done"
          onClick={onDone}
          title="Accetta le modifiche"
        >
          Fatto
        </button>
      </div>
      <div className="enrich-diff__body">
        {diff.map((seg, i) => {
          if (seg.type === 'equal') {
            return (
              <div key={i} className="result-block">
                {renderFormattedParagraph(seg.value, i)}
              </div>
            );
          }
          if (seg.type === 'added') {
            return (
              <div key={i} className="result-block result-block--added">
                {renderFormattedParagraph(seg.value, i)}
              </div>
            );
          }
          if (seg.type === 'removed') {
            return (
              <div key={i} className="result-block result-block--removed">
                {renderFormattedParagraph(seg.value, i)}
              </div>
            );
          }
          if (seg.type === 'modified' && seg.wordDiff) {
            return (
              <div key={i} className="result-block result-block--modified">
                <WordDiffView tokens={seg.wordDiff} />
              </div>
            );
          }
          return null;
        })}
      </div>
    </>
  );
}

// ---- Word-level diff renderer ----

function WordDiffView({ tokens }: { tokens: WordDiffToken[] }) {
  return (
    <p className="word-diff">
      {tokens.map((token, i) => {
        if (token.type === 'added') {
          return <mark key={i} className="word-diff__added">{token.value}</mark>;
        }
        if (token.type === 'removed') {
          return <del key={i} className="word-diff__removed">{token.value}</del>;
        }
        return <span key={i}>{token.value}</span>;
      })}
    </p>
  );
}
