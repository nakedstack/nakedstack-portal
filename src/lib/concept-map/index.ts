// ============================================================
// Concept Map Library — Barrel Export
// ============================================================

export type { IConceptMapCache, CacheKey, ConceptMapCacheFactory } from './cache';
export {
  DatabaseConceptMapCache,
  deriveCacheKey,
  getConceptMapCache,
  setConceptMapCache,
} from './db-cache';
