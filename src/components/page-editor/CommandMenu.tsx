'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import type { BlockType } from '@/lib/types/pages';

interface CommandItem {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
}

const COMMANDS: CommandItem[] = [
  { type: 'paragraph',          label: 'Text',           description: 'Plain paragraph',         icon: 'T'  },
  { type: 'heading_1',          label: 'Heading 1',      description: 'Large heading',            icon: 'H1' },
  { type: 'heading_2',          label: 'Heading 2',      description: 'Medium heading',           icon: 'H2' },
  { type: 'heading_3',          label: 'Heading 3',      description: 'Small heading',            icon: 'H3' },
  { type: 'bulleted_list_item', label: 'Bulleted list',  description: 'Unordered list',           icon: '•'  },
  { type: 'numbered_list_item', label: 'Numbered list',  description: 'Ordered list',             icon: '1.' },
  { type: 'toggle',             label: 'Toggle',         description: 'Collapsible section',      icon: '▸'  },
  { type: 'code',               label: 'Code',           description: 'Code block',               icon: '</>' },
  { type: 'quote',              label: 'Quote',          description: 'Quoted text',              icon: '"'  },
  { type: 'callout',            label: 'Callout',        description: 'Highlighted note',         icon: '💡' },
  { type: 'divider',            label: 'Divider',        description: 'Horizontal rule',          icon: '—'  },
  { type: 'image',              label: 'Image',          description: 'Embed an image',           icon: '🖼' },
  { type: 'subpage',            label: 'Subpage',        description: 'Link to a child page',     icon: '📄' },
];

interface Props {
  query: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function CommandMenu({ query, onSelect, onClose, anchorRef }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => setActiveIndex(0), [query]);

  // Position below anchor
  useEffect(() => {
    if (!menuRef.current || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    menuRef.current.style.top = `${rect.bottom + window.scrollY + 4}px`;
    menuRef.current.style.left = `${rect.left + window.scrollX}px`;
  }, [anchorRef]);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter')      { e.preventDefault(); if (filtered[activeIndex]) onSelect(filtered[activeIndex].type); }
    if (e.key === 'Escape')     { onClose(); }
  }

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="command-menu"
      role="listbox"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {filtered.map((item, i) => (
        <div
          key={item.type}
          role="option"
          aria-selected={i === activeIndex}
          className={`command-menu__item${i === activeIndex ? ' command-menu__item--active' : ''}`}
          onMouseEnter={() => setActiveIndex(i)}
          onClick={() => onSelect(item.type)}
        >
          <span className="command-menu__icon">{item.icon}</span>
          <div className="command-menu__text">
            <span className="command-menu__label">{item.label}</span>
            <span className="command-menu__desc">{item.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
