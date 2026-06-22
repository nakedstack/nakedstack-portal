'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPageWithBlocks, apiUpdatePage } from '@/lib/api/pages-api';
import { apiCreateBlock, apiUpdateBlock, apiDeleteBlock } from '@/lib/api/blocks-api';
import type { Block, BlockType, BlockContent, Page } from '@/lib/types/pages';
import type { BlockDraft, IBlockWriter } from '@/lib/types/ai';

const DEBOUNCE_MS = 500;

export function usePageEditor(pageId: string) {
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingUpdates = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPageWithBlocks(pageId)
      .then(async ({ page: p, blocks: fetched }) => {
        if (cancelled) return;
        // Garantisce sempre almeno un blocco paragrafo per nuove pagine vuote
        let initialBlocks = fetched;
        if (fetched.length === 0) {
          const first = await apiCreateBlock({ page_id: pageId, type: 'paragraph', position: 0 });
          initialBlocks = cancelled ? [] : [first];
        }
        if (!cancelled) { setPage(p); setBlocks(initialBlocks); setError(null); }
      })
      .catch(() => { if (!cancelled) setError('Failed to load page'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [pageId]);

  // Optimistic update + debounced persist
  const updateBlockContent = useCallback((id: string, content: BlockContent) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));

    if (pendingUpdates.current.has(id)) clearTimeout(pendingUpdates.current.get(id)!);
    pendingUpdates.current.set(id, setTimeout(() => {
      apiUpdateBlock(id, { content }).catch(console.error);
      pendingUpdates.current.delete(id);
    }, DEBOUNCE_MS));
  }, []);

  const convertBlockType = useCallback(async (id: string, type: BlockType) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, type } : b));
    await apiUpdateBlock(id, { type });
  }, []);

  const insertBlockAfter = useCallback(async (afterId: string, type: BlockType): Promise<Block> => {
    const afterBlock = blocks.find(b => b.id === afterId);
    const position = afterBlock ? afterBlock.position + 1 : blocks.length;

    // Shift positions of subsequent blocks optimistically
    setBlocks(prev => prev.map(b => b.position >= position ? { ...b, position: b.position + 1 } : b));

    const newBlock = await apiCreateBlock({ page_id: pageId, type, position });
    setBlocks(prev => {
      const filtered = prev.filter(b => b.id !== newBlock.id);
      return [...filtered, newBlock].sort((a, b) => a.position - b.position);
    });
    return newBlock;
  }, [blocks, pageId]);

  const deleteBlock = useCallback(async (id: string) => {
    let wasLast = false;
    setBlocks(prev => {
      const next = prev.filter(b => b.id !== id);
      wasLast = next.length === 0;
      return next;
    });
    await apiDeleteBlock(id);
    // Se era l'ultimo blocco, ricrea un paragrafo vuoto come segnaposto
    if (wasLast) {
      const first = await apiCreateBlock({ page_id: pageId, type: 'paragraph', position: 0 });
      setBlocks([first]);
    }
  }, [pageId]);

  const updateTitle = useCallback(async (title: string) => {
    if (!page) return;
    setPage(prev => prev ? { ...prev, title } : prev);
    await apiUpdatePage(pageId, { title });
  }, [page, pageId]);

  // ── Bulk operations (IBlockWriter) ──────────────────────────────────────────

  const insertBlocksBulk = useCallback(async (drafts: BlockDraft[], afterId?: string): Promise<void> => {
    if (drafts.length === 0) return;
    const afterBlock = afterId ? blocks.find(b => b.id === afterId) : null;
    let startPosition = afterBlock ? afterBlock.position + 1 : blocks.length;

    const created: Block[] = [];
    for (const draft of drafts) {
      const b = await apiCreateBlock({
        page_id: pageId,
        type: draft.type,
        content: draft.content,
        position: startPosition++,
      });
      created.push(b);
    }
    setBlocks(prev => [...prev, ...created].sort((a, b) => a.position - b.position));
  }, [blocks, pageId]);

  const replaceAllBlocks = useCallback(async (drafts: BlockDraft[]): Promise<void> => {
    // Delete all existing blocks
    const toDelete = [...blocks];
    setBlocks([]);
    await Promise.all(toDelete.map(b => apiDeleteBlock(b.id).catch(console.error)));

    // Insert new drafts sequentially
    const created: Block[] = [];
    for (let i = 0; i < drafts.length; i++) {
      const b = await apiCreateBlock({
        page_id: pageId,
        type: drafts[i].type,
        content: drafts[i].content,
        position: i,
      });
      created.push(b);
    }
    setBlocks(created);
  }, [blocks, pageId]);

  /** IBlockWriter implementation (D of SOLID) */
  const blockWriter: IBlockWriter = { insertBlocksBulk, replaceAllBlocks };

  return { page, blocks, loading, error, updateBlockContent, convertBlockType, insertBlockAfter, deleteBlock, updateTitle, insertBlocksBulk, replaceAllBlocks, blockWriter };
}
