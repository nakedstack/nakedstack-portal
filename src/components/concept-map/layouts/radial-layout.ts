// ============================================================
// Radial Layout — Disposizione radiale a stella con cluster
// ============================================================
//
// Open/Closed Principle:
//   Nuovo layout che implementa LayoutStrategy senza modificare
//   il codice esistente (solo aggiunta + registrazione).
//
// Single Responsibility:
//   Solo calcolo posizioni per disposizione radiale, inclusa
//   risoluzione sovrapposizioni.

import type { LayoutStrategy, RawGraphNode, RawGraphEdge, LayoutOptions } from '../types';

// ---- Constants ----

/** Dimensione standard nodo (larghezza × altezza) */
const NODE_W = 180;
const NODE_H = 72;
/** Margine minimo tra i bordi di due nodi (px) */
const MIN_GAP = 24;
/** Raggio base se non specificato */
const DEFAULT_RADIUS = 200;
/** Raggio cluster base se non specificato */
const DEFAULT_CLUSTER_RADIUS = 140;
/** Distanza minima in arco tra nodi di primo livello adiacenti (px) */
const MIN_ARC_GAP = 190;
/** Numero massimo di iterazioni per risoluzione collisioni */
const COLLISION_ITERS = 60;

// ---- Types ----

interface Position {
  _x: number;
  _y: number;
}

// ---- Overlap Detection & Resolution ----

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function toRect(pos: Position): Rect {
  return { x: pos._x, y: pos._y, w: NODE_W, h: NODE_H };
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  // Overlap con gap
  const gap = MIN_GAP;
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  );
}

/**
 * Risolve le sovrapposizioni tra tutti i nodi usando
 * una simulazione iterativa a repulsione semplice.
 * Non modifica il nodo centrale (considerato àncora).
 */
function resolveOverlaps(
  positions: Map<string, Position>,
  centerId: string,
): void {
  const ids = Array.from(positions.keys());
  if (ids.length <= 1) return;

  for (let iter = 0; iter < COLLISION_ITERS; iter++) {
    let moved = false;

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const idA = ids[i];
        const idB = ids[j];
        const a = positions.get(idA)!;
        const b = positions.get(idB)!;
        const rA = toRect(a);
        const rB = toRect(b);

        if (!rectsOverlap(rA, rB)) continue;

        moved = true;

        // Calcola il vettore di spinta (da B verso A)
        const centerAX = a._x + NODE_W / 2;
        const centerAY = a._y + NODE_H / 2;
        const centerBX = b._x + NODE_W / 2;
        const centerBY = b._y + NODE_H / 2;

        let dx = centerAX - centerBX;
        let dy = centerAY - centerBY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= dist;
        dy /= dist;

        // Spinta proporzionale all'overlap, smorzata dall'iterazione
        const force = 3 * (1 - iter / COLLISION_ITERS);

        // Il centro non si muove
        if (idA !== centerId) {
          a._x += dx * force;
          a._y += dy * force;
        }
        if (idB !== centerId) {
          b._x -= dx * force;
          b._y -= dy * force;
        }
      }
    }

    if (!moved) break;
  }
}

// ---- Main Layout ----

/**
 * Layout radiale:
 * - Un nodo centrale
 * - Nodi di primo livello disposti in cerchio attorno al centro
 *   con raggio dinamico per evitare sovrapposizioni
 * - Sotto-nodi raggruppati in cluster vicino al rispettivo genitore
 * - Post-processing: risoluzione iterativa delle collisioni
 */
export const radialLayout: LayoutStrategy = {
  id: 'radial',
  name: 'Radiale',

  layout(nodes: RawGraphNode[], edges: RawGraphEdge[], options: LayoutOptions): RawGraphNode[] {
    const {
      width,
      height,
      radius: baseRadius = DEFAULT_RADIUS,
      clusterRadius: baseClusterRadius = DEFAULT_CLUSTER_RADIUS,
    } = options;

    const cx = width / 2;
    const cy = height / 2;

    if (nodes.length === 0) return [];
    if (nodes.length === 1) {
      return [{ ...nodes[0], _x: cx, _y: cy } as RawGraphNode & { _x?: number; _y?: number }];
    }

    // ---- 1. Identifica il nodo centrale (grado massimo) ----
    const degree = new Map<string, number>();
    for (const n of nodes) degree.set(n.id, 0);
    for (const e of edges) {
      degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
      degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    }

    let centerId = nodes[0].id;
    let maxDeg = 0;
    for (const [id, deg] of degree) {
      if (deg > maxDeg) { maxDeg = deg; centerId = id; }
    }

    // ---- 2. Costruisci adjacency ----
    const adjacency = new Map<string, string[]>();
    for (const n of nodes) adjacency.set(n.id, []);
    for (const e of edges) {
      adjacency.get(e.source)?.push(e.target);
      adjacency.get(e.target)?.push(e.source);
    }

    // ---- 3. Classifica i nodi ----
    const firstLevel = new Set<string>();
    const centerNeighbors = adjacency.get(centerId) ?? [];
    for (const nid of centerNeighbors) firstLevel.add(nid);

    const subNodes = new Set<string>();
    for (const n of nodes) {
      if (n.id !== centerId && !firstLevel.has(n.id)) subNodes.add(n.id);
    }

    // ---- 4. Associa sub-nodes al genitore di primo livello ----
    const parentMap = new Map<string, string>();
    for (const snId of subNodes) {
      const neighbors = adjacency.get(snId) ?? [];
      for (const nb of neighbors) {
        if (firstLevel.has(nb)) { parentMap.set(snId, nb); break; }
      }
      if (!parentMap.has(snId)) {
        for (const nb of neighbors) {
          const gp = parentMap.get(nb);
          if (gp) { parentMap.set(snId, gp); break; }
        }
      }
    }

    // ---- 5. Raggio dinamico: abbastanza grande per non far toccare i nodi ----
    const flArray = Array.from(firstLevel);
    const flCount = flArray.length;
    const dynamicRadius = flCount > 0
      ? Math.max(baseRadius, (flCount * MIN_ARC_GAP) / (2 * Math.PI))
      : baseRadius;

    // ---- 6. Posiziona centro e primo livello ----
    const result = new Map<string, Position>();
    result.set(centerId, { _x: cx - NODE_W / 2, _y: cy - NODE_H / 2 });

    const flAngles = new Map<string, number>(); // per uso nei cluster
    flArray.forEach((nid, i) => {
      const angle = (2 * Math.PI * i) / flCount - Math.PI / 2;
      flAngles.set(nid, angle);
      result.set(nid, {
        _x: cx + dynamicRadius * Math.cos(angle) - NODE_W / 2,
        _y: cy + dynamicRadius * Math.sin(angle) - NODE_H / 2,
      });
    });

    // ---- 7. Posiziona sotto-nodi in cluster ----
    const clusters = new Map<string, string[]>();
    for (const [snId, parentId] of parentMap) {
      if (!clusters.has(parentId)) clusters.set(parentId, []);
      clusters.get(parentId)!.push(snId);
    }

    const usedRects: Rect[] = [];
    // Registra i rettangoli già occupati (centro e primo livello)
    for (const [, pos] of result) usedRects.push(toRect(pos));

    for (const [parentId, children] of clusters) {
      const parentPos = result.get(parentId);
      if (!parentPos) continue;

      const parentAngle = flAngles.get(parentId) ?? 0;
      const parentCenterX = parentPos._x + NODE_W / 2;
      const parentCenterY = parentPos._y + NODE_H / 2;
      const childCount = children.length;

      // Prova diverse distanze di cluster, dalla più lontana alla più vicina
      const clusterDistances = [
        baseClusterRadius + 40,
        baseClusterRadius + 20,
        baseClusterRadius,
        baseClusterRadius - 20,
        baseClusterRadius - 40,
      ];

      children.forEach((childId, childIdx) => {
        let placed = false;

        for (const cr of clusterDistances) {
          // Genera candidati angolari
          const candidates: Position[] = [];

          if (childCount === 1) {
            // Singolo: prova direzione principale + varianti laterali
            candidates.push(angleToPos(parentCenterX, parentCenterY, parentAngle, cr));
            candidates.push(angleToPos(parentCenterX, parentCenterY, parentAngle - 0.3, cr));
            candidates.push(angleToPos(parentCenterX, parentCenterY, parentAngle + 0.3, cr));
          } else {
            // Multipli: arco centrato sul parentAngle
            const spread = Math.min(Math.PI / 3, childCount * 0.35);
            const start = parentAngle - spread / 2;
            const step = childCount > 1 ? spread / (childCount - 1) : 0;
            const primaryAngle = start + step * childIdx;
            candidates.push(angleToPos(parentCenterX, parentCenterY, primaryAngle, cr));
            // Varianti laterali
            candidates.push(angleToPos(parentCenterX, parentCenterY, primaryAngle - 0.2, cr));
            candidates.push(angleToPos(parentCenterX, parentCenterY, primaryAngle + 0.2, cr));
          }

          for (const cand of candidates) {
            const candRect = toRect(cand);
            const overlaps = usedRects.some(r => rectsOverlap(candRect, r));
            if (!overlaps) {
              result.set(childId, cand);
              usedRects.push(candRect);
              placed = true;
              break;
            }
          }
          if (placed) break;
        }

        // Fallback: posiziona comunque (verrà risolto dal collision pass)
        if (!placed) {
          const fallback = angleToPos(parentCenterX, parentCenterY, parentAngle + childIdx * 0.5, baseClusterRadius);
          result.set(childId, fallback);
          usedRects.push(toRect(fallback));
        }
      });
    }

    // ---- 8. Nodi orfani (senza genitore) ----
    for (const n of nodes) {
      if (!result.has(n.id)) {
        result.set(n.id, {
          _x: cx + (Math.random() - 0.5) * dynamicRadius * 1.2,
          _y: cy + (Math.random() - 0.5) * dynamicRadius * 1.2,
        });
      }
    }

    // ---- 9. Risoluzione collisioni globale ----
    resolveOverlaps(result, centerId);

    // ---- 10. Restituisci ----
    return nodes.map(n => {
      const pos = result.get(n.id)!;
      return {
        ...n,
        _x: pos._x,
        _y: pos._y,
      } as RawGraphNode & { _x?: number; _y?: number };
    });
  },
};

// ---- Helpers ----

function angleToPos(cx: number, cy: number, angle: number, radius: number): Position {
  return {
    _x: cx + radius * Math.cos(angle) - NODE_W / 2,
    _y: cy + radius * Math.sin(angle) - NODE_H / 2,
  };
}
