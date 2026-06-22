import type { PoolClient } from 'pg';
import { getPool } from './connection';

const EXPECTED_TABLES: Record<string, string[]> = {
  pages: ['id', 'title', 'parent_id', 'icon', 'cover', 'is_favorite', 'created_at', 'updated_at', 'deleted_at'],
  blocks: ['id', 'page_id', 'parent_block_id', 'type', 'content', 'position', 'created_at', 'updated_at'],
  concept_maps: ['id', 'topic_id', 'language', 'version', 'payload', 'created_at'],
};

async function dropTableIfSchemaMismatch(client: PoolClient, tableName: string): Promise<void> {
  if (!(tableName in EXPECTED_TABLES)) return;

  const { rows: tableExists } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_name = $1`,
    [tableName],
  );
  if (tableExists.length === 0) return;

  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    [tableName],
  );
  const existing = new Set(rows.map((r: { column_name: string }) => r.column_name));
  const missing = EXPECTED_TABLES[tableName].filter(c => !existing.has(c));

  if (missing.length > 0) {
    console.log(`[db] ${tableName}: schema mismatch (missing: ${missing.join(', ')}), recreating…`);
    await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
  }
}

export async function initSchema(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Migrazioni additive (ADD COLUMN IF NOT EXISTS): non perdono dati esistenti
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'pages'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'pages' AND column_name = 'deleted_at'
        ) THEN
          ALTER TABLE pages ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
        END IF;
      END $$;
    `);

    for (const tableName of Object.keys(EXPECTED_TABLES)) {
      await dropTableIfSchemaMismatch(client, tableName);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        title       TEXT        NOT NULL DEFAULT 'Untitled',
        parent_id   UUID        REFERENCES pages(id) ON DELETE SET NULL,
        icon        TEXT,
        cover       TEXT,
        is_favorite BOOLEAN     NOT NULL DEFAULT false,
        deleted_at  TIMESTAMPTZ DEFAULT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);

      CREATE TABLE IF NOT EXISTS blocks (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id         UUID        NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
        parent_block_id UUID        REFERENCES blocks(id) ON DELETE CASCADE,
        type            TEXT        NOT NULL,
        content         JSONB       NOT NULL DEFAULT '{}',
        position        INTEGER     NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_blocks_page_id  ON blocks(page_id);
      CREATE INDEX IF NOT EXISTS idx_blocks_position ON blocks(page_id, position);

      CREATE TABLE IF NOT EXISTS concept_maps (
        id         BIGSERIAL   PRIMARY KEY,
        topic_id   TEXT        NOT NULL,
        language   TEXT        NOT NULL DEFAULT 'it',
        version    INT         NOT NULL DEFAULT 1,
        payload    JSONB       NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (topic_id, language, version)
      );

      CREATE INDEX IF NOT EXISTS idx_concept_maps_created_at ON concept_maps(created_at DESC);
    `);
  } finally {
    client.release();
  }
}
