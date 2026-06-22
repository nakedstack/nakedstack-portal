'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchPageTree, apiCreatePage, apiUpdatePage, apiDeletePage, apiToggleFavorite } from '@/lib/api/pages-api';
import type { PageTreeNode, Page } from '@/lib/types/pages';

export function usePageTree() {
  const [tree, setTree] = useState<PageTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setTree(await fetchPageTree());
      setError(null);
    } catch {
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createPage = useCallback(async (data: { title?: string; parent_id?: string | null; icon?: string | null }): Promise<Page> => {
    const page = await apiCreatePage(data);
    await load();
    return page;
  }, [load]);

  const updatePage = useCallback(async (id: string, data: Partial<Pick<Page, 'title' | 'parent_id' | 'icon' | 'cover' | 'is_favorite'>>): Promise<Page> => {
    const page = await apiUpdatePage(id, data);
    await load();
    return page;
  }, [load]);

  const deletePage = useCallback(async (id: string): Promise<void> => {
    await apiDeletePage(id);
    await load();
  }, [load]);

  const toggleFavorite = useCallback(async (id: string): Promise<Page> => {
    const page = await apiToggleFavorite(id);
    await load();
    return page;
  }, [load]);

  return { tree, loading, error, createPage, updatePage, deletePage, toggleFavorite, reload: load };
}
