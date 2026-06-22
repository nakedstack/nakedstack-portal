'use client';

import { useState, useCallback } from 'react';
import { callPageAI } from '@/lib/api/ai-api';
import type { BlockContent } from '@/lib/types/pages';
import { clearBrowserSelection } from './useTextSelection';

/** Azione rapida disponibile dalla toolbar di selezione */
export type InlineAction = 'improve' | 'summarize' | 'continue' | 'ask';

/** Mappa azione → prompt inviato all'AI come prefisso del messaggio */
const ACTION_PROMPTS: Record<InlineAction, string> = {
  improve: 'Migliora questo testo: mantieni il significato ma rendi la scrittura più chiara e precisa.',
  summarize: 'Riassumi questo testo in modo conciso.',
  continue: 'Continua questo testo in modo coerente con stile e contenuto esistenti.',
  ask: '', // prompt personalizzato fornito dall'utente
};

interface Options {
  pageId: string;
  /** Chiamato quando l'utente conferma la sostituzione del blocco */
  onApply: (blockId: string, content: BlockContent) => void;
}

export interface InlineAIState {
  isLoading: boolean;
  pendingText: string | null;
  pendingBlockId: string | null;
  /** Invia la richiesta all'AI per rielaborare il testo selezionato */
  request: (blockId: string, selectedText: string, action: InlineAction, customPrompt?: string) => void;
  /** Applica il testo pending al blocco e cancella la selezione */
  apply: () => void;
  /** Scarta il testo pending senza modificare il blocco */
  discard: () => void;
}

/**
 * Gestisce lo stato AI per la rielaborazione inline di testo selezionato.
 * Responsabilità unica: coordinare richiesta AI + stato pending per un blocco.
 * Dipende da IBlockWriter tramite la callback onApply (Dependency Inversion).
 */
export function useInlineAI({ pageId, onApply }: Options): InlineAIState {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);

  const request = useCallback(async (
    blockId: string,
    selectedText: string,
    action: InlineAction,
    customPrompt?: string,
  ) => {
    const instruction = action === 'ask' && customPrompt
      ? customPrompt
      : ACTION_PROMPTS[action];

    const message = `${instruction}\n\nTesto: "${selectedText}"`;

    setIsLoading(true);
    setPendingBlockId(blockId);
    setPendingText(null);

    try {
      const response = await callPageAI(pageId, {
        message,
        action: 'rewrite_selection',
        history: [],
      });
      // Usa inlineResult se disponibile, altrimenti reply come fallback
      setPendingText(response.inlineResult ?? response.reply);
    } catch {
      setPendingText(null);
      setPendingBlockId(null);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  const apply = useCallback(() => {
    if (!pendingText || !pendingBlockId) return;
    onApply(pendingBlockId, {
      rich_text: [{ text: pendingText, annotations: {} }],
    });
    setPendingText(null);
    setPendingBlockId(null);
    clearBrowserSelection();
  }, [pendingText, pendingBlockId, onApply]);

  const discard = useCallback(() => {
    setPendingText(null);
    setPendingBlockId(null);
    clearBrowserSelection();
  }, []);

  return { isLoading, pendingText, pendingBlockId, request, apply, discard };
}
