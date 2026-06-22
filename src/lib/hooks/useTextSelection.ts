'use client';

import { useState, useEffect, type RefObject } from 'react';

/** Posizione viewport-relative della selezione (per position: fixed) */
export interface TextSelection {
  text: string;
  /** ID del blocco che contiene la selezione (letto da data-block-id) */
  blockId: string | null;
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
}

/**
 * Rileva la selezione di testo all'interno di containerRef.
 * Responsabilità unica: leggere window.getSelection() e restituire metadati.
 * Non gestisce stato UI, non chiama API.
 */
export function useTextSelection(containerRef: RefObject<HTMLElement | null>): TextSelection | null {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      // Se il click è su un elemento con classe che inizia per "selection-toolbar" non azzerare
      const target = e.target as HTMLElement;
      if (target.closest('.selection-toolbar')) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim() === '') {
        setSelection(null);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const range = sel.getRangeAt(0);

      // La selezione deve essere all'interno del container dell'editor
      if (!container.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }

      // Risale il DOM per trovare l'attributo data-block-id
      let node: Node | null = range.commonAncestorContainer;
      let blockId: string | null = null;
      while (node) {
        if (node instanceof HTMLElement && node.dataset.blockId) {
          blockId = node.dataset.blockId;
          break;
        }
        node = node.parentNode;
      }

      const rect = range.getBoundingClientRect();
      setSelection({
        text: sel.toString().trim(),
        blockId,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
      });
    }

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [containerRef]);

  return selection;
}

/** Cancella la selezione del browser */
export function clearBrowserSelection(): void {
  window.getSelection()?.removeAllRanges();
}
