import type { Block, BlockType, BlockContent } from '@/lib/types/pages';

export async function apiCreateBlock(data: {
  page_id: string;
  parent_block_id?: string | null;
  type: BlockType;
  content?: BlockContent;
  position?: number;
}): Promise<Block> {
  const res = await fetch('/api/blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create block');
  return res.json() as Promise<Block>;
}

export async function apiUpdateBlock(
  id: string,
  data: { content?: BlockContent; type?: BlockType },
): Promise<Block> {
  const res = await fetch(`/api/blocks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update block');
  return res.json() as Promise<Block>;
}

export async function apiDeleteBlock(id: string): Promise<void> {
  const res = await fetch(`/api/blocks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete block');
}

export async function apiReorderBlocks(pageId: string, orderedIds: string[]): Promise<void> {
  const res = await fetch('/api/blocks/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page_id: pageId, ordered_ids: orderedIds }),
  });
  if (!res.ok) throw new Error('Failed to reorder blocks');
}
