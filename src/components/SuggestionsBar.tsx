'use client';

import { useExplore } from '@/lib/explore-context';

export default function SuggestionsBar() {
  const { suggestions, suggestionsLoading, search, results } = useExplore();

  if (!results) return null;
  if (suggestionsLoading) {
    return (
      <div className="suggestions-bar">
        <p className="suggestions-bar__title" style={{ opacity: 0.6 }}>Generando suggerimenti...</p>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="suggestions-bar">
      <p className="suggestions-bar__title">Potrebbe interessarti anche:</p>
      <div className="suggestions-bar__list">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            className="suggestion-btn"
            onClick={() => search(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
