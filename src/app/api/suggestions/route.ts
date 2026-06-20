import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import type { Language } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic: string = body.topic?.trim();
    const context: string = body.context?.trim() || '';
    const language: Language = body.language || 'it';

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const client = getDeepSeekClient();

    const langMap: Record<string, string> = { it: 'italiano', en: 'inglese', es: 'spagnolo', fr: 'francese' };
    const langName = langMap[language] || 'italiano';

    const prompt = context
      ? `L'utente sta leggendo informazioni su "${topic}". Contesto aggiuntivo: ${context}. Genera 3 domande complementari che l'utente potrebbe volersi fare per approfondire l'argomento. Scrivi le domande in ${langName}. Ogni domanda su una riga separata, senza numerazione, senza trattini, senza emoji. Solo il testo della domanda.`
      : `L'utente ha appena letto una spiegazione su "${topic}". Genera 3 domande complementari che l'utente potrebbe volersi fare per approfondire l'argomento. Scrivi le domande in ${langName}. Ogni domanda su una riga separata, senza numerazione, senza trattini, senza emoji. Solo il testo della domanda.`;

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 512,
    });

    const rawContent = completion.choices[0]?.message?.content || '';
    const suggestions = rawContent
      .split('\n')
      .map(line => line.replace(/^[-*\d.]\s*/, '').trim())
      .filter(line => line.length > 0 && line.endsWith('?'));

    return NextResponse.json({
      topic,
      suggestions: suggestions.slice(0, 3),
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
