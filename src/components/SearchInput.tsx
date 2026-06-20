'use client';

import { useState, useRef, FormEvent } from 'react';
import { useExplore } from '@/lib/explore-context';
import { MagnifyingGlass } from '@phosphor-icons/react';

export default function SearchInput() {
  const { search, isLoading } = useExplore();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    search(trimmed);
  };

  const handleExampleClick = (query: string) => {
    setValue(query);
    search(query);
  };

  return (
    <div className="explore__search-wrap">
      <div className="explore__search-bar">
        <span className="explore__search-icon">
          <MagnifyingGlass size={20} weight="duotone" />
        </span>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="explore__search-input"
            placeholder="Cosa vuoi esplorare?"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isLoading}
            aria-label="Cerca argomento"
          />
          <button
            type="submit"
            className="explore__search-btn"
            disabled={isLoading || !value.trim()}
          >
            {isLoading ? '...' : 'Cerca'}
          </button>
        </form>
      </div>
      <div className="explore__examples" style={{ marginTop: '0.75rem' }}>
        <button onClick={() => handleExampleClick("Come funziona il kernel Linux?")}>Come funziona il kernel Linux?</button>
        <button onClick={() => handleExampleClick("Cos'è un database ACID?")}>Cos&apos;è un database ACID?</button>
        <button onClick={() => handleExampleClick("Spiegami la crittografia TLS")}>Spiegami la crittografia TLS</button>
      </div>
    </div>
  );
}
