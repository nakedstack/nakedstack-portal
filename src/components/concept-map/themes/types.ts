// ============================================================
// Theme Strategy — Interface
// ============================================================

import type { ConceptMapTheme } from '../types';

/** Factory: crea un tema a partire da una configurazione parziale */
export function createTheme(overrides: Partial<ConceptMapTheme> & { id: string; name: string }): ConceptMapTheme {
  return {
    groupColors: {},
    defaultColor: '#8895AD',
    nodeTextColor: '#FFFFFF',
    nodeBorderColor: '#FFFFFF',
    edgeColor: '#E2E6ED',
    edgeLabelColor: '#8895AD',
    nodeLabelColor: '#031B4E',
    fontFamily: "'Space Grotesk','Segoe UI',sans-serif",
    containerStyles: {},
    ...overrides,
  };
}
