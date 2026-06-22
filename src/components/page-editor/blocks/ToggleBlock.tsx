'use client';

import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import type { BlockComponentProps } from '@/lib/types/pages';
import { plainText, toRichText } from '@/lib/utils/rich-text';
import { CaretRight } from '@phosphor-icons/react';

export function ToggleBlock({ block, onUpdate, onDelete, onInsertAfter, readOnly }: BlockComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const text = plainText(block.content.rich_text);
  const [expanded, setExpanded] = useState(block.content.expanded ?? false);

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

  function toggleExpand() {
    const next = !expanded;
    setExpanded(next);
    onUpdate(block.id, { ...block.content, expanded: next });
  }

  return (
    <div className="block-toggle" data-block-id={block.id}>
      <div className="block-toggle__header">
        <button
          className={`block-toggle__arrow${expanded ? ' block-toggle__arrow--open' : ''}`}
          onClick={toggleExpand}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <CaretRight size={14} weight="bold" />
        </button>
        <div
          ref={ref}
          className="block-toggle__summary"
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-placeholder="Toggle"
        />
      </div>
      {expanded && (
        <div className="block-toggle__children" />
      )}
    </div>
  );
}
