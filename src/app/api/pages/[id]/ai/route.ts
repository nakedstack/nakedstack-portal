import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import { type Language, type DetailLevel } from '@/lib/ai/prompts';
import { AI_ACTION_HANDLERS, parseAIBlockResponse } from '@/lib/ai/block-prompts';
import { getBlocks, getPage } from '@/lib/db/index';
import type { ChatEntry } from '@/lib/types/pages';
import type { AIAction } from '@/lib/types/ai';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      message: string;
      action?: AIAction;
      history?: ChatEntry[];
      language?: Language;
      detailLevel?: DetailLevel;
    };

    const {
      message,
      action = 'chat',
      history = [],
      language = 'it',
      detailLevel = 'base',
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Resolve page & blocks for context
    const [page, blocks] = await Promise.all([getPage(id), getBlocks(id)]);
    const pageTitle = page?.title ?? '';

    // Select prompt builder via Action Handler Map (Open/Closed Principle)
    const buildPrompt = AI_ACTION_HANDLERS[action] ?? AI_ACTION_HANDLERS.chat;
    const systemPrompt = buildPrompt(language, detailLevel, pageTitle, blocks);

    const client = getDeepSeekClient();

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: action === 'chat' ? 0.7 : 0.4,
      max_tokens: 4096,
    });

    const rawContent = completion.choices[0]?.message?.content ?? '';
    const response = parseAIBlockResponse(rawContent);

    return NextResponse.json(response);
  } catch (err) {
    console.error('[POST /api/pages/[id]/ai]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
