'use client';

import { useState, useEffect } from 'react';
import { useExplore } from '@/lib/explore-context';
import { renderFormattedParagraph } from '@/lib/render-utils';
import type { ParsedResponse } from '@/lib/ai/parser';
import { X } from '@phosphor-icons/react';

export default function DetailCard() {
  const { results, breadcrumbs } = useExplore();

  // Mostra la DetailCard quando c'e un termine attivo nella breadcrumb
  const activeTerm = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ParsedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTerm && activeTerm.response) {
      setDetail(activeTerm.response);
      setIsOpen(true);
      setError(null);
    } else if (activeTerm) {
      // Fetch detail for the term
      setLoading(true);
      setIsOpen(true);
      setError(null);

      fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeTerm.term, language: 'it', detailLevel: 'base' }),
      })
        .then(res => res.json())
        .then(data => {
          setDetail(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      setIsOpen(false);
      setDetail(null);
    }
  }, [activeTerm]);

  const { goBackTo } = useExplore();

  const handleClose = () => {
    if (breadcrumbs.length > 1) {
      goBackTo(breadcrumbs.length - 2);
    } else {
      goBackTo(-1);
    }
  };

  return (
    <>
      <div
        className={`detail-overlay${isOpen ? ' detail-overlay--visible' : ''}`}
        onClick={handleClose}
      />
      <aside className={`detail-card${isOpen ? ' detail-card--open' : ''}`} aria-label="Dettaglio termine">
        <div className="detail-card__header">
          <h3 className="detail-card__title">{activeTerm?.term || 'Dettaglio'}</h3>
          <button className="detail-card__close" onClick={handleClose} aria-label="Chiudi">
            <X size={18} weight="duotone" />
          </button>
        </div>
        <div className="detail-card__body">
          {loading && (
            <div className="detail-card__loading">
              <div className="explore__loading-spinner" />
              <p>Caricando dettaglio...</p>
            </div>
          )}
          {error && (
            <div className="detail-card__error">
              <p>Errore: {error}</p>
            </div>
          )}
          {detail && !loading && (
            <>
              {detail.text.split('\n\n').map((p, i) => (
                <p key={i} style={{ marginBottom: '0.75rem' }}>{renderFormattedParagraph(p, i)}</p>
              ))}
              {detail.keywords.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#5B6B86' }}>Termini correlati:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                    {detail.keywords.map(kw => (
                      <KeywordChip key={kw} term={kw} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function KeywordChip({ term }: { term: string }) {
  const { exploreKeyword } = useExplore();
  return (
    <button
      className="breadcrumb-chip"
      onClick={() => exploreKeyword(term)}
    >
      {term}
    </button>
  );
}
