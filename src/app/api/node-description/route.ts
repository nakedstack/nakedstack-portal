// ============================================================
// POST /api/node-description
// Genera una descrizione dettagliata per un nodo della mappa
// usando il contesto dei nodi parent e la cronologia chat.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import * as db from '@/lib/db';
import type { Language, DetailLevel } from '@/lib/ai/prompts';

interface ParentNode {
  label: string;
  relation: string;
}

interface NodeDescriptionRequest {
  conceptMapId: number;
  nodeId: string;
  nodeLabel: string;
  nodeGroup: string;
  topic: string;
  language: Language;
  detailLevel: DetailLevel;
  parentNodes: ParentNode[];
  chatContext: string;
  /** Se true, salta la cache e genera una nuova versione */
  regenerate?: boolean;
}

const LANGUAGE_NAMES: Record<string, string> = {
  it: 'italiano', en: 'inglese', es: 'spagnolo', fr: 'francese',
};

const DETAIL_INSTRUCTIONS: Record<string, string> = {
  base: 'Spiega in modo semplice e accessibile, adatto a un pubblico generico. Usa analogie quotidiane.',
  intermedio: 'Spiega con dettaglio tecnico moderato, per persone con conoscenze informatiche di base.',
  avanzato: 'Spiega in profondità, includendo dettagli implementativi, casi limite, e considerazioni architetturali.',
};

export async function POST(request: NextRequest) {
  try {
    const body: NodeDescriptionRequest = await request.json();
    const {
      conceptMapId,
      nodeId,
      nodeLabel,
      nodeGroup,
      topic,
      language = 'it',
      detailLevel = 'base',
      parentNodes = [],
      chatContext = '',
      regenerate = false,
    } = body;

    if (!nodeLabel) {
      return NextResponse.json({ error: 'nodeLabel is required' }, { status: 400 });
    }
    if (!conceptMapId || !nodeId) {
      return NextResponse.json({ error: 'conceptMapId and nodeId are required for caching' }, { status: 400 });
    }

    // === Cache: verifica se la descrizione esiste già (salta se regenerate) ===
    if (!regenerate) {
      const cached = await db.getNodeDescription(conceptMapId, nodeId);
      if (cached) {
        return NextResponse.json({ description: cached, cached: true });
      }
    }

    const langName = LANGUAGE_NAMES[language] || 'italiano';
    const detailInst = DETAIL_INSTRUCTIONS[detailLevel] || DETAIL_INSTRUCTIONS.base;

    // Costruisci il contesto dai nodi parent
    const parentContext = parentNodes.length > 0
      ? parentNodes.map(p => `- "${p.label}" (relazione: ${p.relation})`).join('\n')
      : 'Nessun nodo collegato.';

    // Contesto della chat (ultimi messaggi, troncato se troppo lungo)
    const chatSnippet = chatContext
      ? `\n\nCRONOLOGIA CHAT RECENTE (per contesto):\n${chatContext.slice(0, 1500)}`
      : '';

    const client = getDeepSeekClient();

    const systemPrompt = `Sei un esperto che genera descrizioni concise e dettagliate di singoli concetti all'interno di una mappa concettuale.

REGOLE:
1. Rispondi ESCLUSIVAMENTE in ${langName}.
2. ${detailInst}
3. Scrivi 2-3 paragrafi brevi (massimo 200 parole totali).
4. NON usare elenchi puntati. Usa prosa fluida.
5. NON usare emoji.
6. NON menzionare la chat o il contesto — descrivi solo il concetto.
7. Riferisciti al concetto nel contesto dell'argomento principale "${topic}".
8. Usa i nodi collegati come spunti per approfondire il concetto in relazione ad essi.`;

    const userPrompt = `Argomento principale: "${topic}"

Concetto da descrivere: "${nodeLabel}"
Categoria: ${nodeGroup}

Nodi collegati (relazioni in entrata):
${parentContext}
${chatSnippet}

Genera una descrizione dettagliata del concetto "${nodeLabel}" nel contesto di "${topic}".`;

    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 512,
    });

    const description = completion.choices[0]?.message?.content || '';

    // === Salva in cache per usi futuri (via conceptMapId + nodeId) ===
    if (description) {
      await db.saveNodeDescription(conceptMapId, nodeId, nodeLabel, nodeGroup, description.trim());
    }

    return NextResponse.json({ description: description.trim(), cached: false });
  } catch (error) {
    console.error('Node description API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
