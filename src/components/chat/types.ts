// ============================================================
// Chat — Contratto dell'adapter (Dependency Inversion Principle)
// ------------------------------------------------------------
// Il componente <Chat> dipende SOLO da questa astrazione.
// Ogni contesto (topic, nodo, ...) fornisce la propria
// implementazione senza modificare il componente.
// ============================================================

import type { ChatEntry } from '@/lib/storage';

export type { ChatEntry };

export interface ChatAdapter {
  /** Cronologia messaggi da mostrare */
  history: ChatEntry[];
  /** True mentre una risposta e in arrivo */
  isLoading: boolean;
  /** True mentre l'agent di arricchimento lavora in background */
  isEnriching: boolean;
  /** Testo placeholder dell'input */
  placeholder: string;
  /** Messaggio mostrato quando la chat e vuota */
  emptyHint: string;
  /** Invia un messaggio (gestisce contesto, API, persistenza, enrichment) */
  send: (message: string) => void | Promise<void>;
  /** Gestione click su una parola chiave [[termine]] */
  onKeywordClick?: (term: string) => void;
}
