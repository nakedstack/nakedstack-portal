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

import { createHash } from 'crypto';
import type { IConceptMapCache, CacheKey } from './cache';
import type { ConceptMapPayload } from '@/components/concept-map/types';
import * as db from '@/lib/db';

/**
 * Deriva una chiave di cache deterministica da topic + language.
 * SHA-256 garantisce che la stessa coppia (topic, language)
 * produca sempre lo stesso hash, senza collisioni pratiche.
 *
 * Single Responsibility: solo calcolo della chiave.
 */
export function deriveCacheKey(topic: string, language: string): CacheKey {
  // Normalizza: trim + lowercase per coerenza
  const normalized = `${topic.trim().toLowerCase()}|${language}`;
  const hash = createHash('sha256').update(normalized).digest('hex');
  return { hash, topic: topic.trim(), language };
}

/**
 * Implementazione PostgreSQL del cache delle mappe concettuali.
 *
 * Usa la tabella `concept_maps` per persistenza.
 * Ogni operazione è atomica e idempotente grazie a ON CONFLICT.
 */
export class DatabaseConceptMapCache implements IConceptMapCache {
  async get(key: CacheKey): Promise<ConceptMapPayload | null> {
    return db.getConceptMap(key.hash);
  }

  async set(key: CacheKey, payload: ConceptMapPayload): Promise<void> {
    await db.saveConceptMap(key.hash, key.topic, key.language, payload);
  }

  async delete(key: CacheKey): Promise<void> {
    await db.deleteConceptMap(key.hash);
  }

  async has(key: CacheKey): Promise<boolean> {
    return db.conceptMapExists(key.hash);
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
