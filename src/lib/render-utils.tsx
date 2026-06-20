'use client';

import { useExplore } from '@/lib/explore-context';

// ---- Types ----

type Token = { type: 'text' | 'code' | 'bold' | 'keyword'; text: string };

// ---- Exported renderer ----

export function renderFormattedText(text: string): React.ReactNode {
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
          return <KeywordButton key={i} term={token.text} />;
        }
        return <span key={i}>{token.text}</span>;
      })}
    </>
  );
}

export function renderFormattedParagraph(text: string, key?: number): React.ReactNode {
  // Check for list items
  if (/^[-*]\s/.test(text)) {
    const items = text.split(/\n(?=[-*]\s)/);
    return (
      <ul className="result-block--list" key={key}>
        {items.map((item, j) => (
          <li key={j}>{renderFormattedText(item.replace(/^[-*]\s*/, ''))}</li>
        ))}
      </ul>
    );
  }

  return renderFormattedText(text);
}

// ---- Internal ----

function KeywordButton({ term }: { term: string }) {
  const { exploreKeyword } = useExplore();
  return (
    <button
      className="keyword-link"
      onClick={() => exploreKeyword(term)}
      title={`Approfondisci: ${term}`}
    >
      {term}
    </button>
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

    const nextSpecial = Math.min(
      text.indexOf('`', i) === -1 ? Infinity : text.indexOf('`', i),
      text.indexOf('**', i) === -1 ? Infinity : text.indexOf('**', i),
      text.indexOf('[[', i) === -1 ? Infinity : text.indexOf('[[', i),
    );

    if (nextSpecial === Infinity || nextSpecial === -1) {
      tokens.push({ type: 'text', text: text.slice(i) });
      break;
    }

    if (nextSpecial > i) {
      tokens.push({ type: 'text', text: text.slice(i, nextSpecial) });
    }
    i = nextSpecial;
  }

  return tokens;
}
