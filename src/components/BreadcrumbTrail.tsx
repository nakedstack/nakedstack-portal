'use client';

import { useExplore } from '@/lib/explore-context';

export default function BreadcrumbTrail() {
  const { breadcrumbs, goBackTo } = useExplore();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="breadcrumb-trail" aria-label="Percorso di esplorazione">
      <button
        className="breadcrumb-home"
        onClick={() => goBackTo(-1)}
        title="Torna all'inizio"
      >
        Home
      </button>

      {breadcrumbs.map((item, index) => (
        <span key={`${item.term}-${index}`} style={{ display: 'contents' }}>
          <span className="breadcrumb-sep">/</span>
          <button
            className={`breadcrumb-chip${index === breadcrumbs.length - 1 ? ' breadcrumb-chip--active' : ''}`}
            onClick={() => goBackTo(index)}
          >
            {item.term}
          </button>
        </span>
      ))}
    </nav>
  );
}
