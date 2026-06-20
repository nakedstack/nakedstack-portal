// ============================================================
// Dagre Layout — Layout gerarchico/albero
// ============================================================

import dagre from 'dagre';
import type { LayoutStrategy, RawGraphNode, RawGraphEdge, LayoutOptions } from '../types';

/** Layout gerarchico basato su dagre (diretto, a livelli) */
export const dagreLayout: LayoutStrategy = {
  id: 'dagre',
  name: 'Gerarchico',

  layout(nodes: RawGraphNode[], edges: RawGraphEdge[], options: LayoutOptions): RawGraphNode[] {
    const { width, height, direction = 'TB', nodeSep = 50, rankSep = 80 } = options;

    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: direction,
      nodesep: nodeSep,
      ranksep: rankSep,
      marginx: 40,
      marginy: 40,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Dimensioni nodo rettangolare
    nodes.forEach(n => {
      g.setNode(n.id, { width: 180, height: 64 });
    });

    edges.forEach(e => {
      g.setEdge(e.source, e.target);
    });

    dagre.layout(g);

    return nodes.map(n => {
      const pos = g.node(n.id);
      return {
        ...n,
        // dagre posiziona rispetto al centro; React Flow usa top-left
        _x: pos ? pos.x - width / 2 : undefined,
        _y: pos ? pos.y - height / 2 : undefined,
      } as RawGraphNode & { _x?: number; _y?: number };
    });
  },
};
