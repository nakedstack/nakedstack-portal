import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import type { Language, DetailLevel } from '@/lib/ai/prompts';

const DETAIL_INSTRUCTIONS: Record<DetailLevel, string> = {
  base: 'aggiungi una spiegazione semplice, con analogia se utile, adatta a principianti',
  intermedio: 'aggiungi dettagli tecnici e un esempio pratico',
  avanzato: 'aggiungi dettagli implementativi profondi, edge case e considerazioni architetturali',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paragraph: string = body.paragraph?.trim();
    const term: string = body.term?.trim();
    const language: Language = body.language || 'it';
    const detailLevel: DetailLevel = body.detailLevel || 'base';
    const customInstruction: string = body.customInstruction?.trim() || '';

    if (!paragraph || !term) {
      return NextResponse.json({ error: 'paragraph and term are required' }, { status: 400 });
    }

    const client = getDeepSeekClient();

    const langMap: Record<string, string> = { it: 'italiano', en: 'inglese', es: 'spagnolo', fr: 'francese' };
    const langName = langMap[language] || 'italiano';
    const detailInst = DETAIL_INSTRUCTIONS[detailLevel];

    const enrichmentGoal = customInstruction
      ? `Riguardo al termine "${term}", l'utente chiede: "${customInstruction}". Rispondi a questa richiesta integrando la risposta nel paragrafo.`
      : `inserisci una spiegazione piu approfondita, fluida e naturale, integrata nel discorso. ${detailInst}.`;

    const prompt = `Riscrivi il seguente paragrafo in ${langName}, arricchendolo in base alla richiesta sul termine "${term}".

Regole:
- Il termine "${term}" DEVE comparire nel testo riscritto almeno una volta.
- ${enrichmentGoal}
- NON cambiare l'argomento generale del paragrafo. Arricchisci SOLO la parte relativa a "${term}".
- Mantieni lo stesso tono e stile del paragrafo originale.
- NON aggiungere convenevoli, introduzioni o conclusioni. Restituisci SOLO il paragrafo riscritto.
- NON usare emoji.
- NON racchiudere la risposta tra virgolette.
- NON usare parentesi quadre, asterischi doppi o altri marcatori attorno al termine.
- Se il paragrafo originale e in ${langName}, rispondi in ${langName}.

Paragrafo originale:
"""
${paragraph}
"""`;

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 2048,
    });

    const expanded = completion.choices[0]?.message?.content?.trim() || paragraph;

    return NextResponse.json({
      term,
      original: paragraph,
      expanded,
    });
  } catch (error) {
    console.error('Expand API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
