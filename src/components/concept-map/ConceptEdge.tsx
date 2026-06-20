// ============================================================
// ConceptEdge — Custom React Flow edge (SRP: solo rendering arco + label)
// ============================================================

'use client';

import { memo, useState, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  useStore,
  type EdgeProps,
  type ReactFlowState,
} from '@xyflow/react';
import type { ConceptEdgeData } from './types';

/** ID univoco del marker freccia */
const ARROW_ID = 'concept-edge-arrow';

/** Dimensioni fallback nodo (larghezza × altezza) */
const FALLBACK_W = 180;
const FALLBACK_H = 72;

/** Determina il lato migliore e calcola le coordinate esatte sul bordo */
function getEdgeEndpoint(
  nodeX: number,
  nodeY: number,
  nodeW: number,
  nodeH: number,
  otherX: number,
  otherY: number,
): { x: number; y: number; pos: Position } {
  const dx = otherX - nodeX;
  const dy = otherY - nodeY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      return { x: nodeX + nodeW, y: nodeY + nodeH / 2, pos: Position.Right };
    }
    return { x: nodeX, y: nodeY + nodeH / 2, pos: Position.Left };
  }
  if (dy > 0) {
    return { x: nodeX + nodeW / 2, y: nodeY + nodeH, pos: Position.Bottom };
  }
  return { x: nodeX + nodeW / 2, y: nodeY, pos: Position.Top };
}

function ConceptEdge({
  id,
  source,
  target,
  selected,
  data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);

  // Legge le posizioni reali dei nodi connessi (si aggiornano al drag)
  const sourceNode = useStore((s: ReactFlowState) => s.nodeLookup.get(source));
  const targetNode = useStore((s: ReactFlowState) => s.nodeLookup.get(target));

  const sx = sourceNode?.position.x ?? 0;
  const sy = sourceNode?.position.y ?? 0;
  const sw = sourceNode?.measured?.width ?? FALLBACK_W;
  const sh = sourceNode?.measured?.height ?? FALLBACK_H;
  const tx = targetNode?.position.x ?? 0;
  const ty = targetNode?.position.y ?? 0;
  const tw = targetNode?.measured?.width ?? FALLBACK_W;
  const th = targetNode?.measured?.height ?? FALLBACK_H;

  const srcEndpoint = getEdgeEndpoint(sx, sy, sw, sh, tx, ty);
  const tgtEndpoint = getEdgeEndpoint(tx, ty, tw, th, sx, sy);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: srcEndpoint.x,
    sourceY: srcEndpoint.y,
    sourcePosition: srcEndpoint.pos,
    targetX: tgtEndpoint.x,
    targetY: tgtEndpoint.y,
    targetPosition: tgtEndpoint.pos,
    borderRadius: 8,
    offset: 0,
  });

  const edgeData = data as ConceptEdgeData | undefined;
  const relation = edgeData?.relation ?? '';
  const baseColor = edgeData?.edgeColor ?? '#E2E6ED';
  const isHighlighted = edgeData?.highlighted ?? false;
  const nodeColor = edgeData?.highlightColor ?? '#0069FF';
  const highlightStyle = edgeData?.highlightStyle ?? 'solid';
  const isAnimated = edgeData?.animated ?? false;

  // Stato attivo = hover o selezionato o evidenziato dal nodo connesso
  const isActive = hovered || selected || isHighlighted;
  const strokeColor = isActive ? nodeColor : baseColor;
  const strokeWidth = isActive ? 2.2 : 1.5;
  const labelOpacity = isActive ? 1 : 0.75;

  // Tratteggio per hover (non per selected=solid)
  const strokeDasharray = isHighlighted && highlightStyle === 'dashed' ? '6 4' : undefined;

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <>
      {/* Animazione tratteggio */}
      <style>{`
        @keyframes concept-edge-dash-move {
          to { stroke-dashoffset: -20; }
        }
      `}</style>

      {/* Marker freccia SVG — definito una sola volta nel DOM */}
      <defs>
        <marker
          id={ARROW_ID}
          viewBox="0 -5 10 10"
          refX={8}
          refY={0}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path
            d="M0,-5L10,0L0,5"
            fill={strokeColor}
            style={{ transition: 'fill 0.15s' }}
          />
        </marker>
      </defs>

      {/* Area di interazione invisibile (più larga per facilitare click/hover) */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'pointer' }}
      />

      {/* Arco visibile */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${ARROW_ID})`}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          transition: 'stroke 0.15s, stroke-width 0.15s',
          ...(isAnimated && isHighlighted ? { animation: 'concept-edge-dash-move 0.6s linear infinite' } : {}),
        }}
      />

      {/* Etichetta della relazione */}
      {relation && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 9,
              color: isActive ? nodeColor : '#5B6B86',
              background: '#FFFFFF',
              padding: '2px 6px',
              borderRadius: 6,
              border: `1px solid ${isActive ? `${nodeColor}40` : '#E2E6ED'}`,
              opacity: labelOpacity,
              pointerEvents: 'all',
              whiteSpace: 'nowrap',
              fontWeight: isActive ? 600 : 400,
              transition: 'color 0.15s, border-color 0.15s, opacity 0.15s, font-weight 0.15s',
              cursor: 'default',
              boxShadow: isActive ? `0 1px 4px ${nodeColor}30` : 'none',
            }}
            className="nodrag nopan"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {relation}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(ConceptEdge);
