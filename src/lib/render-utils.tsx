'use client';

import { useState, Fragment } from 'react';
import { Copy, Check } from '@phosphor-icons/react';

// ---- Types ----

type Token = { type: 'text' | 'code' | 'bold' | 'keyword'; text: string };

// ---- Exported renderer ----

export function renderFormattedText(text: string, onKeywordClick?: (term: string) => void): React.ReactNode {
  const tokens = tokenize(text);
  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === 'code') {
          return <code key={i} className="inline-code">{token.text}</code>;
        }
        if (token.type === 'bold') {
          return <strong key={i}>{token.text}</strong>;
        }
        if (token.type === 'keyword') {
          return <KeywordButton key={i} term={token.text} onClick={onKeywordClick} />;
        }
        return <span key={i}>{token.text}</span>;
      })}
    </>
  );
}

export function renderFormattedParagraph(text: string, key?: number, onKeywordClick?: (term: string) => void): React.ReactNode {
  // Detect fenced code block (```lang\n...\n```)
  const fenceMatch = text.match(/^```(\w*)\n([\s\S]*)\n```$/);
  if (fenceMatch) {
    return <CodeBlock key={key} lang={fenceMatch[1] || ''} code={fenceMatch[2]} />;
  }

  // Detect markdown table (all non-empty lines start with |)
  const nonEmpty = text.split('\n').filter(l => l.trim());
  if (nonEmpty.length >= 2 && nonEmpty.every(l => l.trim().startsWith('|'))) {
    return renderTable(text, key, onKeywordClick);
  }

  // Detect if block contains any list items anywhere (bullet or numbered)
  if (/(?:^|\n)(?:[-*]|\d+\.)\s/.test(text)) {
    return renderMixedBlock(text, key, onKeywordClick);
  }

  return renderFormattedText(text, onKeywordClick);
}

/**
 * Splits text into renderable blocks, keeping fenced code blocks (```...```) intact
 * so blank lines inside code do not cause them to be split into multiple paragraphs.
 */
export function splitIntoBlocks(text: string): string[] {
  const lines = text.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let inCode = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCode) {
        // Flush regular content before opening fence
        if (current.length > 0) {
          const joined = current.join('\n').trim();
          if (joined) {
            joined.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).forEach(p => blocks.push(p));
          }
          current = [];
        }
        inCode = true;
        current = [line];
      } else {
        // Closing fence — emit the whole code block as one item
        current.push(line);
        blocks.push(current.join('\n'));
        current = [];
        inCode = false;
      }
    } else {
      current.push(line);
    }
  }

  // Flush remaining content (unclosed fence treated as plain text)
  if (current.length > 0) {
    const joined = current.join('\n').trim();
    if (joined) {
      joined.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).forEach(p => blocks.push(p));
    }
  }

  return blocks;
}

// ---- Internal ----

function KeywordButton({ term, onClick }: { term: string; onClick?: (term: string) => void }) {
  if (!onClick) return <span className="keyword-link">{term}</span>;
  return (
    <button
      className="keyword-link"
      onClick={() => onClick(term)}
      title={`Approfondisci: ${term}`}
    >
      {term}
    </button>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <pre className="code-block">
      {lang && <span className="code-block__lang">{lang}</span>}
      <button className="copy-btn" onClick={handleCopy} title="Copia il codice">
        {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
      </button>
      <code>{code}</code>
    </pre>
  );
}

function renderTable(text: string, key?: number, onKeywordClick?: (term: string) => void): React.ReactNode {
  const lines = text.split('\n').filter(l => l.trim().startsWith('|'));
  const isSep = (l: string) => /^\|[-|\s:]+\|$/.test(l.trim());
  const parseRow = (l: string) => l.split('|').slice(1, -1).map(c => c.trim());

  const dataLines = lines.filter(l => !isSep(l));
  if (dataLines.length === 0) return null;

  const [headers, ...bodyRows] = dataLines.map(parseRow);
  return (
    <div key={key} className="md-table-wrap">
      <table className="md-table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{renderFormattedText(h, onKeywordClick)}</th>)}</tr>
        </thead>
        {bodyRows.length > 0 && (
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{renderFormattedText(cell, onKeywordClick)}</td>)}</tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}

function renderMixedBlock(text: string, key?: number, onKeywordClick?: (term: string) => void): React.ReactNode {
  type Seg = { type: 'text'; lines: string[] } | { type: 'ul'; items: string[] } | { type: 'ol'; items: string[] };
  const segments: Seg[] = [];

  for (const line of text.split('\n')) {
    if (/^[-*]\s/.test(line)) {
      const last = segments[segments.length - 1];
      if (last?.type === 'ul') { last.items.push(line.replace(/^[-*]\s*/, '')); }
      else { segments.push({ type: 'ul', items: [line.replace(/^[-*]\s*/, '')] }); }
    } else if (/^\d+\.\s/.test(line)) {
      const last = segments[segments.length - 1];
      if (last?.type === 'ol') { last.items.push(line.replace(/^\d+\.\s*/, '')); }
      else { segments.push({ type: 'ol', items: [line.replace(/^\d+\.\s*/, '')] }); }
    } else if (line.trim()) {
      const last = segments[segments.length - 1];
      if (last?.type === 'text') { last.lines.push(line); }
      else { segments.push({ type: 'text', lines: [line] }); }
    }
  }

  if (segments.length === 0) return null;
  if (segments.length === 1 && segments[0].type === 'text') {
    return renderFormattedText(segments[0].lines.join('\n'), onKeywordClick);
  }

  return (
    <Fragment key={key}>
      {segments.map((seg, i) => {
        if (seg.type === 'ul') {
          return (
            <ul key={i} className="result-block--list">
              {seg.items.map((item, j) => <li key={j}>{renderFormattedText(item, onKeywordClick)}</li>)}
            </ul>
          );
        }
        if (seg.type === 'ol') {
          return (
            <ol key={i} className="result-block--list result-block--list-ol">
              {seg.items.map((item, j) => <li key={j}>{renderFormattedText(item, onKeywordClick)}</li>)}
            </ol>
          );
        }
        return <p key={i}>{renderFormattedText(seg.lines.join(' '), onKeywordClick)}</p>;
      })}
    </Fragment>
  );
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        tokens.push({ type: 'code', text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        tokens.push({ type: 'bold', text: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    if (text[i] === '[' && text[i + 1] === '[') {
      const end = text.indexOf(']]', i + 2);
      if (end !== -1) {
        tokens.push({ type: 'keyword', text: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    // Nessun marcatore valido inizia esattamente a `i` (eventuali marcatori
    // qui sono spaiati): cerca il prossimo marcatore DOPO `i`. Cosi `i` avanza
    // sempre (evita il loop infinito su `, ** o [[ senza chiusura).
    const candidates = [
      text.indexOf('`', i + 1),
      text.indexOf('**', i + 1),
      text.indexOf('[[', i + 1),
    ].filter(idx => idx !== -1);

    if (candidates.length === 0) {
      tokens.push({ type: 'text', text: text.slice(i) });
      break;
    }

    const nextSpecial = Math.min(...candidates);
    tokens.push({ type: 'text', text: text.slice(i, nextSpecial) });
    i = nextSpecial;
  }

  return tokens;
}
