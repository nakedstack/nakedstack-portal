// ============================================================
// Concept Map Cache — Interfacce (DIP / ISP)
// ============================================================
//
// Dependency Inversion Principle:
//   I moduli di alto livello (API route) dipendono da questa
//   astrazione, non da implementazioni concrete.
//
// Interface Segregation Principle:
//   Interfacce minimali e focalizzate — solo ciò che serve.
//
// Open/Closed Principle:
//   Nuove strategie di cache (Redis, file system, etc.)
//   implementano questa interfaccia senza modificare il codice
//   esistente.

import type { ConceptMapPayload } from '@/components/concept-map/types';

/**
 * Chiave di cache deterministica per una mappa concettuale.
 * Derivata da topicId + language.
 */
export interface CacheKey {
  /** ID del topic salvato */
  readonly topicId: string;
  /** Lingua usata nella generazione */
  readonly language: string;
}

/**
 * Contratto per il caching delle mappe concettuali.
 *
 * Single Responsibility: solo operazioni CRUD di cache.
 * Ogni implementazione (DB, memoria, Redis) ha la propria
 * responsabilità di storage.
 */
export interface IConceptMapCache {
  /**
   * Recupera una mappa dalla cache.
   * @returns Oggetto con id e payload, o null se non trovato.
   */
  get(key: CacheKey): Promise<{ id: number; payload: ConceptMapPayload } | null>;

  /**
   * Salva una mappa nella cache.
   * @returns L'id del record creato/aggiornato.
   */
  set(key: CacheKey, payload: ConceptMapPayload): Promise<number>;

  /**
   * Rimuove una mappa dalla cache (es. su richiesta refresh).
   */
  delete(key: CacheKey): Promise<void>;

  /**
   * Verifica se una chiave esiste nella cache
   * (più leggero di get perché non carica il payload).
   */
  has(key: CacheKey): Promise<boolean>;
}

/**
 * Factory function type — permette di iniettare implementazioni
 * diverse senza accoppiamento.
 */
export type ConceptMapCacheFactory = () => IConceptMapCache;
