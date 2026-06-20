// ============================================================
// useChatEnrichment — Hook dell'agent di arricchimento (SRP)
// ------------------------------------------------------------
// Concern condiviso e iniettabile negli adapter (DIP):
// dopo ogni risposta, estrae le info nuove e le integra nel
// topic + concept map (persistenza server-side via /api/enrich),
// poi aggiorna la UI tramite explore-context.applyEnrichment.
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import { useExplore } from '@/lib/explore-context';

export interface ChatEnrichment {
  /** True mentre l'agent lavora */
  isEnriching: boolean;
  /** Avvia l'arricchimento in background (fire-and-forget) */
  enrich: (question: string, answer: string, focusNodeId?: string | null) => Promise<void>;
}

export function useChatEnrichment(): ChatEnrichment {
  const { currentTopicId, language, detailLevel, applyEnrichment } = useExplore();
  const [isEnriching, setIsEnriching] = useState(false);

  const enrich = useCallback(async (question: string, answer: string, focusNodeId?: string | null) => {
    if (!currentTopicId || !answer.trim()) return;
    setIsEnriching(true);
    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: currentTopicId,
          language,
          detailLevel,
          question,
          answer,
          focusNodeId: focusNodeId ?? null,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      applyEnrichment({
        text: data.textUpdated ? data.updatedText : undefined,
        conceptMapChanged: data.conceptMapUpdated === true,
      });
    } catch {
      // Background: fallimento silenzioso, non disturba la chat.
    } finally {
      setIsEnriching(false);
    }
  }, [currentTopicId, language, detailLevel, applyEnrichment]);

  return { isEnriching, enrich };
}
