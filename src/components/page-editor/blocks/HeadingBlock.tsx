'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import type { BlockComponentProps } from '@/lib/types/pages';
import { plainText, toRichText } from '@/lib/utils/rich-text';

const TAG: Record<string, 'h1' | 'h2' | 'h3'> = {
  heading_1: 'h1',
  heading_2: 'h2',
  heading_3: 'h3',
};

export function HeadingBlock({ block, onUpdate, onDelete, onInsertAfter, readOnly }: BlockComponentProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const Tag = TAG[block.type] ?? 'h2';
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

  function handleKeyDown(e: KeyboardEvent<HTMLHeadingElement>) {
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
    <Tag
      ref={ref}
      className={`block-heading block-heading--${block.type}`}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-placeholder={`Heading ${Tag.replace('h', '')}`}
      data-block-id={block.id}
    />
  );
}
