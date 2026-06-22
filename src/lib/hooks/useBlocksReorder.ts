'use client';

import { useCallback, useState } from 'react';
import { apiReorderBlocks } from '@/lib/api/blocks-api';
import type { Block } from '@/lib/types/pages';
import { arrayMove } from '@dnd-kit/sortable';

export function useBlocksReorder(
  pageId: string,
  blocks: Block[],
  onReorder: (reordered: Block[]) => void,
) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(() => setIsDragging(true), []);

  const handleDragEnd = useCallback(
    (activeId: string, overId: string) => {
      setIsDragging(false);
      if (activeId === overId) return;

      const oldIndex = blocks.findIndex(b => b.id === activeId);
      const newIndex = blocks.findIndex(b => b.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, position: i }));
      onReorder(reordered);
      apiReorderBlocks(pageId, reordered.map(b => b.id)).catch(console.error);
    },
    [blocks, pageId, onReorder],
  );

  return { isDragging, handleDragStart, handleDragEnd };
}
