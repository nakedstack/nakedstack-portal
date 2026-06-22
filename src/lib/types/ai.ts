import type { BlockType, BlockContent } from './pages';

// ─── Action types ──────────────────────────────────────────────────────────────

/** What the user wants the AI to do on the page */
export type AIAction =
  | 'chat'              // Solo conversazione — nessuna modifica ai blocchi
  | 'generate'          // Genera blocchi da zero e li aggiunge
  | 'append'            // Aggiunge blocchi derivati dalla richiesta
  | 'rewrite'           // Sostituisce tutto il contenuto esistente
  | 'rewrite_selection'; // Riscrive il testo selezionato inline

// ─── Block operations ─────────────────────────────────────────────────────────

export type AIBlockOpType = 'append' | 'replace_all' | 'insert_after';

/** A block the AI wants to create (no id yet) */
export interface BlockDraft {
  type: BlockType;
  content: BlockContent;
}

/** A single operation the AI requests on the page's blocks */
export interface AIBlockOp {
  type: AIBlockOpType;
  blocks: BlockDraft[];
  /** Only for insert_after: the block id to insert after */
  afterId?: string;
}

/** Risposta completa dall'endpoint AI della pagina */
export interface AIPageResponse {
  reply: string;
  blockOps: AIBlockOp[];
  hasBlockChanges: boolean;
  /** Solo per action 'rewrite_selection': testo rielaborato da inserire nel blocco */
  inlineResult?: string;
}

// ─── IBlockWriter — Dependency Inversion (D of SOLID) ─────────────────────────

/**
 * Minimal interface the AI adapter depends on.
 * Only the two mutation methods it actually calls — not the full editor state.
 */
export interface IBlockWriter {
  /** Insert drafts at end (or after afterId if provided) and update local state */
  insertBlocksBulk: (drafts: BlockDraft[], afterId?: string) => Promise<void>;
  /** Delete ALL existing blocks, then insert drafts, update local state */
  replaceAllBlocks: (drafts: BlockDraft[]) => Promise<void>;
}
