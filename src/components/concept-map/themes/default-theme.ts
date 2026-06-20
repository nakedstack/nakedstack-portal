// ============================================================
// Default Theme — Tema Nakedstack originale
// ============================================================

import { createTheme } from './types';
import type { ConceptMapTheme } from '../types';

export const defaultTheme: ConceptMapTheme = createTheme({
  id: 'default',
  name: 'Nakedstack',
  groupColors: {
    concetto: '#0069FF',
    tecnologia: '#00B069',
    vantaggio: '#7B61FF',
    svantaggio: '#FF3B30',
    correlato: '#FF6D00',
  },
});
