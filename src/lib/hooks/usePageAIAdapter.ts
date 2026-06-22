'use client';

import { useState, useCallback } from 'react';
import { callPageAI } from '@/lib/api/ai-api';
import type { ChatEntry } from '@/lib/types/pages';
import type { AIAction, AIBlockOp, IBlockWriter } from '@/lib/types/ai';
import type { ChatAdapter } from '@/components/chat/types';

interface Options {
  pageId: string;
  pageTitle: string;
  blockWriter: IBlockWriter; // Dependency Inversion: depends on abstraction
  language?: string;
  detailLevel?: string;
}

/**
 * Implements ChatAdapter (Liskov Substitution Principle) and adds
 * AI block operations: pendingOps, applyOps, discardOps.
 *
 * Single Responsibility: manages AI chat state + pending block ops coordination.
 * Does NOT know about React components or DOM.
 */
export function usePageAIAdapter({
  pageId,
  pageTitle,
  blockWriter,
  language = 'it',
  detailLevel = 'base',
}: Options): ChatAdapter {
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingOps, setPendingOps] = useState<AIBlockOp[]>([]);
  const [currentAction, setCurrentAction] = useState<AIAction>('chat');

  const send = useCallback(async (message: string) => {
    const userEntry: ChatEntry = { role: 'user', content: message };
    setHistory(prev => [...prev, userEntry]);
    setIsLoading(true);
    setPendingOps([]); // Clear previous pending ops before new request

    try {
      const response = await callPageAI(pageId, {
        message,
        action: currentAction,
        history,
        language,
        detailLevel,
      });

      setHistory(prev => [...prev, { role: 'assistant', content: response.reply }]);
      if (response.hasBlockChanges) {
        setPendingOps(response.blockOps);
      }
    } catch {
      setHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Errore nel contattare l\'AI. Riprova.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [pageId, currentAction, history, language, detailLevel]);

  const applyOps = useCallback(async () => {
    if (pendingOps.length === 0) return;
    setIsLoading(true);
    try {
      for (const op of pendingOps) {
        if (op.type === 'replace_all') {
          await blockWriter.replaceAllBlocks(op.blocks);
        } else {
          // append or insert_after
          await blockWriter.insertBlocksBulk(op.blocks, op.afterId);
        }
      }
    } catch (err) {
      console.error('[usePageAIAdapter] applyOps failed', err);
    } finally {
      setPendingOps([]);
      setIsLoading(false);
    }
  }, [pendingOps, blockWriter]);

  const discardOps = useCallback(() => {
    setPendingOps([]);
  }, []);

  return {
    history,
    isLoading,
    isEnriching: false,
    send,
    placeholder: currentAction === 'chat'
      ? `Chiedi qualcosa su "${pageTitle}"…`
      : currentAction === 'generate'
        ? 'Descrivi il contenuto da generare…'
        : currentAction === 'append'
          ? 'Cosa vuoi aggiungere?'
          : 'Descrivi come riscrivere la pagina…',
    emptyHint: 'Seleziona una modalità e inizia a interagire con l\'AI.',
    pendingOps,
    applyOps,
    discardOps,
    currentAction,
    setAction: setCurrentAction,
  };
}
