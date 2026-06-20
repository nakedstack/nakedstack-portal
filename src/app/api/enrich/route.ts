// ============================================================
// POST /api/enrich — Agent di arricchimento della conoscenza
// ------------------------------------------------------------
// SRP: data una coppia domanda/risposta emersa in chat,
//   1. integra le info NUOVE nel contenuto del topic (results.text)
//   2. genera nuovi nodi/archi per la concept map
// e persiste entrambi in-place (no esplosione di versioni).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import {
  buildEnrichmentMessages,
  buildReorganizeMessages,
  type Language,
  type DetailLevel,
  type EnrichmentNode,
  type EnrichmentEdge,
} from '@/lib/ai/prompts';
import * as db from '@/lib/db';
import type { RawGraphNode, RawGraphEdge } from '@/components/concept-map/types';

interface EnrichRequest {
  topicId: string;
  language?: Language;
  detailLevel?: DetailLevel;
  question: string;
  answer: string;
  /** Nodo su cui agganciare i nuovi nodi (node chat). Opzionale per la chat del topic. */
  focusNodeId?: string | null;
}

interface EnrichmentResult {
  additions?: string;
  newNodes?: EnrichmentNode[];
  newEdges?: EnrichmentEdge[];
}

const VALID_GROUPS = new Set(['concetto', 'tecnologia', 'vantaggio', 'svantaggio', 'correlato']);

/**
 * Agent di riorganizzazione (2a fase): riordina contenuto esistente + aggiunte
 * in un documento unico e ordinato. Guardia anti-perdita: se il risultato e
 * troppo piu corto del testo combinato (probabile riassunto/troncamento), lo
 * scarta e il chiamante mantiene il testo semplicemente accodato.
 */
async function reorganizeText(
  client: ReturnType<typeof getDeepSeekClient>,
  opts: { language: Language; detailLevel: DetailLevel; topic: string; question: string; fullText: string },
): Promise<string | null> {
  const { system, user } = buildReorganizeMessages(opts);
  const completion = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.3,
    max_tokens: 8192,
  });
  const reorganized = (completion.choices[0]?.message?.content || '').trim();
  // Anti-perdita: accetta solo se non si accorcia drasticamente (>= 60% del combinato).
  if (!reorganized || reorganized.length < opts.fullText.length * 0.6) {
    return null;
  }
  return reorganized;
}

export async function POST(request: NextRequest) {
  try {
    const body: EnrichRequest = await request.json();
    const topicId = body.topicId?.trim();
    const language: Language = body.language || 'it';
    const detailLevel: DetailLevel = body.detailLevel || 'base';
    const question = body.question?.trim() || '';
    const answer = body.answer?.trim() || '';
    const focusNodeId = body.focusNodeId?.trim() || null;

    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }
    if (!answer) {
      return NextResponse.json({ error: 'answer is required' }, { status: 400 });
    }

    // === Carica stato corrente: topic + concept map ===
    const topic = await db.getTopic(topicId);
    if (!topic || !topic.results) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const conceptMap = await db.getLatestConceptMap(topicId, language);
    const existingNodes: RawGraphNode[] = conceptMap?.payload.nodes ?? [];
    const existingEdges: RawGraphEdge[] = conceptMap?.payload.edges ?? [];

    const currentText = topic.results.text;
    const topicTitle = topic.title || currentText.slice(0, 80);

    // === Chiama l'agent ===
    const { system, user } = buildEnrichmentMessages({
      language,
      detailLevel,
      topic: topicTitle,
      currentText,
      question,
      answer,
      existingNodes,
      focusNodeId,
    });

    const client = getDeepSeekClient();
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    let result: EnrichmentResult;
    try {
      result = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Failed to parse enrichment output' }, { status: 502 });
    }

    // === 1. Espansione ADDITIVA: l'agent genera SOLO il contenuto nuovo. ===
    // === 2. Riorganizzazione: un secondo agent riordina esistente + aggiunte
    //        in un documento unico e completo, preservando ogni informazione. ===
    let textUpdated = false;
    let newText = currentText;
    const additions = typeof result.additions === 'string' ? result.additions.trim() : '';
    if (additions) {
      // Fase 1: accoda le aggiunte (nessuna perdita, sempre garantita).
      const combinedText = currentText ? `${currentText}\n\n${additions}` : additions;

      // Fase 2: riorganizza il tutto; in caso di problemi resta il testo accodato.
      const reorganized = await reorganizeText(client, {
        language,
        detailLevel,
        topic: topicTitle,
        question,
        fullText: combinedText,
      });

      newText = reorganized ?? combinedText;
      await db.updateTopicResults(topicId, { ...topic.results, text: newText });
      textUpdated = true;
    }

    // === 3. Integra i nuovi nodi/archi nella concept map (merge in-place) ===
    let addedNodeCount = 0;
    let addedEdgeCount = 0;

    if (conceptMap) {
      const existingIds = new Set(existingNodes.map(n => n.id));

      // Filtra i nuovi nodi: id valido, non duplicato
      const acceptedNodes: RawGraphNode[] = [];
      for (const n of result.newNodes ?? []) {
        const id = (n?.id ?? '').toString().trim().toLowerCase().replace(/\s+/g, '-');
        const label = (n?.label ?? '').toString().trim();
        if (!id || !label || existingIds.has(id)) continue;
        const group = VALID_GROUPS.has(n?.group) ? n.group : 'correlato';
        acceptedNodes.push({ id, label, group });
        existingIds.add(id);
      }

      if (acceptedNodes.length > 0) {
        const acceptedIds = new Set(acceptedNodes.map(n => n.id));
        const validIds = new Set([...existingIds]);

        // Filtra gli edge: entrambi gli estremi devono esistere
        const acceptedEdges: RawGraphEdge[] = [];
        for (const e of result.newEdges ?? []) {
          const source = (e?.source ?? '').toString().trim().toLowerCase().replace(/\s+/g, '-');
          const target = (e?.target ?? '').toString().trim().toLowerCase().replace(/\s+/g, '-');
          const relation = (e?.relation ?? 'correlato').toString().trim() || 'correlato';
          if (!source || !target || source === target) continue;
          if (!validIds.has(source) || !validIds.has(target)) continue;
          acceptedEdges.push({ source, target, relation });
        }

        // Fallback: ogni nuovo nodo deve avere almeno un collegamento
        const anchorId = focusNodeId && validIds.has(focusNodeId)
          ? focusNodeId
          : existingNodes[0]?.id ?? null;

        for (const node of acceptedNodes) {
          const hasEdge = acceptedEdges.some(e => e.source === node.id || e.target === node.id);
          if (!hasEdge && anchorId) {
            acceptedEdges.push({ source: anchorId, target: node.id, relation: 'correlato' });
          }
        }

        const mergedPayload = {
          ...conceptMap.payload,
          nodes: [...existingNodes, ...acceptedNodes],
          edges: [...existingEdges, ...acceptedEdges.filter(e => acceptedIds.has(e.source) || acceptedIds.has(e.target))],
        };

        await db.updateConceptMapPayload(conceptMap.id, mergedPayload);
        addedNodeCount = acceptedNodes.length;
        addedEdgeCount = mergedPayload.edges.length - existingEdges.length;
      }
    }

    return NextResponse.json({
      textUpdated,
      updatedText: textUpdated ? newText : null,
      addedNodeCount,
      addedEdgeCount,
      conceptMapUpdated: addedNodeCount > 0,
    });
  } catch (error) {
    console.error('Enrich API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
