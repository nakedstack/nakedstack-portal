import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import type { Language } from '@/lib/ai/prompts';
import { getConceptMapCache, deriveCacheKey } from '@/lib/concept-map';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic: string = body.topic?.trim();
    const language: Language = body.language || 'it';
    const forceRefresh: boolean = body.forceRefresh === true;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const cache = getConceptMapCache();
    const cacheKey = deriveCacheKey(topic, language);

    // === Cache Hit (senza forceRefresh) ===
    if (!forceRefresh) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          ...cached,
          cached: true,
        });
      }
    }

    // === Cache Miss → Genera con AI ===
    const client = getDeepSeekClient();

    const langMap: Record<string, string> = { it: 'italiano', en: 'inglese', es: 'spagnolo', fr: 'francese' };
    const langName = langMap[language] || 'italiano';

    const prompt = `Genera una mappa concettuale per l'argomento "${topic}". Restituisci ESCLUSIVAMENTE un JSON valido con questa struttura:
{
  "nodes": [
    { "id": "identificatore-unico", "label": "Nome concetto in ${langName}", "group": "categoria" }
  ],
  "edges": [
    { "source": "id-nodo-partenza", "target": "id-nodo-arrivo", "relation": "tipo di relazione in ${langName}" }
  ]
}

Regole:
- Il nodo centrale deve avere id "${topic.replace(/\s+/g, '-').toLowerCase()}" e rappresentare il concetto principale
- Crea tra 8 e 16 nodi totali
- Usa group per categorizzare (es: "concetto", "tecnologia", "vantaggio", "svantaggio", "correlato")
- Ogni nodo deve essere connesso ad almeno un altro nodo
- Usa id semplici, in lowercase, senza spazi (usa trattini)
- NON includere spiegazioni, solo JSON puro.`;

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';

    let data: { nodes?: { id: string; label: string; group: string }[]; edges?: { source: string; target: string; relation: string }[] };
    try {
      data = JSON.parse(rawContent);
    } catch {
      return NextResponse.json({ error: 'Failed to parse concept map data', raw: rawContent }, { status: 500 });
    }

    const payload = {
      topic,
      nodes: data.nodes || [],
      edges: data.edges || [],
    };

    // === Salva in cache per usi futuri ===
    await cache.set(cacheKey, payload);

    return NextResponse.json({
      ...payload,
      cached: false,
    });
  } catch (error) {
    console.error('Concept map API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/concept-map
 * Aggiorna solo le posizioni dei nodi nella cache.
 * Body: { topic, language, positions }
 *
 * Single Responsibility: solo aggiornamento posizioni.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const topic: string = body.topic?.trim();
    const language: Language = body.language || 'it';
    const positions: Record<string, { x: number; y: number }> | undefined = body.positions;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }
    if (!positions || typeof positions !== 'object') {
      return NextResponse.json({ error: 'positions object is required' }, { status: 400 });
    }

    const cache = getConceptMapCache();
    const cacheKey = deriveCacheKey(topic, language);

    // Recupera il payload esistente
    const existing = await cache.get(cacheKey);
    if (!existing) {
      return NextResponse.json({ error: 'No cached concept map found for this topic' }, { status: 404 });
    }

    // Merge: mantieni nodi/edge originali, aggiorna solo positions
    const updated = {
      ...existing,
      positions,
    };

    await cache.set(cacheKey, updated);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Concept map PUT error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
