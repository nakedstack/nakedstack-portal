import { getPool } from './connection';
import type { ConceptMapPayload } from '@/components/concept-map/types';

export async function getConceptMapById(
  conceptMapId: number,
): Promise<{ id: number; version: number; payload: ConceptMapPayload } | null> {
  const { rows } = await getPool().query(
    'SELECT id, version, payload FROM concept_maps WHERE id = $1',
    [conceptMapId],
  );
  if (rows.length === 0) return null;
  return { id: rows[0].id as number, version: rows[0].version as number, payload: rows[0].payload as ConceptMapPayload };
}

export async function getLatestConceptMap(
  topicId: string,
  language: string,
): Promise<{ id: number; version: number; payload: ConceptMapPayload } | null> {
  const { rows } = await getPool().query(
    'SELECT id, version, payload FROM concept_maps WHERE topic_id = $1 AND language = $2 ORDER BY version DESC LIMIT 1',
    [topicId, language],
  );
  if (rows.length === 0) return null;
  return { id: rows[0].id as number, version: rows[0].version as number, payload: rows[0].payload as ConceptMapPayload };
}

export async function getConceptMapVersions(
  topicId: string,
  language: string,
): Promise<{ id: number; version: number; created_at: string }[]> {
  const { rows } = await getPool().query(
    'SELECT id, version, created_at FROM concept_maps WHERE topic_id = $1 AND language = $2 ORDER BY version DESC',
    [topicId, language],
  );
  return rows.map(r => ({ id: r.id as number, version: r.version as number, created_at: r.created_at as string }));
}

export async function saveConceptMap(
  topicId: string,
  language: string,
  payload: ConceptMapPayload,
): Promise<{ id: number; version: number }> {
  const { rows: maxRow } = await getPool().query(
    'SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM concept_maps WHERE topic_id = $1 AND language = $2',
    [topicId, language],
  );
  const nextVersion = (maxRow[0] as { next_version: number }).next_version;

  const { rows } = await getPool().query(
    `INSERT INTO concept_maps (topic_id, language, version, payload)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, version`,
    [topicId, language, nextVersion, JSON.stringify(payload)],
  );
  return { id: rows[0].id as number, version: rows[0].version as number };
}

export async function deleteConceptMap(topicId: string, language: string): Promise<void> {
  await getPool().query(
    'DELETE FROM concept_maps WHERE topic_id = $1 AND language = $2',
    [topicId, language],
  );
}

export async function updateConceptMapPayload(
  conceptMapId: number,
  payload: ConceptMapPayload,
): Promise<void> {
  await getPool().query(
    'UPDATE concept_maps SET payload = $1::jsonb, created_at = NOW() WHERE id = $2',
    [JSON.stringify(payload), conceptMapId],
  );
}

export async function conceptMapExists(topicId: string, language: string): Promise<boolean> {
  const { rows } = await getPool().query(
    'SELECT 1 FROM concept_maps WHERE topic_id = $1 AND language = $2 LIMIT 1',
    [topicId, language],
  );
  return rows.length > 0;
}
