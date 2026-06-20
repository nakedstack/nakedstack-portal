// ============================================================
// useNodeDescription — Hook per descrizione AI del nodo (SRP)
// Chiama /api/node-description con contesto parent + chat.
// ============================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import type { Language, DetailLevel } from '@/lib/ai/prompts';

// ============================================================
// Cache client-side in-memory (sopravvive tra click su nodi diversi)
// ============================================================

const _clientCache = new Map<string, string>();

function clientCacheKey(conceptMapId: number, nodeId: string): string {
  return `${conceptMapId}|${nodeId}`;
}

interface ParentNodeInfo {
  label: string;
  relation: string;
}

interface UseNodeDescriptionOptions {
  /** ID della concept map (per cache) */
  conceptMapId: number | null;
  /** ID del nodo (per cache) */
  nodeId: string;
  /** Etichetta del nodo selezionato */
  nodeLabel: string | null;
  /** Gruppo del nodo */
  nodeGroup: string;
  /** Argomento della ricerca (testo) */
  topic: string;
  /** Lingua */
  language: Language;
  /** Livello di dettaglio */
  detailLevel: DetailLevel;
  /** Nodi parent (incoming edges) */
  parentNodes: ParentNodeInfo[];
  /** Contesto chat (messaggi recenti) */
  chatContext: string;
}

interface UseNodeDescriptionReturn {
  /** Descrizione generata dall'AI */
  description: string | null;
  /** Se è in corso il fetch */
  isLoading: boolean;
  /** Eventuale errore */
  error: string | null;
  /** Forza un re-fetch (stessa versione, cache server se esiste) */
  refetch: () => void;
  /** Rigenera: crea una nuova versione della descrizione */
  regenerate: () => void;
}

/**
 * Hook che genera una descrizione AI per un nodo della mappa concettuale.
 * Usa il contesto dei nodi parent e della chat per una descrizione mirata.
 */
export function useNodeDescription({
  conceptMapId,
  nodeId,
  nodeLabel,
  nodeGroup,
  topic,
  language,
  detailLevel,
  parentNodes,
  chatContext,
}: UseNodeDescriptionOptions): UseNodeDescriptionReturn {
  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tiene traccia dell'ultimo nodeLabel per cui è stata fetchata la descrizione
  const lastFetchedRef = useRef<string | null>(null);
  // Abort controller per cancellare richieste in volo
  const abortRef = useRef<AbortController | null>(null);

  const fetchDescription = async (forceRegenerate = false) => {
    if (!nodeLabel) {
      setDescription(null);
      return;
    }

    // Client cache hit → instant display (skip se regenerate o conceptMapId mancante)
    if (!forceRegenerate && conceptMapId) {
      const cKey = clientCacheKey(conceptMapId, nodeId);
      const cachedClient = _clientCache.get(cKey);
      if (cachedClient) {
        setDescription(cachedClient);
        setIsLoading(false);
        setError(null);
        lastFetchedRef.current = nodeLabel;
        return;
      }
    }

    // Evita fetch duplicati per lo stesso nodo (salvo regenerate)
    if (!forceRegenerate && lastFetchedRef.current === nodeLabel && description !== null) {
      return;
    }

    // Pulisce la client cache quando si rigenera
    if (forceRegenerate && conceptMapId) {
      _clientCache.delete(clientCacheKey(conceptMapId, nodeId));
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    lastFetchedRef.current = nodeLabel;

    try {
      const res = await fetch('/api/node-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptMapId,
          nodeId,
          nodeLabel,
          nodeGroup,
          topic,
          language,
          detailLevel,
          parentNodes,
          chatContext,
          regenerate: forceRegenerate,
        }),
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 2) Popola client cache dopo fetch riuscito (solo se abbiamo conceptMapId)
      if (conceptMapId) {
        _clientCache.set(clientCacheKey(conceptMapId, nodeId), data.description);
      }
      setDescription(data.description);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch quando cambia il nodo selezionato
  useEffect(() => {
    fetchDescription();
    return () => {
      abortRef.current?.abort();
    };
  }, [nodeLabel]);

  const refetch = () => {
    lastFetchedRef.current = null;
    fetchDescription(false);
  };

  const regenerate = () => {
    lastFetchedRef.current = null;
    fetchDescription(true);
  };

  return { description, isLoading, error, refetch, regenerate };
}
