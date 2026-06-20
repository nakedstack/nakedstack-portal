// ============================================================
// DatabaseConceptMapCache — Implementazione PostgreSQL (OCP)
// ============================================================
//
// Single Responsibility Principle:
//   Unica responsabilità: tradurre le operazioni di cache
//   in query sul database PostgreSQL.
//
// Open/Closed Principle:
//   Implementa IConceptMapCache senza modificarne il contratto.
//   Nuove strategie di cache (Redis, file, etc.) possono essere
//   aggiunte senza toccare questo file.
//
// Dependency Inversion Principle:
//   Dipende dall'astrazione IConceptMapCache, non da dettagli.

import type { IConceptMapCache, CacheKey } from './cache';
import type { ConceptMapPayload } from '@/components/concept-map/types';
import * as db from '@/lib/db';

/**
 * Deriva una chiave di cache deterministica da topicId + language.
 *
 * Single Responsibility: solo calcolo della chiave.
 */
export function deriveCacheKey(topicId: string, language: string): CacheKey {
  return { topicId, language };
}

/**
 * Implementazione PostgreSQL del cache delle mappe concettuali.
 *
 * Usa la tabella `concept_maps` per persistenza.
 * Ogni operazione è atomica e idempotente grazie a ON CONFLICT.
 */
export class DatabaseConceptMapCache implements IConceptMapCache {
  async get(key: CacheKey): Promise<{ id: number; payload: ConceptMapPayload } | null> {
    const row = await db.getLatestConceptMap(key.topicId, key.language);
    if (!row) return null;
    return { id: row.id, payload: row.payload };
  }

  async set(key: CacheKey, payload: ConceptMapPayload): Promise<number> {
    const result = await db.saveConceptMap(key.topicId, key.language, payload);
    return result.id;
  }

  async delete(key: CacheKey): Promise<void> {
    await db.deleteConceptMap(key.topicId, key.language);
  }

  async has(key: CacheKey): Promise<boolean> {
    return db.conceptMapExists(key.topicId, key.language);
  }
}

/**
 * Istanza singleton condivisa (lazy initialization).
 * In produzione si può sostituire con un'altra implementazione
 * iniettandola via factory.
 */
let _instance: IConceptMapCache | null = null;

export function getConceptMapCache(): IConceptMapCache {
  if (!_instance) {
    _instance = new DatabaseConceptMapCache();
  }
  return _instance;
}

/**
 * Permette di iniettare un'implementazione diversa (es. per test).
 */
export function setConceptMapCache(cache: IConceptMapCache): void {
  _instance = cache;
}
