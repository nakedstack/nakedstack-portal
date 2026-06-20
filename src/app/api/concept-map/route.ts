import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import type { Language } from '@/lib/ai/prompts';
import { getConceptMapCache, deriveCacheKey } from '@/lib/concept-map';
import * as db from '@/lib/db';

// ============================================================
// GET /api/concept-map?topicId=X&language=Y
// Lista tutte le versioni disponibili
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId')?.trim();
    const language = (searchParams.get('language') || 'it') as Language;
    const conceptMapId = searchParams.get('conceptMapId');

    // Richiesta di una versione specifica
    if (conceptMapId) {
      const cm = await db.getConceptMapById(Number(conceptMapId));
      if (!cm) {
        return NextResponse.json({ error: 'Concept map not found' }, { status: 404 });
      }
      const versions = topicId ? await db.getConceptMapVersions(topicId, language) : [];
      return NextResponse.json({
        ...cm.payload,
        conceptMapId: cm.id,
        version: cm.version,
        versions,
      });
    }

    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }

    const versions = await db.getConceptMapVersions(topicId, language);
    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Concept map GET error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================================
// POST /api/concept-map
// Body: { topic, topicId, language, regenerate? }
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic: string = body.topic?.trim();
    const topicId: string = body.topicId?.trim();
    const language: Language = body.language || 'it';
    const regenerate: boolean = body.regenerate === true;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Cache solo se abbiamo un topicId E non è richiesta rigenerazione
    if (topicId && !regenerate) {
      const cache = getConceptMapCache();
      const cacheKey = deriveCacheKey(topicId, language);

      const cached = await cache.get(cacheKey);
      if (cached) {
        const versions = await db.getConceptMapVersions(topicId, language);
        return NextResponse.json({
          ...cached.payload,
          conceptMapId: cached.id,
          version: versions[0]?.version ?? 1,
          versions,
          cached: true,
        });
      }
    }

    // === Cache Miss → Genera con AI ===
    const client = getDeepSeekClient();

    const langMap: Record<string, string> = { it: 'italiano', en: 'inglese', es: 'spagnolo', fr: 'francese' };
    const langName = langMap[language] || 'italiano';
    const safeId = topic.replace(/\s+/g, '-').toLowerCase();

    const promptLines = [
      `Genera una mappa concettuale per l'argomento "${topic}". Restituisci ESCLUSIVAMENTE un JSON valido con questa struttura:`,
      '{',
      '  "nodes": [',
      `    { "id": "identificatore-unico", "label": "Nome concetto in ${langName}", "group": "categoria" }`,
      '  ],',
      '  "edges": [',
      `    { "source": "id-nodo-partenza", "target": "id-nodo-arrivo", "relation": "tipo di relazione in ${langName}" }`,
      '  ]',
      '}',
      '',
      'Regole:',
      `- Il nodo centrale deve avere id "${safeId}" e rappresentare il concetto principale`,
      '- Crea tra 8 e 16 nodi totali, con una struttura a stella',
      '- Usa group per categorizzare (es: "concetto", "tecnologia", "vantaggio", "svantaggio", "correlato")',
      '- Ogni nodo deve essere connesso ad almeno un altro nodo',
      '- Il campo "relation" DEVE descrivere la relazione (es: "include", "genera", "utilizza")',
      '- Usa id semplici, in lowercase, senza spazi (usa trattini)',
      '- NON includere spiegazioni, solo JSON puro.',
    ];
    const prompt = promptLines.join('\n');

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

    // === Salva in cache per usi futuri (solo se abbiamo topicId) ===
    let conceptMapId: number | null = null;
    let version = 1;
    if (topicId) {
      const result = await db.saveConceptMap(topicId, language, payload);
      conceptMapId = result.id;
      version = result.version;
    }

    const versions = topicId ? await db.getConceptMapVersions(topicId, language) : [];

    return NextResponse.json({
      ...payload,
      conceptMapId,
      version,
      versions,
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
 * Aggiorna le posizioni dei nodi di una versione specifica.
 * Body: { conceptMapId, positions }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const conceptMapId: number | undefined = body.conceptMapId;
    const positions: Record<string, { x: number; y: number }> | undefined = body.positions;

    if (!conceptMapId) {
      return NextResponse.json({ error: 'conceptMapId is required' }, { status: 400 });
    }
    if (!positions || typeof positions !== 'object') {
      return NextResponse.json({ error: 'positions object is required' }, { status: 400 });
    }

    const existing = await db.getConceptMapById(conceptMapId);
    if (!existing) {
      return NextResponse.json({ error: 'Concept map not found' }, { status: 404 });
    }

    const updated = { ...existing.payload, positions };
    await db.updateConceptMapPayload(conceptMapId, updated);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Concept map PUT error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
