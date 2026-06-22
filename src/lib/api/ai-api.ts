import type { AIAction, AIPageResponse } from '@/lib/types/ai';
import type { ChatEntry } from '@/lib/types/pages';

export interface CallPageAIPayload {
  message: string;
  action: AIAction;
  history: ChatEntry[];
  language?: string;
  detailLevel?: string;
}

export async function callPageAI(pageId: string, payload: CallPageAIPayload): Promise<AIPageResponse> {
  const res = await fetch(`/api/pages/${pageId}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  return res.json() as Promise<AIPageResponse>;
}
