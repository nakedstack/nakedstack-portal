// ============================================================
// ConceptNode — Custom React Flow node (SRP: solo rendering nodo)
// Stile rettangolare: titolo + descrizione + accento colore
// ============================================================

'use client';

import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ConceptNodeData } from './types';

function ConceptNode({ data, selected }: NodeProps) {
  const { label, description, color, textColor, borderColor } = data as unknown as ConceptNodeData;
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  const isActive = hovered || selected;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        minWidth: 140,
        maxWidth: 180,
        background: '#FFFFFF',
        borderRadius: 10,
        border: `1.5px solid ${isActive ? '#0069FF' : borderColor}`,
        boxShadow: isActive
          ? '0 2px 12px rgba(0,105,255,0.15)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        fontFamily: "'Space Grotesk','Segoe UI',sans-serif",
      }}
      title={label}
    >
      {/* Barra colorata superiore */}
      <div
        style={{
          height: 4,
          background: color,
          flexShrink: 0,
        }}
      />

      {/* Corpo */}
      <div style={{ padding: '8px 12px 10px' }}>
        {/* Titolo */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#031B4E',
            lineHeight: 1.3,
            marginBottom: 3,
            // Tronca titolo lungo
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>

        {/* Descrizione / sottotitolo */}
        <div
          style={{
            fontSize: 10,
            color: '#5B6B86',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {description}
        </div>
      </div>

      {/* Handles invisibili — necessari a React Flow per gli edge */}
      <Handle type="target" position={Position.Top} id="target-top" style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Right} id="source-right" style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Left} id="target-left" style={{ opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}

export default memo(ConceptNode);
