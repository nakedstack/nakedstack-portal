// ============================================================
// useNodeSidebar — Hook con dati derivati (SRP: logica sidebar)
// ============================================================

'use client';

import { useMemo } from 'react';
import { useNodeSidebar as useCtx, type NodeSidebarState } from './NodeSidebarContext';
import type { ConceptNodeData, RawGraphNode, RawGraphEdge } from './types';

/** Informazioni sugli archi connessi a un nodo */
export interface ConnectedEdgeInfo {
  edgeId: string;
  otherNodeId: string;
  otherNodeLabel: string;
  relation: string;
  direction: 'incoming' | 'outgoing';
}

export interface NodeSidebarDerived {
  /** Nome del gruppo formattato (prima lettera maiuscola) */
  displayGroup: string;
  /** Lista degli archi connessi (incoming + outgoing) */
  connectedEdges: ConnectedEdgeInfo[];
  /** Conteggio connessioni in entrata */
  incomingCount: number;
  /** Conteggio connessioni in uscita */
  outgoingCount: number;
}

/**
 * Hook che estende NodeSidebarState con dati derivati.
 * Calcola: nome gruppo formattato, archi connessi, conteggi.
 *
 * @param rawNodes  - Array dei nodi grezzi (da useConceptMap rawData)
 * @param rawEdges  - Array degli archi grezzi (da useConceptMap rawData)
 */
export function useNodeSidebarDerived(
  rawNodes: RawGraphNode[],
  rawEdges: RawGraphEdge[],
): NodeSidebarState & NodeSidebarDerived {
  const ctx = useCtx();

  const derived = useMemo<NodeSidebarDerived>(() => {
    const node = ctx.selectedNode;
    const data = node?.data as ConceptNodeData | undefined;
    const nodeId = node?.id;

    // Display group
    const group = data?.group ?? '';
    const displayGroup = group.charAt(0).toUpperCase() + group.slice(1);

    // Connected edges
    const connectedEdges: ConnectedEdgeInfo[] = [];
    let incomingCount = 0;
    let outgoingCount = 0;

    if (nodeId) {
      for (const edge of rawEdges) {
        if (edge.source === nodeId) {
          outgoingCount++;
          const targetRaw = rawNodes.find(n => n.id === edge.target);
          connectedEdges.push({
            edgeId: `e-${edge.source}-${edge.target}`,
            otherNodeId: edge.target,
            otherNodeLabel: targetRaw?.label ?? edge.target,
            relation: edge.relation,
            direction: 'outgoing',
          });
        } else if (edge.target === nodeId) {
          incomingCount++;
          const sourceRaw = rawNodes.find(n => n.id === edge.source);
          connectedEdges.push({
            edgeId: `e-${edge.source}-${edge.target}`,
            otherNodeId: edge.source,
            otherNodeLabel: sourceRaw?.label ?? edge.source,
            relation: edge.relation,
            direction: 'incoming',
          });
        }
      }
    }

    return { displayGroup, connectedEdges, incomingCount, outgoingCount };
  }, [ctx.selectedNode, rawNodes, rawEdges]);

  return { ...ctx, ...derived };
}
