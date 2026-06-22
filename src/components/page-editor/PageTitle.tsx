'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';

interface Props {
  title: string;
  onChange: (title: string) => void;
  readOnly?: boolean;
}

export function PageTitle({ title, onChange, readOnly }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== title) {
      ref.current.textContent = title;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleInput() {
    onChange(ref.current?.textContent ?? '');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move focus to first block
      const firstBlock = document.querySelector<HTMLElement>('[data-block-id]');
      firstBlock?.focus();
    }
  }

  return (
    <div
      ref={ref}
      className="page-title"
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-placeholder="Untitled"
      aria-label="Page title"
    />
  );
}
