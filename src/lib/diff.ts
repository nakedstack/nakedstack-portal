// ============================================================
// diff — Diff a livello di paragrafo per evidenziare le modifiche
// dell'agent direttamente nel testo formattato.
// ------------------------------------------------------------
// SRP: allinea i paragrafi (vecchio vs nuovo) e ritorna segmenti
// { equal | added | removed }. L'allineamento usa una soglia di
// SIMILARITA: cosi la riorganizzazione (riformulazioni minori) non
// genera rumore e solo i paragrafi davvero nuovi/rimossi vengono
// evidenziati.
// ============================================================

export type DiffSegmentType = 'equal' | 'added' | 'removed' | 'modified';

export interface DiffSegment {
  type: DiffSegmentType;
  /** Testo nuovo (o vecchio per 'removed') */
  value: string;
  /** Testo vecchio — presente solo per i segmenti 'modified' */
  oldValue?: string;
  /** Diff a livello di parola — presente solo per i segmenti 'modified' */
  wordDiff?: WordDiffToken[];
}

export type WordDiffType = 'equal' | 'added' | 'removed';

export interface WordDiffToken {
  type: WordDiffType;
  value: string;
}

/** Soglia di similarita (Jaccard sui set di parole) per considerare due paragrafi "uguali" */
const SIMILARITY_THRESHOLD = 0.5;

/** Divide il testo in paragrafi (blocchi separati da righe vuote) */
function splitParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
}

/** Normalizza un paragrafo per il confronto (rimuove marcatori, minuscolo, spazi) */
function normalize(p: string): string {
  return p
    .replace(/\[\[(.+?)\]\]/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function wordSet(normalized: string): Set<string> {
  return new Set(normalized.split(' ').filter(Boolean));
}

/** Similarita di Jaccard tra due set di parole */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Calcola il diff a livello di parola tra `oldText` e `newText`.
 * Usato per evidenziare le modifiche all'interno dei paragrafi 'modified'.
 */
export function computeWordDiff(oldText: string, newText: string): WordDiffToken[] {
  // Tokenizza mantenendo gli spazi come token separati per una visualizzazione naturale
  const oldT = oldText.split(/(\s+)/);
  const newT = newText.split(/(\s+)/);
  const n = oldT.length;
  const m = newT.length;

  const dp: Int32Array[] = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = oldT[i] === newT[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const result: WordDiffToken[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (oldT[i] === newT[j]) {
      result.push({ type: 'equal', value: oldT[i] }); i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'removed', value: oldT[i] }); i++;
    } else {
      result.push({ type: 'added', value: newT[j] }); j++;
    }
  }
  while (i < n) result.push({ type: 'removed', value: oldT[i++] });
  while (j < m) result.push({ type: 'added', value: newT[j++] });
  return result;
}

/**
 * Calcola il diff a livello di paragrafo tra `oldText` e `newText`.
 * I paragrafi "equal" sono resi nella loro versione NUOVA (le
 * riformulazioni minori restano senza evidenziazione).
 */
export function computeParagraphDiff(oldText: string, newText: string): DiffSegment[] {
  const oldP = splitParagraphs(oldText);
  const newP = splitParagraphs(newText);

  const oldNorm = oldP.map(normalize);
  const newNorm = newP.map(normalize);
  const oldSets = oldNorm.map(wordSet);
  const newSets = newNorm.map(wordSet);

  const eq = (i: number, j: number): boolean => {
    if (oldNorm[i] === newNorm[j]) return true;
    return jaccard(oldSets[i], newSets[j]) >= SIMILARITY_THRESHOLD;
  };

  // LCS sui paragrafi usando l'uguaglianza per similarita
  const n = oldP.length;
  const m = newP.length;
  const dp: Int32Array[] = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = eq(i, j)
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (eq(i, j)) {
      if (oldNorm[i] === newNorm[j]) {
        // Paragrafi identici: nessuna evidenziazione
        out.push({ type: 'equal', value: newP[j] });
      } else {
        // Paragrafi simili ma modificati: diff a livello di parola
        out.push({
          type: 'modified',
          value: newP[j],
          oldValue: oldP[i],
          wordDiff: computeWordDiff(oldP[i], newP[j]),
        });
      }
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'removed', value: oldP[i] });
      i++;
    } else {
      out.push({ type: 'added', value: newP[j] });
      j++;
    }
  }
  while (i < n) { out.push({ type: 'removed', value: oldP[i] }); i++; }
  while (j < m) { out.push({ type: 'added', value: newP[j] }); j++; }

  return out;
}

/** True se il diff contiene almeno una modifica (aggiunta o rimozione) */
export function diffHasChanges(segments: DiffSegment[]): boolean {
  return segments.some(s => s.type !== 'equal');
}
