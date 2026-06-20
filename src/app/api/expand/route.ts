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
      ? `Riguardo al termine "${term}", l'utente chiede: "${customInstruction}". Rispondi a questa richiesta integrando la risposta nel testo.`
      : `inserisci una spiegazione piu approfondita, fluida e naturale, integrata nel discorso. ${detailInst}.`;

    const prompt = `Espandi e arricchisci il seguente testo in ${langName}, approfondendo il termine "${term}".

Regole:
- Il termine "${term}" DEVE comparire nel testo arricchito almeno una volta.
- ${enrichmentGoal}
- NON cambiare l'argomento generale del testo. Approfondisci SOLO la parte relativa a "${term}".
- Puoi aggiungere paragrafi aggiuntivi, elenchi puntati ("- ") o numerati ("1. "), esempi pratici, tabelle markdown (| Col | Col | / |---|---| / | val | val |) o blocchi di codice \`\`\`nomelingua ... \`\`\` dove utile. Separa paragrafi con una riga vuota.
- Usa **grassetto** per i termini tecnici piu importanti.
- Usa [[termine]] per i concetti chiave che l'utente potrebbe voler approfondire (massimo 4, solo concetti tecnici significativi). Il termine "${term}" puo essere marcato come [[${term}]] se appropriato.
- NON aggiungere convenevoli, introduzioni o conclusioni. Restituisci SOLO il contenuto arricchito.
- NON usare emoji.
- NON racchiudere la risposta tra virgolette.
- Usa SEMPRE marcatori bilanciati: ogni **, \` e [[ deve avere la chiusura corrispondente (**, \` e ]]).
- Se il testo originale e in ${langName}, rispondi in ${langName}.

Testo originale:
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
