'use client';

import { useState, useCallback } from 'react';

export interface ChatEnrichmentOptions {
  pageId: string;
  language?: string;
  detailLevel?: string;
}

export interface ChatEnrichment {
  isEnriching: boolean;
  enrich: (question: string, answer: string) => Promise<void>;
}

export function useChatEnrichment({ pageId, language = 'it', detailLevel = 'base' }: ChatEnrichmentOptions): ChatEnrichment {
  const [isEnriching, setIsEnriching] = useState(false);

  const enrich = useCallback(async (question: string, answer: string) => {
    if (!pageId || !answer.trim()) return;
    setIsEnriching(true);
    try {
      await fetch(`/api/pages/${pageId}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, language, detailLevel }),
      });
    } catch {
      // Background: silent failure
    } finally {
      setIsEnriching(false);
    }
  }, [pageId, language, detailLevel]);

  return { isEnriching, enrich };
}
