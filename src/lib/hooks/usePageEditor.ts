'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPageWithBlocks, apiUpdatePage } from '@/lib/api/pages-api';
import { apiCreateBlock, apiUpdateBlock, apiDeleteBlock } from '@/lib/api/blocks-api';
import type { Block, BlockType, BlockContent, Page } from '@/lib/types/pages';

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
      .then(({ page, blocks }) => {
        if (!cancelled) { setPage(page); setBlocks(blocks); setError(null); }
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
    setBlocks(prev => prev.filter(b => b.id !== id));
    await apiDeleteBlock(id);
  }, []);

  const updateTitle = useCallback(async (title: string) => {
    if (!page) return;
    setPage(prev => prev ? { ...prev, title } : prev);
    await apiUpdatePage(pageId, { title });
  }, [page, pageId]);

  return { page, blocks, loading, error, updateBlockContent, convertBlockType, insertBlockAfter, deleteBlock, updateTitle };
}
