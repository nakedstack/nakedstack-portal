import { Pool } from 'pg';
import type { ParsedResponse } from '@/lib/ai/parser';
import type { Language, DetailLevel } from '@/lib/ai/prompts';
import type { ConceptMapPayload } from '@/components/concept-map/types';

// ---- Connection ----

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

async function ensureSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    // === All'avvio: ricrea ogni tabella se la struttura non corrisponde ===
    await ensureTableColumns(client, 'topics', [
      'id', 'version', 'title', 'results', 'chat_history', 'language', 'detail_level', 'created_at',
    ]);
    await ensureTableColumns(client, 'concept_maps', [
      'id', 'topic_id', 'language', 'version', 'payload', 'created_at',
    ]);
    await ensureTableColumns(client, 'node_descriptions', [
      'id', 'concept_map_id', 'node_id', 'version', 'node_label', 'node_group', 'description', 'created_at',
    ]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id TEXT NOT NULL,
        version INT NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        results JSONB,
        chat_history JSONB DEFAULT '[]'::jsonb,
        language TEXT DEFAULT 'it',
        detail_level TEXT DEFAULT 'base',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (id, version)
      );

      CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at DESC);

      CREATE TABLE IF NOT EXISTS concept_maps (
        id BIGSERIAL PRIMARY KEY,
        topic_id TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'it',
        version INT NOT NULL DEFAULT 1,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (topic_id, language, version)
      );

      CREATE INDEX IF NOT EXISTS idx_concept_maps_created_at ON concept_maps(created_at DESC);

      CREATE TABLE IF NOT EXISTS node_descriptions (
        id BIGSERIAL PRIMARY KEY,
        concept_map_id BIGINT NOT NULL REFERENCES concept_maps(id) ON DELETE CASCADE,
        node_id TEXT NOT NULL,
        version INT NOT NULL DEFAULT 1,
        node_label TEXT NOT NULL DEFAULT '',
        node_group TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (concept_map_id, node_id, version)
      );

      CREATE INDEX IF NOT EXISTS idx_node_descriptions_created_at ON node_descriptions(created_at DESC);
    `);
  } finally {
    client.release();
  }
}

/**
 * Se la tabella esiste ma manca anche una sola colonna attesa → DROP.
 * CREATE TABLE IF NOT EXISTS (chiamato subito dopo) la ricrea corretta.
 */
async function ensureTableColumns(
  client: import('pg').PoolClient,
  tableName: string,
  expectedColumns: string[],
): Promise<void> {
  // Whitelist: solo tabelle note
  const ALLOWED = ['topics', 'concept_maps', 'node_descriptions'];
  if (!ALLOWED.includes(tableName)) return;

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

  const missing = expectedColumns.filter(c => !existing.has(c));
  if (missing.length > 0) {
    console.log(`[db] ${tableName}: struttura obsoleta (mancano: ${missing.join(', ')}), ricreazione...`);
    await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
  }
}

// ---- Schema (called once on startup) ----

export async function initSchema(): Promise<void> {
  await ensureSchema();
}

// ---- Types ----

export interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface SavedTopic {
  id: string;
  title: string;
  createdAt: number;
  results: ParsedResponse | null;
  chatHistory: ChatEntry[];
  language: Language;
  detailLevel: DetailLevel;
}

// ---- Helpers ----

function rowToTopic(row: Record<string, unknown>): SavedTopic {
  return {
    id: row.id as string,
    title: row.title as string,
    createdAt: new Date(row.created_at as string).getTime(),
    results: row.results as ParsedResponse | null,
    chatHistory: (row.chat_history as ChatEntry[]) || [],
    language: (row.language as Language) || 'it',
    detailLevel: (row.detail_level as DetailLevel) || 'base',
  };
}

// ---- Queries ----

/** Ritorna l'ultima versione di ogni topic (per la sidebar) */
export async function getTopics(): Promise<SavedTopic[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (id) * FROM topics ORDER BY id, version DESC`
  );
  return rows.map(rowToTopic);
}

/** Ritorna l'ultima versione di un topic */
export async function getTopic(id: string): Promise<SavedTopic | null> {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT * FROM topics WHERE id = $1 ORDER BY version DESC LIMIT 1',
    [id]
  );
  return rows.length > 0 ? rowToTopic(rows[0]) : null;
}

/** Crea una nuova versione del topic (sempre INSERT) */
export async function saveTopic(topic: {
  id?: string;
  title: string;
  results: ParsedResponse | null;
  chatHistory?: ChatEntry[];
  language?: Language;
  detailLevel?: DetailLevel;
}): Promise<SavedTopic> {
  await ensureSchema();
  const id = topic.id || `topic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const chatHistory = JSON.stringify(topic.chatHistory || []);
  const results = topic.results ? JSON.stringify(topic.results) : null;

  // Calcola la prossima versione
  const { rows: maxRow } = await pool.query(
    'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM topics WHERE id = $1',
    [id]
  );
  const nextVersion = (maxRow[0] as { next_version: number }).next_version;

  const { rows } = await pool.query(
    `INSERT INTO topics (id, version, title, results, chat_history, language, detail_level)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
     RETURNING *`,
    [id, nextVersion, topic.title, results, chatHistory, topic.language || 'it', topic.detailLevel || 'base']
  );

  return rowToTopic(rows[0]);
}

export async function deleteTopic(id: string): Promise<void> {
  await ensureSchema();
  await pool.query('DELETE FROM topics WHERE id = $1', [id]);
}

/** Aggiorna la chat_history dell'ultima versione del topic */
export async function updateTopicChat(id: string, chatHistory: ChatEntry[]): Promise<void> {
  await ensureSchema();
  await pool.query(
    `UPDATE topics SET chat_history = $1::jsonb
     WHERE id = $2 AND version = (
       SELECT MAX(version) FROM topics WHERE id = $2
     )`,
    [JSON.stringify(chatHistory), id]
  );
}

// ============================================================
// Concept Map — Queries (SRP: separate dal CRUD topics)
// ============================================================

export async function getConceptMapById(conceptMapId: number): Promise<{ id: number; version: number; payload: ConceptMapPayload } | null> {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT id, version, payload FROM concept_maps WHERE id = $1',
    [conceptMapId]
  );
  if (rows.length === 0) return null;
  return { id: rows[0].id as number, version: rows[0].version as number, payload: rows[0].payload as ConceptMapPayload };
}

/** Restituisce l'ultima versione (più recente) della mappa per topic + lingua */
export async function getLatestConceptMap(topicId: string, language: string): Promise<{ id: number; version: number; payload: ConceptMapPayload } | null> {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT id, version, payload FROM concept_maps WHERE topic_id = $1 AND language = $2 ORDER BY version DESC LIMIT 1',
    [topicId, language]
  );
  if (rows.length === 0) return null;
  return { id: rows[0].id as number, version: rows[0].version as number, payload: rows[0].payload as ConceptMapPayload };
}

/** Lista tutte le versioni disponibili per un topic */
export async function getConceptMapVersions(topicId: string, language: string): Promise<{ id: number; version: number; created_at: string }[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT id, version, created_at FROM concept_maps WHERE topic_id = $1 AND language = $2 ORDER BY version DESC',
    [topicId, language]
  );
  return rows.map(r => ({ id: r.id as number, version: r.version as number, created_at: r.created_at as string }));
}

export async function saveConceptMap(
  topicId: string,
  language: string,
  payload: ConceptMapPayload,
): Promise<{ id: number; version: number }> {
  await ensureSchema();
  // Calcola la prossima versione
  const { rows: maxRow } = await pool.query(
    'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM concept_maps WHERE topic_id = $1 AND language = $2',
    [topicId, language]
  );
  const nextVersion = (maxRow[0] as { next_version: number }).next_version;

  const { rows } = await pool.query(
    `INSERT INTO concept_maps (topic_id, language, version, payload)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, version`,
    [topicId, language, nextVersion, JSON.stringify(payload)]
  );
  return { id: rows[0].id as number, version: rows[0].version as number };
}

export async function deleteConceptMap(topicId: string, language: string): Promise<void> {
  await ensureSchema();
  await pool.query(
    'DELETE FROM concept_maps WHERE topic_id = $1 AND language = $2',
    [topicId, language]
  );
}

export async function updateConceptMapPayload(conceptMapId: number, payload: ConceptMapPayload): Promise<void> {
  await ensureSchema();
  await pool.query(
    'UPDATE concept_maps SET payload = $1::jsonb, created_at = NOW() WHERE id = $2',
    [JSON.stringify(payload), conceptMapId]
  );
}

export async function conceptMapExists(topicId: string, language: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT 1 FROM concept_maps WHERE topic_id = $1 AND language = $2 LIMIT 1',
    [topicId, language]
  );
  return rows.length > 0;
}

// ============================================================
// Node Descriptions — Queries (cache descrizioni AI per nodo)
// ============================================================

export async function getNodeDescription(conceptMapId: number, nodeId: string): Promise<string | null> {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT description FROM node_descriptions WHERE concept_map_id = $1 AND node_id = $2 ORDER BY version DESC LIMIT 1',
    [conceptMapId, nodeId]
  );
  if (rows.length === 0) return null;
  return rows[0].description as string;
}

export async function saveNodeDescription(
  conceptMapId: number,
  nodeId: string,
  nodeLabel: string,
  nodeGroup: string,
  description: string,
): Promise<void> {
  await ensureSchema();
  // Calcola la prossima versione
  const { rows: maxRow } = await pool.query(
    'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM node_descriptions WHERE concept_map_id = $1 AND node_id = $2',
    [conceptMapId, nodeId]
  );
  const nextVersion = (maxRow[0] as { next_version: number }).next_version;

  await pool.query(
    `INSERT INTO node_descriptions (concept_map_id, node_id, version, node_label, node_group, description)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [conceptMapId, nodeId, nextVersion, nodeLabel, nodeGroup, description]
  );
}
