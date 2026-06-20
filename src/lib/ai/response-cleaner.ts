// ============================================================
// ResponseCleaner — SRP: purifica il testo AI rimuovendo
// eventuali ripetizioni della domanda utente.
// ============================================================

/**
 * Normalizza una stringa per confronti robusti:
 * - trim, lowercase
 * - rimuove punteggiatura finale (?, !, ., ecc.)
 * - normalizza accenti Unicode (NFD)
 * - compatta spazi multipli
 */
function normalizeForComparison(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[?!.,;:…]+$/g, '')      // strip trailing punctuation
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim();
}

/**
 * Pulisce marcatori markdown da una stringa.
 */
function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*/g, '')             // bold
    .replace(/\*/g, '')               // italic
    .replace(/^#+\s*/gm, '')          // headings
    .replace(/`{1,3}/g, '')           // inline code
    .trim();
}

/**
 * Rimuove dal testo della risposta AI eventuali ripetizioni
 * della domanda originale. Opera sul primo paragrafo:
 * - se è identico alla domanda → lo rimuove
 * - se CONTIENE la domanda come sottostringa → la rimuove dal paragrafo
 * - altrimenti lascia il testo intatto
 *
 * @param responseText - Il testo della risposta AI (results.text)
 * @param query         - La domanda originale dell'utente
 * @returns Il testo pulito, senza ripetizioni della domanda
 */
export function stripRestatedQuestion(responseText: string, query: string): string {
  if (!query || !responseText) return responseText;

  const normQuery = normalizeForComparison(query);
  if (normQuery.length < 3) return responseText; // troppo corta, non significativa

  const paragraphs = responseText.split(/\n\n+/);
  if (paragraphs.length === 0) return responseText;

  const first = paragraphs[0];
  const cleanFirst = stripMarkdown(first);
  const normFirst = normalizeForComparison(cleanFirst);

  // Caso 1: l'intero primo paragrafo è la domanda ripetuta
  if (normFirst === normQuery) {
    const remaining = paragraphs.slice(1);
    return remaining.length > 0 ? remaining.join('\n\n') : responseText;
  }

  // Caso 2: la domanda è all'inizio del primo paragrafo, seguita da altro testo
  if (normFirst.startsWith(normQuery)) {
    const afterQuery = cleanFirst.slice(query.length).replace(/^[:\s–—-]+/, '').trim();
    if (afterQuery) {
      // Ricostruisci: nuovo primo paragrafo = resto, poi gli altri
      const remainingParagraphs = [afterQuery, ...paragraphs.slice(1)];
      return remainingParagraphs.join('\n\n');
    }
  }

  // Caso 3: la domanda appare come sottostringa nel primo paragrafo
  // (es. "Certamente! Cos'è un sistema distribuito? Vediamo...")
  const idx = normFirst.indexOf(normQuery);
  if (idx >= 0) {
    const before = cleanFirst.slice(0, idx).replace(/[,\s]+$/, '').trim();
    const after = cleanFirst.slice(idx + query.length).replace(/^[:\s–—-]+/, '').trim();
    const rebuilt = [before, after].filter(Boolean).join(' ');
    if (rebuilt) {
      const remainingParagraphs = [rebuilt, ...paragraphs.slice(1)];
      return remainingParagraphs.join('\n\n');
    }
  }

  return responseText;
}

