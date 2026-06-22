import type { BlockType, BlockContent } from './pages';

// ─── Action types ──────────────────────────────────────────────────────────────

/** What the user wants the AI to do on the page */
export type AIAction =
  | 'chat'     // Pure conversation — no block changes
  | 'generate' // Generate blocks from scratch and append
  | 'append'   // Append new blocks derived from a request
  | 'rewrite'; // Replace all existing blocks

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

/** Full response from the AI page endpoint */
export interface AIPageResponse {
  reply: string;
  blockOps: AIBlockOp[];
  hasBlockChanges: boolean;
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
