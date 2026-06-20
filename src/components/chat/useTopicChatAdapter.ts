// ============================================================
// useTopicChatAdapter — Adapter per la chat a livello di topic
// ------------------------------------------------------------
// Implementa ChatAdapter sopra explore-context. Dopo ogni
// risposta avvia l'agent di arricchimento (nessun nodo focus).
// ============================================================

'use client';

import { useCallback } from 'react';
import { useExplore } from '@/lib/explore-context';
import { useChatEnrichment } from './useChatEnrichment';
import type { ChatAdapter } from './types';

export function useTopicChatAdapter(): ChatAdapter {
  const { results, chatHistory, chatIsLoading, sendChatMessage } = useExplore();
  const { isEnriching, enrich } = useChatEnrichment();

  const send = useCallback(async (message: string) => {
    const answer = await sendChatMessage(message);
    if (answer) {
      void enrich(message, answer, null);
    }
  }, [sendChatMessage, enrich]);

  const onKeywordClick = useCallback((term: string) => {
    void send(`Approfondisci "${term}"`);
  }, [send]);

  return {
    history: chatHistory,
    isLoading: chatIsLoading,
    isEnriching,
    placeholder: 'Fai una domanda...',
    emptyHint: results
      ? 'Fai una domanda per approfondire questo argomento.'
      : 'Avvia una ricerca per iniziare a chattare.',
    send,
    onKeywordClick,
  };
}
