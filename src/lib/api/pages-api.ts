import type { Page, PageTreeNode } from '@/lib/types/pages';

export async function fetchPageTree(): Promise<PageTreeNode[]> {
  const res = await fetch('/api/pages');
  if (!res.ok) throw new Error('Failed to fetch page tree');
  return res.json() as Promise<PageTreeNode[]>;
}

export async function fetchPageWithBlocks(id: string) {
  const res = await fetch(`/api/pages/${id}`);
  if (!res.ok) throw new Error('Failed to fetch page');
  return res.json() as Promise<{ page: Page; blocks: import('@/lib/types/pages').Block[] }>;
}

export async function fetchAncestors(id: string): Promise<Page[]> {
  const res = await fetch(`/api/pages/${id}/ancestors`);
  if (!res.ok) throw new Error('Failed to fetch ancestors');
  return res.json() as Promise<Page[]>;
}

export async function apiCreatePage(data: {
  title?: string;
  parent_id?: string | null;
  icon?: string | null;
}): Promise<Page> {
  const res = await fetch('/api/pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create page');
  return res.json() as Promise<Page>;
}

export async function apiUpdatePage(
  id: string,
  data: Partial<Pick<Page, 'title' | 'parent_id' | 'icon' | 'cover' | 'is_favorite'>>,
): Promise<Page> {
  const res = await fetch(`/api/pages/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update page');
  return res.json() as Promise<Page>;
}

export async function apiDeletePage(id: string): Promise<void> {
  const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete page');
}

export async function apiToggleFavorite(id: string): Promise<Page> {
  const res = await fetch(`/api/pages/${id}/favorite`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle favorite');
  return res.json() as Promise<Page>;
}

export async function fetchDeletedPages(): Promise<Page[]> {
  const res = await fetch('/api/pages/trash');
  if (!res.ok) throw new Error('Failed to fetch deleted pages');
  return res.json() as Promise<Page[]>;
}

export async function apiRestorePage(id: string): Promise<Page> {
  const res = await fetch(`/api/pages/${id}/restore`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to restore page');
  return res.json() as Promise<Page>;
}

export async function apiPermanentDeletePage(id: string): Promise<void> {
  const res = await fetch(`/api/pages/${id}/permanent`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to permanently delete page');
}
