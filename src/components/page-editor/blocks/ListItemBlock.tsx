'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import type { BlockComponentProps } from '@/lib/types/pages';
import { plainText, toRichText } from '@/lib/utils/rich-text';

export function ListItemBlock({ block, onUpdate, onDelete, onInsertAfter, readOnly }: BlockComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const text = plainText(block.content.rich_text);
  const isBullet = block.type === 'bulleted_list_item';

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
      onInsertAfter(block.id, block.type);
    }
    if (e.key === 'Backspace' && ref.current?.textContent === '') {
      e.preventDefault();
      onDelete(block.id);
    }
  }

  return (
    <div className={`block-list-item block-list-item--${isBullet ? 'bullet' : 'numbered'}`}>
      <span className="block-list-item__marker" aria-hidden>
        {isBullet ? '•' : ''}
      </span>
      <div
        ref={ref}
        className="block-list-item__content"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder="List item"
        data-block-id={block.id}
      />
    </div>
  );
}
