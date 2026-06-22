import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import { buildChatSystemPrompt, type Language, type DetailLevel } from '@/lib/ai/prompts';
import type { ChatEntry } from '@/lib/types/pages';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      message: string;
      history?: ChatEntry[];
      language?: Language;
      detailLevel?: DetailLevel;
      pageTitle?: string;
    };

    const { message, history = [], language = 'it', detailLevel = 'base', pageTitle = '' } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const client = getDeepSeekClient();
    const systemPrompt = buildChatSystemPrompt(language, detailLevel, `Page: "${pageTitle}" (id: ${id})`);

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    const reply = completion.choices[0]?.message?.content ?? '';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[POST /api/pages/[id]/chat]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
