'use client';

import { useState, useCallback } from 'react';
import type { ChatAdapter, ChatEntry } from './types';

interface Options {
  pageId: string;
  pageTitle: string;
  language?: string;
  detailLevel?: string;
}

export function usePageChatAdapter({ pageId, pageTitle, language = 'it', detailLevel = 'base' }: Options): ChatAdapter {
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnriching] = useState(false);

  const send = useCallback(async (message: string) => {
    const userEntry: ChatEntry = { role: 'user', content: message };
    setHistory(prev => [...prev, userEntry]);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/pages/${pageId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, language, detailLevel, pageTitle }),
      });
      if (!res.ok) throw new Error('Chat error');
      const data = await res.json() as { reply: string };
      setHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setHistory(prev => [...prev, { role: 'assistant', content: 'Error getting response.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [pageId, pageTitle, history, language, detailLevel]);

  return {
    history,
    isLoading,
    isEnriching,
    send,
    placeholder: `Ask about "${pageTitle}"…`,
    emptyHint: 'Ask a question to start exploring this page.',
  };
}
