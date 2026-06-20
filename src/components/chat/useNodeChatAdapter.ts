// ============================================================
// useNodeChatAdapter — Adapter per la chat di un singolo nodo
// ------------------------------------------------------------
// Implementa ChatAdapter con contesto nodo + parent + topic.
// Cronologia persistita su /api/node-chat. Dopo ogni risposta
// avvia l'agent di arricchimento agganciato al nodo (focusNodeId).
// ============================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useExplore } from '@/lib/explore-context';
import { useChatEnrichment } from './useChatEnrichment';
import type { ChatAdapter, ChatEntry } from './types';

export interface NodeChatParent {
  label: string;
  relation: string;
}

export interface UseNodeChatAdapterOptions {
  conceptMapId: number | null;
  nodeId: string;
  nodeLabel: string;
  nodeGroup: string;
  description: string | null;
  parentNodes: NodeChatParent[];
  topic: string;
}

export function useNodeChatAdapter(opts: UseNodeChatAdapterOptions): ChatAdapter {
  const { conceptMapId, nodeId, nodeLabel, nodeGroup, description, parentNodes, topic } = opts;
  const { language, detailLevel } = useExplore();
  const { isEnriching, enrich } = useChatEnrichment();

  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset immediato della cronologia quando cambia il nodo
  // (adeguamento dello stato durante il render, pattern ufficiale React).
  const nodeKey = `${conceptMapId ?? ''}|${nodeId}`;
  const [seenKey, setSeenKey] = useState(nodeKey);
  if (nodeKey !== seenKey) {
    setSeenKey(nodeKey);
    setHistory([]);
  }

  // Riferimento aggiornato alla cronologia per gli handler (aggiornato in effect)
  const historyRef = useRef<ChatEntry[]>([]);
  useEffect(() => { historyRef.current = history; }, [history]);

  // Carica la cronologia persistita quando cambia il nodo
  useEffect(() => {
    let cancelled = false;
    if (!conceptMapId || !nodeId) return;
    fetch(`/api/node-chat?conceptMapId=${conceptMapId}&nodeId=${encodeURIComponent(nodeId)}`)
      .then(r => (r.ok ? r.json() : { history: [] }))
      .then(d => { if (!cancelled) setHistory(d.history || []); })
      .catch(() => { /* nessuna cronologia salvata */ });
    return () => { cancelled = true; };
  }, [conceptMapId, nodeId]);

  const persist = useCallback((next: ChatEntry[]) => {
    if (!conceptMapId || !nodeId) return;
    fetch('/api/node-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conceptMapId, nodeId, history: next }),
    }).catch(() => { /* fire-and-forget */ });
  }, [conceptMapId, nodeId]);

  const buildContext = useCallback(() => {
    return [
      `Stai rispondendo a una domanda di approfondimento sul concetto "${nodeLabel}" (categoria: ${nodeGroup}) nell'ambito dell'argomento "${topic}".`,
      description ? `Descrizione del concetto: ${description}` : '',
      parentNodes.length > 0
        ? `Collegato a: ${parentNodes.map(p => `"${p.label}" (${p.relation})`).join(', ')}.`
        : '',
      'Rispondi in modo conciso e pertinente al concetto specifico, non alla piattaforma in generale.',
    ].filter(Boolean).join('\n');
  }, [nodeLabel, nodeGroup, topic, description, parentNodes]);

  const send = useCallback(async (message: string) => {
    setIsLoading(true);
    const base = historyRef.current;
    const withUser: ChatEntry[] = [...base, { role: 'user', content: message }];
    setHistory(withUser);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: message,
          history: base,
          language,
          detailLevel,
          context: buildContext(),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const answer = data.answer as string;
      const withAnswer: ChatEntry[] = [...withUser, { role: 'assistant', content: answer }];
      setHistory(withAnswer);
      persist(withAnswer);
      void enrich(message, answer, nodeId);
    } catch (err) {
      const msg = 'Errore: ' + (err instanceof Error ? err.message : 'Sconosciuto');
      setHistory(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setIsLoading(false);
    }
  }, [language, detailLevel, buildContext, persist, enrich, nodeId]);

  const onKeywordClick = useCallback((term: string) => {
    void send(`Approfondisci "${term}"`);
  }, [send]);

  return {
    history,
    isLoading,
    isEnriching,
    placeholder: `Approfondisci "${nodeLabel}"...`,
    emptyHint: `Fai una domanda su "${nodeLabel}" per approfondire.`,
    send,
    onKeywordClick,
  };
}
