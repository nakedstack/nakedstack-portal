// ============================================================
// useConceptMap — Hook fetching & trasformazione dati (SRP)
// ============================================================

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { RawGraphNode, RawGraphEdge, ConceptMapPayload, ConceptNodeData, ConceptEdgeData, ConceptMapTheme, LayoutStrategy, LayoutOptions, ConceptMapConfig } from './types';

export interface UseConceptMapOptions {
  /** Testo dell'argomento corrente (es. prime 100 lettere dei risultati) */
  topic: string | null;
  /** Lingua per generazione */
  language?: string;
  /** Configurazione tema + layout iniettata */
  config: ConceptMapConfig;
}

export interface UseConceptMapReturn {
  loading: boolean;
  error: string | null;
  graphNodes: Node<ConceptNodeData>[];
  graphEdges: Edge<ConceptEdgeData>[];
  fetchMap: () => Promise<void>;
  reset: () => void;
  /**
   * Persiste le posizioni correnti dei nodi nella cache.
   * Chiamato dopo il drag-and-drop dei nodi.
   */
  savePositions: (positions: Record<string, { x: number; y: number }>) => Promise<void>;
}

/** Converte i dati grezzi API in nodi/edge React Flow */
function buildFlowElements(
  nodes: RawGraphNode[],
  edges: RawGraphEdge[],
  theme: ConceptMapTheme,
  layout: LayoutStrategy,
  layoutOptions: LayoutOptions,
  savedPositions?: Record<string, { x: number; y: number }>,
): { graphNodes: Node<ConceptNodeData>[]; graphEdges: Edge<ConceptEdgeData>[] } {
  // Applica layout
  const positionedNodes = layout.layout(nodes, edges, layoutOptions);

  const graphNodes: Node<ConceptNodeData>[] = positionedNodes.map(n => {
    // Priorità: posizione salvata dall'utente > layout calcolato > random fallback
    const saved = savedPositions?.[n.id];
    const layoutX = (n as RawGraphNode & { _x?: number })._x;
    const layoutY = (n as RawGraphNode & { _y?: number })._y;

    return {
      id: n.id,
      type: 'conceptNode',
      position: saved
        ? { x: saved.x, y: saved.y }
        : {
            x: layoutX ?? Math.random() * (layoutOptions.width - 200) + 100,
            y: layoutY ?? Math.random() * (layoutOptions.height - 200) + 100,
          },
      data: {
        label: n.label,
        group: n.group,
        description: n.group,
        color: theme.groupColors[n.group] ?? theme.defaultColor,
        textColor: theme.nodeTextColor,
        borderColor: theme.nodeBorderColor,
      },
    };
  });

  const graphEdges: Edge<ConceptEdgeData>[] = edges.map((e, i) => ({
    id: `e-${e.source}-${e.target}-${i}`,
    type: 'conceptEdge',
    source: e.source,
    target: e.target,
    data: {
      relation: e.relation,
      edgeColor: theme.edgeColor,
    },
  }));

  return { graphNodes, graphEdges };
}

export function useConceptMap({ topic, language = 'it', config }: UseConceptMapOptions): UseConceptMapReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<ConceptMapPayload | null>(null);

  const fetchMap = useCallback(async () => {
    if (!topic) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/concept-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, language }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRawData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load concept map');
    } finally {
      setLoading(false);
    }
  }, [topic, language]);

  const reset = useCallback(() => {
    setRawData(null);
    setError(null);
  }, []);

  // Salva le posizioni nella cache server-side
  const savePositions = useCallback(async (positions: Record<string, { x: number; y: number }>) => {
    if (!topic) return;
    try {
      await fetch('/api/concept-map', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, language, positions }),
      });
      // Aggiorna anche rawData locale per coerenza
      setRawData(prev => prev ? { ...prev, positions } : null);
    } catch (err) {
      console.error('Failed to save concept map positions:', err);
    }
  }, [topic, language]);

  // Trasforma rawData in elementi React Flow usando tema e layout iniettati
  const { graphNodes, graphEdges } = useMemo(() => {
    if (!rawData) return { graphNodes: [], graphEdges: [] };

    return buildFlowElements(
      rawData.nodes,
      rawData.edges,
      config.theme,
      config.layout,
      { width: 800, height: 500 },
      rawData.positions,
    );
  }, [rawData, config]);

  return { loading, error, graphNodes, graphEdges, fetchMap, reset, savePositions };
}
