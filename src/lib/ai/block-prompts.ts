import type { Block } from '@/lib/types/pages';
import type { Language, DetailLevel } from './prompts';
import type { AIBlockOp, AIPageResponse } from '@/lib/types/ai';

// ─── Serialise blocks for prompt context ──────────────────────────────────────

/** Converts existing page blocks to a readable text representation for the prompt */
export function serializeBlocksForAI(blocks: Block[]): string {
  if (blocks.length === 0) return '(pagina vuota — nessun blocco presente)';

  return blocks
    .sort((a, b) => a.position - b.position)
    .map(b => {
      const text = b.content.rich_text?.map(s => s.text).join('') ?? '';
      const prefix: Record<string, string> = {
        heading_1: '# ',
        heading_2: '## ',
        heading_3: '### ',
        bulleted_list_item: '• ',
        numbered_list_item: '1. ',
        quote: '> ',
        code: '```\n',
        divider: '---',
        callout: `💡 [${b.content.icon ?? ''}] `,
        toggle: '▶ ',
        image: `[immagine: ${b.content.url ?? ''}]`,
        subpage: `[sottopagina: ${b.content.page_id ?? ''}]`,
        paragraph: '',
      };
      const p = prefix[b.type] ?? '';
      const suffix = b.type === 'code' ? '\n```' : '';
      return `[${b.type}] ${p}${text}${suffix}`.trim();
    })
    .join('\n');
}

// ─── JSON output schema described in natural language ─────────────────────────

const BLOCK_TYPES_AVAILABLE = [
  'paragraph', 'heading_1', 'heading_2', 'heading_3',
  'bulleted_list_item', 'numbered_list_item',
  'quote', 'code', 'divider', 'callout', 'toggle', 'image',
].join(', ');

const JSON_SCHEMA_DESCRIPTION = `
Rispondi SEMPRE con un oggetto JSON valido (nessun testo fuori dal JSON), con questa struttura:
{
  "reply": "<stringa: messaggio all'utente in linguaggio naturale>",
  "blockOps": [
    {
      "type": "append" | "replace_all",
      "blocks": [
        {
          "type": "<blockType>",
          "content": {
            "rich_text": [{ "text": "<testo>", "annotations": {} }],
            /* opzionale per code: */ "language": "<linguaggio>",
            /* opzionale per callout: */ "icon": "<emoji>",
            /* opzionale per image: */ "url": "<url>"
          }
        }
      ]
    }
  ]
}

Tipi di blocco disponibili: ${BLOCK_TYPES_AVAILABLE}.

Regole per blockOps:
- Per action "generate" o "append": usa type "append" — aggiungi i blocchi in fondo.
- Per action "rewrite": usa type "replace_all" — sostituisce tutto il contenuto.
- Per action "chat": blockOps deve essere un array vuoto [].
- rich_text è un array di span: [{ "text": "...", "annotations": {} }]
- Per enfasi usa: { "text": "...", "annotations": { "bold": true } }
- Per codice inline: { "text": "...", "annotations": { "code": true } }
- divider non ha rich_text: "content": {}
- image richiede "url" e opzionalmente "caption"
- Non usare emoji in reply. Non usare markdown in reply (è testo semplice).
`;

// ─── Prompt builders ──────────────────────────────────────────────────────────

function baseInstructions(language: Language, detailLevel: Language extends 'it' ? string : string): string {
  const langNames: Record<Language, string> = {
    it: 'italiano', en: 'inglese', es: 'spagnolo', fr: 'francese',
  };
  const detail: Record<DetailLevel, string> = {
    base: 'Semplice e introduttivo. Usa analogie, evita gergo tecnico.',
    intermedio: 'Tecnico e con esempi pratici, per chi ha basi.',
    avanzato: 'Approfondito e architetturale. Dettagli di implementazione ed edge case.',
  };
  return `Sei Nakedstack, un assistente per la gestione della conoscenza.
Lingua: ${langNames[language as Language]}. Livello: ${detail[detailLevel as DetailLevel]}
Non usare emoji nella reply. Non usare markdown nella reply (è testo semplice per il pannello chat).`;
}

export function buildChatOnlyPrompt(language: Language, detailLevel: DetailLevel, pageTitle: string, currentBlocks: Block[]): string {
  const blocks = serializeBlocksForAI(currentBlocks);
  return `${baseInstructions(language, detailLevel)}

CONTESTO PAGINA: "${pageTitle}"
CONTENUTO ATTUALE:
${blocks}

Stai rispondendo a una domanda in modalità chat. NON modificare i blocchi della pagina.
${JSON_SCHEMA_DESCRIPTION}
Poiché questa è modalità "chat", blockOps deve essere [].`;
}

export function buildGeneratePrompt(language: Language, detailLevel: DetailLevel, pageTitle: string, currentBlocks: Block[]): string {
  const blocks = serializeBlocksForAI(currentBlocks);
  return `${baseInstructions(language, detailLevel)}

CONTESTO PAGINA: "${pageTitle}"
CONTENUTO ATTUALE:
${blocks}

L'utente vuole generare nuovo contenuto da aggiungere in fondo alla pagina.
Crea blocchi ben strutturati: usa heading_1/2/3 per i titoli, paragraph per il testo,
bulleted_list_item per elenchi, code per snippet, callout per note importanti.
${JSON_SCHEMA_DESCRIPTION}
Usa type "append" nei blockOps.`;
}

export function buildAppendPrompt(language: Language, detailLevel: DetailLevel, pageTitle: string, currentBlocks: Block[]): string {
  const blocks = serializeBlocksForAI(currentBlocks);
  return `${baseInstructions(language, detailLevel)}

CONTESTO PAGINA: "${pageTitle}"
CONTENUTO ATTUALE:
${blocks}

L'utente vuole aggiungere nuove informazioni basate sulla sua richiesta.
Analizza il contenuto esistente per evitare duplicati.
Crea blocchi coerenti con lo stile esistente.
${JSON_SCHEMA_DESCRIPTION}
Usa type "append" nei blockOps.`;
}

export function buildRewritePrompt(language: Language, detailLevel: DetailLevel, pageTitle: string, currentBlocks: Block[]): string {
  const blocks = serializeBlocksForAI(currentBlocks);
  return `${baseInstructions(language, detailLevel)}

CONTESTO PAGINA: "${pageTitle}"
CONTENUTO ATTUALE:
${blocks}

L'utente vuole riscrivere completamente il contenuto della pagina.
Mantieni le informazioni fondamentali, migliora struttura e chiarezza.
Usa heading_1 per il titolo principale, poi organizza in sezioni con heading_2/3.
${JSON_SCHEMA_DESCRIPTION}
Usa type "replace_all" nei blockOps.`;
}

// ─── AI_ACTION_HANDLERS map (Open/Closed Principle) ──────────────────────────

export type PromptBuilder = (
  language: Language,
  detailLevel: DetailLevel,
  pageTitle: string,
  currentBlocks: Block[],
) => string;

export const AI_ACTION_HANDLERS: Record<string, PromptBuilder> = {
  chat: buildChatOnlyPrompt,
  generate: buildGeneratePrompt,
  append: buildAppendPrompt,
  rewrite: buildRewritePrompt,
};

// ─── Response parser ──────────────────────────────────────────────────────────

/** Extracts JSON from AI response (handles markdown code block wrapping) */
function extractJSON(raw: string): string {
  // Try to extract from ```json ... ``` block
  const fenced = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) return fenced[1];
  // Try to find bare JSON object
  const bare = raw.match(/\{[\s\S]*\}/);
  if (bare) return bare[0];
  return raw;
}

export function parseAIBlockResponse(raw: string): AIPageResponse {
  try {
    const json = extractJSON(raw);
    const parsed = JSON.parse(json) as { reply?: string; blockOps?: AIBlockOp[] };
    const blockOps: AIBlockOp[] = Array.isArray(parsed.blockOps) ? parsed.blockOps : [];
    return {
      reply: typeof parsed.reply === 'string' ? parsed.reply : raw,
      blockOps,
      hasBlockChanges: blockOps.length > 0 && blockOps.some(op => op.blocks.length > 0),
    };
  } catch {
    // Fallback: treat entire response as a chat reply with no block changes
    return { reply: raw, blockOps: [], hasBlockChanges: false };
  }
}
