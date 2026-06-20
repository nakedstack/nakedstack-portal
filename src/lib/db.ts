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

let initialized = false;

async function ensureSchema(): Promise<void> {
  if (initialized) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        results JSONB,
        chat_history JSONB DEFAULT '[]'::jsonb,
        language TEXT DEFAULT 'it',
        detail_level TEXT DEFAULT 'base',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at DESC);

      CREATE TABLE IF NOT EXISTS concept_maps (
        hash TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        language TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_concept_maps_created_at ON concept_maps(created_at DESC);
    `);
    initialized = true;
  } finally {
    client.release();
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

export async function getTopics(): Promise<SavedTopic[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT * FROM topics ORDER BY created_at DESC'
  );
  return rows.map(rowToTopic);
}

export async function getTopic(id: string): Promise<SavedTopic | null> {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT * FROM topics WHERE id = $1',
    [id]
  );
  return rows.length > 0 ? rowToTopic(rows[0]) : null;
}

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

  const { rows } = await pool.query(
    `INSERT INTO topics (id, title, results, chat_history, language, detail_level)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       results = EXCLUDED.results,
       chat_history = EXCLUDED.chat_history,
       language = EXCLUDED.language,
       detail_level = EXCLUDED.detail_level
     RETURNING *`,
    [id, topic.title, results, chatHistory, topic.language || 'it', topic.detailLevel || 'base']
  );

  return rowToTopic(rows[0]);
}

export async function deleteTopic(id: string): Promise<void> {
  await ensureSchema();
  await pool.query('DELETE FROM topics WHERE id = $1', [id]);
}

export async function updateTopicChat(id: string, chatHistory: ChatEntry[]): Promise<void> {
  await ensureSchema();
  await pool.query(
    'UPDATE topics SET chat_history = $1::jsonb WHERE id = $2',
    [JSON.stringify(chatHistory), id]
  );
}

// ============================================================
// Concept Map — Queries (SRP: separate dal CRUD topics)
// ============================================================

export async function getConceptMap(hash: string): Promise<ConceptMapPayload | null> {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT payload FROM concept_maps WHERE hash = $1',
    [hash]
  );
  if (rows.length === 0) return null;
  return rows[0].payload as ConceptMapPayload;
}

export async function saveConceptMap(
  hash: string,
  topic: string,
  language: string,
  payload: ConceptMapPayload,
): Promise<void> {
  await ensureSchema();
  await pool.query(
    `INSERT INTO concept_maps (hash, topic, language, payload)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (hash) DO UPDATE SET
       payload = EXCLUDED.payload,
       created_at = NOW()`,
    [hash, topic, language, JSON.stringify(payload)]
  );
}

export async function deleteConceptMap(hash: string): Promise<void> {
  await ensureSchema();
  await pool.query('DELETE FROM concept_maps WHERE hash = $1', [hash]);
}

export async function conceptMapExists(hash: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT 1 FROM concept_maps WHERE hash = $1 LIMIT 1',
    [hash]
  );
  return rows.length > 0;
}
