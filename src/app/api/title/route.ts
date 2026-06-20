import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query: string = body.query?.trim();
    const context: string = body.context?.trim() || '';

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const client = getDeepSeekClient();

    const prompt = `Genera un titolo breve e descrittivo (massimo 6-8 parole) per un argomento di studio.

Domanda dell'utente: "${query}"
${context ? `Contenuto della risposta (prime 500 parole): "${context.slice(0, 500)}"` : ''}

REGOLE:
- Scrivi SOLO il titolo, nient'altro.
- Massimo 8 parole.
- Deve essere descrittivo, chiaro e utile per ritrovare l'argomento in futuro.
- Non usare virgolette, asterischi o markup.
- Lingua: italiano.`;

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Sei un assistente che genera titoli concisi per argomenti di studio. Rispondi SOLO con il titolo.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 60,
    });

    const title = completion.choices[0]?.message?.content?.trim() || query;

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Title API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
