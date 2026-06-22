'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import type { BlockComponentProps } from '@/lib/types/pages';
import { plainText, toRichText } from '@/lib/utils/rich-text';

export function ParagraphBlock({ block, onUpdate, onDelete, onInsertAfter, readOnly }: BlockComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const text = plainText(block.content.rich_text);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== text) {
      ref.current.textContent = text;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  function handleInput() {
    const val = ref.current?.textContent ?? '';
    onUpdate(block.id, { ...block.content, rich_text: toRichText(val) });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onInsertAfter(block.id, 'paragraph');
    }
    if (e.key === 'Backspace' && ref.current?.textContent === '') {
      e.preventDefault();
      onDelete(block.id);
    }
  }

  return (
    <div
      ref={ref}
      className="block-paragraph"
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-placeholder="Type '/' for commands…"
      data-block-id={block.id}
    />
  );
}
