'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useExplore } from '@/lib/explore-context';
import { renderFormattedParagraph, splitIntoBlocks } from '@/lib/render-utils';
import DiffReview from '@/components/DiffReview';

// ---- Types ----

interface SelectionMenu {
  text: string;
  x: number;
  y: number;
  paragraphIndex: number;
  paragraphText: string;
}

// ---- Helpers ----

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- Component ----

export default function SearchResults() {
  const { results, language, detailLevel, enrichmentDiff, clearEnrichmentDiff, applyEnrichment, currentTopicId } = useExplore();
  const containerRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenu | null>(null);
  const [expandingIndex, setExpandingIndex] = useState<number | null>(null);

  const findParagraphIndex = useCallback((range: Range): number => {
    for (const [index, el] of paragraphRefs.current.entries()) {
      if (el.contains(range.commonAncestorContainer)) return index;
    }
    return -1;
  }, []);

  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelectionMenu(null);
        return;
      }

      const selectedText = sel.toString().trim();
      if (selectedText.length < 2 || selectedText.length > 120) {
        setSelectionMenu(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container?.contains(range.commonAncestorContainer)) {
        setSelectionMenu(null);
        return;
      }

      const pIndex = findParagraphIndex(range);
      if (pIndex < 0) { setSelectionMenu(null); return; }

      const paragraphs = splitIntoBlocks(results?.text || '');
      const currentText = paragraphs[pIndex] || '';

      const rect = range.getBoundingClientRect();
      setSelectionMenu({
        text: selectedText,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        paragraphIndex: pIndex,
        paragraphText: currentText,
      });
    }, 10);
  }, [results, findParagraphIndex]);

  const handleExpandInline = useCallback(async (menu: SelectionMenu, customInstruction?: string) => {
    setSelectionMenu(null);
    setExpandingIndex(menu.paragraphIndex);

    try {
      const body: Record<string, string> = {
        paragraph: menu.paragraphText,
        term: menu.text,
        language,
        detailLevel,
      };
      if (customInstruction) body.customInstruction = customInstruction;

      const res = await fetch('/api/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Expand failed');

      const data = await res.json();

      // Assicura che il termine selezionato sia marcato come [[keyword]]
      let expandedText: string = data.expanded;
      const marker = `[[${menu.text}]]`;
      if (!expandedText.includes(marker)) {
        expandedText = expandedText.replace(new RegExp(escapeRegex(menu.text), 'i'), marker);
      }

      // Calcola il nuovo testo completo sostituendo il paragrafo originale
      const newFullText = (results?.text || '').replace(menu.paragraphText, expandedText);

      // Applica tramite la stessa pipeline dell'enrichment (diff review + stato)
      applyEnrichment({ text: newFullText });

      // Persiste su DB se il topic e salvato (fire-and-forget)
      if (currentTopicId) {
        fetch('/api/topic-text', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topicId: currentTopicId, text: newFullText }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Expand error:', err);
    } finally {
      setExpandingIndex(null);
    }
  }, [language, detailLevel, results, applyEnrichment, currentTopicId]);

  useEffect(() => {
    if (!selectionMenu) return;
    const close = () => setSelectionMenu(null);
    document.addEventListener('click', close);
    document.addEventListener('scroll', close, { passive: true });
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('scroll', close);
    };
  }, [selectionMenu]);

  if (!results) return null;

  // Modalita review: mostra il diff evidenziato dell'ultimo arricchimento
  if (enrichmentDiff && enrichmentDiff.length > 0) {
    return (
      <div className="search-results">
        <DiffReview diff={enrichmentDiff} onDone={clearEnrichmentDiff} />
      </div>
    );
  }

  const paragraphs = splitIntoBlocks(results.text);

  return (
    <div className="search-results" ref={containerRef} onMouseUp={handleMouseUp}>
      {results.text.length === 0 && (
        <p style={{ color: '#5B6B86' }}>Nessun risultato generato. Riprova con una domanda diversa.</p>
      )}

      {paragraphs.map((paragraph, i) => {
        const isExpanding = expandingIndex === i;

        return (
          <div
            key={i}
            className={`result-block${isExpanding ? ' result-block--expanding' : ''}`}
            ref={(el) => { if (el) paragraphRefs.current.set(i, el); }}
            data-paragraph-index={i}
          >
            {isExpanding && (
              <div className="result-block__expanding-badge">
                <span className="result-block__expanding-spinner" />
                arricchendo il paragrafo...
              </div>
            )}

            {renderFormattedParagraph(paragraph, i)}
          </div>
        );
      })}

      {selectionMenu && (
        <SelectionToolbar
          text={selectionMenu.text}
          x={selectionMenu.x}
          y={selectionMenu.y}
          onDeepDive={() => handleExpandInline(selectionMenu)}
          onAsk={(customPrompt) => handleExpandInline(selectionMenu, customPrompt)}
        />
      )}
    </div>
  );
}

// ---- Selection Toolbar ----

function SelectionToolbar({
  text, x, y, onDeepDive, onAsk,
}: {
  text: string; x: number; y: number; onDeepDive: () => void; onAsk: (customPrompt: string) => void;
}) {
  const [customInput, setCustomInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const truncated = text.length > 30 ? text.slice(0, 30) + '...' : text;

  // Focus input when toolbar appears
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSendCustom = () => {
    if (!customInput.trim()) return;
    onAsk(customInput);
    setCustomInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendCustom();
    }
    if (e.key === 'Escape') {
      onAsk(''); // close without sending
    }
  };

  return (
    <div
      className="selection-toolbar"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="selection-toolbar__row">
        <span className="selection-toolbar__label" title={text}>&ldquo;{truncated}&rdquo;</span>
        <button
          className="selection-toolbar__btn selection-toolbar__btn--primary"
          onClick={(e) => { e.stopPropagation(); onDeepDive(); }}
        >
          Approfondisci
        </button>
      </div>
      <div className="selection-toolbar__row">
        <input
          ref={inputRef}
          type="text"
          className="selection-toolbar__input"
          placeholder="Cosa vuoi sapere?"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
        <button
          className="selection-toolbar__btn selection-toolbar__btn--send"
          onClick={(e) => { e.stopPropagation(); handleSendCustom(); }}
          disabled={!customInput.trim()}
        >
          Invia
        </button>
      </div>
    </div>
  );
}

