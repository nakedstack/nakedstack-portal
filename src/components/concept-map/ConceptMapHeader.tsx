// ============================================================
// ConceptMapHeader — Barra versione + rigenera (SRP)
// Renderizzata sotto il canvas come footer.
// ============================================================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ConceptMapVersion } from './useConceptMap';

export interface ConceptMapHeaderProps {
  versions: ConceptMapVersion[];
  conceptMapId: number | null;
  loading: boolean;
  canRegenerate: boolean;
  onVersionChange: (id: number) => void;
  onRegenerate: () => void;
}

function formatVersionDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function ConceptMapHeader({
  versions,
  conceptMapId,
  loading,
  canRegenerate,
  onVersionChange,
  onRegenerate,
}: ConceptMapHeaderProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  // Chiude al click fuori (trigger + menu sono entrambi "interni")
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Calcola posizione menu all'apertura
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 1200,
    });
  }, [open]);

  const selected = versions.find(v => v.id === conceptMapId) ?? versions[0];

  const handleSelect = useCallback((id: number) => {
    setOpen(false);
    onVersionChange(id);
  }, [onVersionChange]);

  if (versions.length === 0) return null;

  return (
    <div className="concept-map-footer">
      <div className="cm-version-dropdown">
        <button
          ref={triggerRef}
          className="cm-version-trigger"
          onClick={() => setOpen(o => !o)}
          title="Versione della mappa"
        >
          <span className="cm-version-label">v{selected.version}</span>
          <span className="cm-version-date">{formatVersionDate(selected.created_at)}</span>
          <span className={`cm-version-chevron${open ? ' cm-version-chevron--open' : ''}`}>▾</span>
        </button>
        {open && createPortal(
          <ul ref={menuRef} className="cm-version-menu" style={menuStyle}>
            {versions.map(v => (
              <li
                key={v.id}
                className={`cm-version-item${v.id === conceptMapId ? ' cm-version-item--active' : ''}`}
                onClick={() => handleSelect(v.id)}
              >
                <span className="cm-version-item-ver">v{v.version}</span>
                <span className="cm-version-item-date">{formatVersionDate(v.created_at)}</span>
              </li>
            ))}
          </ul>,
          document.body
        )}
      </div>
      <button
        className="concept-map-btn concept-map-btn--regenerate"
        onClick={onRegenerate}
        disabled={loading || !canRegenerate}
        title="Genera una nuova versione della mappa"
      >
        Rigenera
      </button>
    </div>
  );
}
