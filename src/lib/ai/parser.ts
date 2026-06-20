export interface ParsedResponse {
  text: string;
  keywords: string[];
  relatedTopics: string[];
}

const KEYWORD_REGEX = /\[\[(.+?)\]\]/g;
const RELATED_MARKER = '---RELATED---';

export function parseResponse(raw: string): ParsedResponse {
  const relatedSplit = raw.split(RELATED_MARKER);

  const mainText = relatedSplit[0] || '';
  const relatedRaw = relatedSplit[1] || '';

  // Estrai keywords dal testo principale
  const keywords: string[] = [];
  let match: RegExpExecArray | null;
  const cleanedText = mainText.replace(KEYWORD_REGEX, (_full, term) => {
    keywords.push(term.trim());
    return term; // Rimuovi le quadre, lascia il testo leggibile
  });

  // Estrai related topics
  const relatedTopics = relatedRaw
    .split('\n')
    .map(line => line.replace(/^[-*\d.]\s*/, '').trim())
    .filter(line => line.length > 0);

  return {
    text: cleanedText.trim(),
    keywords: [...new Set(keywords)], // deduplica
    relatedTopics,
  };
}

export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}
