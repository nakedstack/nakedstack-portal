'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAncestors } from '@/lib/api/pages-api';
import type { Page } from '@/lib/types/pages';

export function usePageAncestors(pageId: string) {
  const [ancestors, setAncestors] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    fetchAncestors(pageId)
      .then(setAncestors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pageId]);

  useEffect(() => { load(); }, [load]);

  return { ancestors, loading };
}
