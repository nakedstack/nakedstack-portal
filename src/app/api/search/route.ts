import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import { buildSystemPrompt, type Language, type DetailLevel } from '@/lib/ai/prompts';
import { parseResponse } from '@/lib/ai/parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query: string = body.query?.trim();
    const language: Language = body.language || 'it';
    const detailLevel: DetailLevel = body.detailLevel || 'base';

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const client = getDeepSeekClient();
    const systemPrompt = buildSystemPrompt(language, detailLevel);

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const rawContent = completion.choices[0]?.message?.content || '';
    const parsed = parseResponse(rawContent);

    // query NON va nei risultati: è responsabilità del client tracciarla.
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Search API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
