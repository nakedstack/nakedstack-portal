import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import { buildChatSystemPrompt, type Language, type DetailLevel } from '@/lib/ai/prompts';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const history: ChatMessage[] = body.history || [];
    const question: string = body.question?.trim();
    const language: Language = body.language || 'it';
    const detailLevel: DetailLevel = body.detailLevel || 'base';

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const client = getDeepSeekClient();
    const systemPrompt = buildChatSystemPrompt(language, detailLevel);

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: question },
    ];

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      question,
      answer: content,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
