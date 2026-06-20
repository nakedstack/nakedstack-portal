import type { ParsedResponse } from '@/lib/ai/parser';
import type { Language, DetailLevel } from '@/lib/ai/prompts';

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

// ---- API Helpers ----

async function apiGet(path: string) {
  const res = await fetch(path);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(errBody.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiDelete(path: string) {
  const res = await fetch(path, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
}

// ---- Public API ----

export async function getTopics(): Promise<SavedTopic[]> {
  return apiGet('/api/topics');
}

export async function getTopic(id: string): Promise<SavedTopic | null> {
  return apiGet(`/api/topics?id=${encodeURIComponent(id)}`);
}

export async function saveTopic(topic: {
  id?: string;
  title: string;
  results: ParsedResponse | null;
  chatHistory?: ChatEntry[];
  language?: Language;
  detailLevel?: DetailLevel;
}): Promise<SavedTopic> {
  return apiPost('/api/topics', topic);
}

export async function deleteTopic(id: string): Promise<void> {
  return apiDelete(`/api/topics?id=${encodeURIComponent(id)}`);
}

export async function updateTopicChat(id: string, chatHistory: ChatEntry[]): Promise<void> {
  return apiPost('/api/topics', { id, chatHistory });
}

