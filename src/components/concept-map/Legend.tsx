// ============================================================
// Legend — Legenda colori (SRP: solo rendering legenda)
// ============================================================

'use client';

import { memo } from 'react';
import type { ConceptMapTheme } from './types';

interface LegendProps {
  theme: ConceptMapTheme;
}

function Legend({ theme }: LegendProps) {
  const entries = Object.entries(theme.groupColors);

  if (entries.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1.25rem',
        padding: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      {entries.map(([group, color]) => (
        <div
          key={group}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            color: '#5B6B86',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: color,
              display: 'inline-block',
            }}
          />
          {group}
        </div>
      ))}
    </div>
  );
}

export default memo(Legend);
