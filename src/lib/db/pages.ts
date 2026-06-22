import { getPool } from './connection';
import type { Page, PageTreeNode } from '@/lib/types/pages';

function rowToPage(row: Record<string, unknown>): Page {
  return {
    id: row.id as string,
    title: row.title as string,
    parent_id: (row.parent_id as string | null) ?? null,
    icon: (row.icon as string | null) ?? null,
    cover: (row.cover as string | null) ?? null,
    is_favorite: row.is_favorite as boolean,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  };
}

function buildTree(pages: Page[]): PageTreeNode[] {
  const map = new Map<string, PageTreeNode>();
  for (const p of pages) map.set(p.id, { ...p, children: [] });

  const roots: PageTreeNode[] = [];
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function getPages(): Promise<Page[]> {
  const { rows } = await getPool().query(
    `SELECT * FROM pages ORDER BY created_at ASC`,
  );
  return rows.map(rowToPage);
}

export async function getPageTree(): Promise<PageTreeNode[]> {
  const pages = await getPages();
  return buildTree(pages);
}

export async function getPage(id: string): Promise<Page | null> {
  const { rows } = await getPool().query(
    `SELECT * FROM pages WHERE id = $1`,
    [id],
  );
  return rows.length > 0 ? rowToPage(rows[0]) : null;
}

/** Returns ancestors from root → direct parent (CTE recursive query). */
export async function getPageAncestors(id: string): Promise<Page[]> {
  const { rows } = await getPool().query(
    `WITH RECURSIVE ancestors AS (
       SELECT *, 0 AS depth FROM pages WHERE id = $1
       UNION ALL
       SELECT p.*, a.depth + 1
       FROM pages p
       JOIN ancestors a ON p.id = a.parent_id
     )
     SELECT * FROM ancestors WHERE id <> $1 ORDER BY depth DESC`,
    [id],
  );
  return rows.map(rowToPage);
}

export async function createPage(data: {
  title?: string;
  parent_id?: string | null;
  icon?: string | null;
}): Promise<Page> {
  const { rows } = await getPool().query(
    `INSERT INTO pages (title, parent_id, icon)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.title ?? 'Untitled', data.parent_id ?? null, data.icon ?? null],
  );
  return rowToPage(rows[0]);
}

export async function updatePage(
  id: string,
  data: Partial<Pick<Page, 'title' | 'parent_id' | 'icon' | 'cover' | 'is_favorite'>>,
): Promise<Page> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.title !== undefined)       { fields.push(`title = $${idx++}`);       values.push(data.title); }
  if (data.parent_id !== undefined)   { fields.push(`parent_id = $${idx++}`);   values.push(data.parent_id); }
  if (data.icon !== undefined)        { fields.push(`icon = $${idx++}`);        values.push(data.icon); }
  if (data.cover !== undefined)       { fields.push(`cover = $${idx++}`);       values.push(data.cover); }
  if (data.is_favorite !== undefined) { fields.push(`is_favorite = $${idx++}`); values.push(data.is_favorite); }

  if (fields.length === 0) {
    const page = await getPage(id);
    if (!page) throw new Error(`Page ${id} not found`);
    return page;
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await getPool().query(
    `UPDATE pages SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return rowToPage(rows[0]);
}

export async function deletePage(id: string): Promise<void> {
  await getPool().query(`DELETE FROM pages WHERE id = $1`, [id]);
}

export async function toggleFavorite(id: string): Promise<Page> {
  const { rows } = await getPool().query(
    `UPDATE pages SET is_favorite = NOT is_favorite, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id],
  );
  return rowToPage(rows[0]);
}
