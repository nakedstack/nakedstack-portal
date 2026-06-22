import { getPool } from './connection';
import type { Block, BlockType, BlockContent } from '@/lib/types/pages';

function rowToBlock(row: Record<string, unknown>): Block {
  return {
    id: row.id as string,
    page_id: row.page_id as string,
    parent_block_id: (row.parent_block_id as string | null) ?? null,
    type: row.type as BlockType,
    content: row.content as BlockContent,
    position: row.position as number,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  };
}

export async function getBlocks(pageId: string): Promise<Block[]> {
  const { rows } = await getPool().query(
    `SELECT * FROM blocks WHERE page_id = $1 ORDER BY position ASC`,
    [pageId],
  );
  return rows.map(rowToBlock);
}

export async function createBlock(data: {
  page_id: string;
  parent_block_id?: string | null;
  type: BlockType;
  content?: BlockContent;
  position?: number;
}): Promise<Block> {
  const position = data.position ?? await nextPosition(data.page_id, data.parent_block_id ?? null);
  const { rows } = await getPool().query(
    `INSERT INTO blocks (page_id, parent_block_id, type, content, position)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     RETURNING *`,
    [
      data.page_id,
      data.parent_block_id ?? null,
      data.type,
      JSON.stringify(data.content ?? {}),
      position,
    ],
  );
  return rowToBlock(rows[0]);
}

export async function updateBlock(
  id: string,
  data: { content?: BlockContent; type?: BlockType },
): Promise<Block> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.content !== undefined) { fields.push(`content = $${idx++}::jsonb`); values.push(JSON.stringify(data.content)); }
  if (data.type !== undefined)    { fields.push(`type = $${idx++}`);            values.push(data.type); }

  fields.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await getPool().query(
    `UPDATE blocks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return rowToBlock(rows[0]);
}

export async function deleteBlock(id: string): Promise<void> {
  await getPool().query(`DELETE FROM blocks WHERE id = $1`, [id]);
}

/**
 * Reorders blocks within a page by assigning sequential positions
 * matching the provided orderedIds array.
 */
export async function reorderBlocks(pageId: string, orderedIds: string[]): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < orderedIds.length; i++) {
      await client.query(
        `UPDATE blocks SET position = $1, updated_at = now()
         WHERE id = $2 AND page_id = $3`,
        [i, orderedIds[i], pageId],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function nextPosition(pageId: string, parentBlockId: string | null): Promise<number> {
  const { rows } = await getPool().query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next
     FROM blocks
     WHERE page_id = $1 AND parent_block_id IS NOT DISTINCT FROM $2`,
    [pageId, parentBlockId],
  );
  return (rows[0] as { next: number }).next;
}
