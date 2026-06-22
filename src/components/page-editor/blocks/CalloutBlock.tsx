'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import type { BlockComponentProps } from '@/lib/types/pages';
import { plainText, toRichText } from '@/lib/utils/rich-text';

export function CalloutBlock({ block, onUpdate, onDelete, onInsertAfter, readOnly }: BlockComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const text = plainText(block.content.rich_text);
  const icon = block.content.icon ?? '💡';

  useEffect(() => {
    if (ref.current && ref.current.textContent !== text) {
      ref.current.textContent = text;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  function handleInput() {
    onUpdate(block.id, { ...block.content, rich_text: toRichText(ref.current?.textContent ?? '') });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onInsertAfter(block.id, 'paragraph'); }
    if (e.key === 'Backspace' && ref.current?.textContent === '') { e.preventDefault(); onDelete(block.id); }
  }

  return (
    <div className="block-callout" data-block-id={block.id}>
      <span className="block-callout__icon" aria-hidden>{icon}</span>
      <div
        ref={ref}
        className="block-callout__text"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder="Callout"
      />
    </div>
  );
}
