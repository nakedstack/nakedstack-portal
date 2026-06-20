// ============================================================
// Layout Registry
// Aggiungi qui nuovi layout — il resto del codice non cambia (OCP)
// ============================================================

import type { LayoutStrategy } from '../types';
import { dagreLayout } from './dagre-layout';
import { radialLayout } from './radial-layout';

const registry = new Map<string, LayoutStrategy>([
  [dagreLayout.id, dagreLayout],
  [radialLayout.id, radialLayout],
]);

/** Registra un nuovo algoritmo di layout */
export function registerLayout(layout: LayoutStrategy): void {
  registry.set(layout.id, layout);
}

/** Ottieni un layout per id. Fallback al radiale. */
export function getLayout(id?: string): LayoutStrategy {
  if (id && registry.has(id)) return registry.get(id)!;
  return radialLayout;
}

/** Lista layout disponibili */
export function listLayouts(): LayoutStrategy[] {
  return Array.from(registry.values());
}

export { dagreLayout, radialLayout };
