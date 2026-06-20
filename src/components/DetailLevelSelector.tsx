'use client';

import { useExplore } from '@/lib/explore-context';
import type { DetailLevel } from '@/lib/ai/prompts';

const LEVELS: { code: DetailLevel; label: string }[] = [
  { code: 'base', label: 'Base' },
  { code: 'intermedio', label: 'Intermedio' },
  { code: 'avanzato', label: 'Avanzato' },
];

export default function DetailLevelSelector() {
  const { detailLevel, setDetailLevel } = useExplore();

  return (
    <div className="detail-pills" role="radiogroup" aria-label="Livello dettaglio">
      {LEVELS.map(({ code, label }) => (
        <button
          key={code}
          className={`detail-pill${detailLevel === code ? ' detail-pill--active' : ''}`}
          onClick={() => setDetailLevel(code)}
          role="radio"
          aria-checked={detailLevel === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
