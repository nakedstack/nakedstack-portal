'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import type { BlockComponentProps } from '@/lib/types/pages';

export function CodeBlock({ block, onUpdate, onDelete, onInsertAfter, readOnly }: BlockComponentProps) {
  const ref = useRef<HTMLElement>(null);
  const text = block.content.rich_text?.map(s => s.text).join('') ?? '';
  const lang = block.content.language ?? 'plaintext';

  useEffect(() => {
    if (ref.current && ref.current.textContent !== text) {
      ref.current.textContent = text;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  function handleInput() {
    const val = ref.current?.textContent ?? '';
    onUpdate(block.id, { ...block.content, rich_text: [{ text: val, annotations: { code: true } }] });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      onInsertAfter(block.id, 'paragraph');
    }
    if (e.key === 'Backspace' && ref.current?.textContent === '') {
      e.preventDefault();
      onDelete(block.id);
    }
  }

  return (
    <div className="block-code">
      <div className="block-code__lang-label">{lang}</div>
      <pre>
        <code
          ref={ref}
          className={`language-${lang}`}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-block-id={block.id}
        />
      </pre>
    </div>
  );
}
