import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/ai/client';
import {
  buildEnrichmentMessages,
  buildReorganizeMessages,
  type Language,
  type DetailLevel,
  type EnrichmentNode,
} from '@/lib/ai/prompts';
import { getBlocks, updateBlock } from '@/lib/db';
import { plainText } from '@/lib/utils/rich-text';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface EnrichmentResult {
  additions?: string;
  newNodes?: EnrichmentNode[];
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: pageId } = await params;
    const body = await req.json() as {
      question: string;
      answer: string;
      language?: Language;
      detailLevel?: DetailLevel;
    };

    const { question, answer, language = 'it', detailLevel = 'base' } = body;
    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json({ error: 'question and answer are required' }, { status: 400 });
    }

    // Collect current page text from blocks
    const blocks = await getBlocks(pageId);
    const currentText = blocks
      .filter(b => b.content.rich_text)
      .map(b => plainText(b.content.rich_text))
      .join('\n\n');

    const { system, user } = buildEnrichmentMessages({
      language,
      detailLevel,
      topic: `Page ${pageId}`,
      currentText,
      question,
      answer,
      existingNodes: [],
    });

    const client = getDeepSeekClient();
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let result: EnrichmentResult;
    try { result = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }); }

    const additions = typeof result.additions === 'string' ? result.additions.trim() : '';
    if (!additions) return NextResponse.json({ ok: true, added: false });

    // Reorganize combined text
    const combinedText = currentText ? `${currentText}\n\n${additions}` : additions;
    const { system: rsys, user: ruser } = buildReorganizeMessages({
      language, detailLevel, topic: `Page ${pageId}`, fullText: combinedText,
    });
    const reorg = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: rsys }, { role: 'user', content: ruser }],
      temperature: 0.3,
      max_tokens: 8192,
    });
    const reorganized = (reorg.choices[0]?.message?.content ?? '').trim();
    const finalText = reorganized.length >= combinedText.length * 0.6 ? reorganized : combinedText;

    // Write back to the last paragraph block (simplest strategy for v1)
    const lastParaBlock = [...blocks].reverse().find(b => b.type === 'paragraph');
    if (lastParaBlock) {
      const newText = finalText;
      await updateBlock(lastParaBlock.id, {
        content: { ...lastParaBlock.content, rich_text: [{ text: newText, annotations: {} }] },
      });
    }

    return NextResponse.json({ ok: true, added: true });
  } catch (err) {
    console.error('[POST /api/pages/[id]/enrich]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
