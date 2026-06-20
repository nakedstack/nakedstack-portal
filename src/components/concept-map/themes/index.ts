// ============================================================
// Theme Registry
// Aggiungi qui nuovi temi — il resto del codice non cambia (OCP)
// ============================================================

import type { ConceptMapTheme } from '../types';
import { defaultTheme } from './default-theme';

const registry = new Map<string, ConceptMapTheme>([
  [defaultTheme.id, defaultTheme],
]);

/** Registra un nuovo tema */
export function registerTheme(theme: ConceptMapTheme): void {
  registry.set(theme.id, theme);
}

/** Ottieni un tema per id. Fallback al default. */
export function getTheme(id?: string): ConceptMapTheme {
  if (id && registry.has(id)) return registry.get(id)!;
  return defaultTheme;
}

/** Lista temi disponibili */
export function listThemes(): ConceptMapTheme[] {
  return Array.from(registry.values());
}

export { defaultTheme };
