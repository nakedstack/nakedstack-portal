// ============================================================
// ConceptMapProvider — Dependency Injection container (DIP)
// ============================================================

'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ConceptMapConfig, ConceptMapTheme, LayoutStrategy } from './types';
import { getTheme } from './themes';
import { getLayout } from './layouts';

interface ConceptMapProviderProps {
  children: ReactNode;
  /** Tema opzionale (id o istanza). Default: 'default' */
  theme?: string | ConceptMapTheme;
  /** Layout opzionale (id o istanza). Default: 'dagre' */
  layout?: string | LayoutStrategy;
}

function resolveTheme(input?: string | ConceptMapTheme): ConceptMapTheme {
  if (!input) return getTheme();
  if (typeof input === 'string') return getTheme(input);
  return input;
}

function resolveLayout(input?: string | LayoutStrategy): LayoutStrategy {
  if (!input) return getLayout();
  if (typeof input === 'string') return getLayout(input);
  return input;
}

const ConceptMapConfigContext = createContext<ConceptMapConfig | null>(null);

export function ConceptMapProvider({ children, theme, layout }: ConceptMapProviderProps) {
  const config = useMemo<ConceptMapConfig>(() => ({
    theme: resolveTheme(theme),
    layout: resolveLayout(layout),
  }), [theme, layout]);

  return (
    <ConceptMapConfigContext.Provider value={config}>
      {children}
    </ConceptMapConfigContext.Provider>
  );
}

/** Hook per accedere alla configurazione dal sottoalbero */
export function useConceptMapConfig(): ConceptMapConfig {
  const ctx = useContext(ConceptMapConfigContext);
  if (!ctx) {
    // Fallback ai default se usato fuori dal provider
    return { theme: getTheme(), layout: getLayout() };
  }
  return ctx;
}
