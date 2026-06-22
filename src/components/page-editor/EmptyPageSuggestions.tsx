'use client';

import {
  Sparkle,
  TextHOne,
  ListBullets,
  Quotes,
  Code,
  Info,
  NotePencil,
} from '@phosphor-icons/react';
import type { BlockType } from '@/lib/types/pages';

interface Suggestion {
  label: string;
  icon: React.ReactNode;
  action: 'block' | 'ai';
  blockType?: BlockType;
}

const SUGGESTIONS: Suggestion[] = [
  { label: 'Chiedi all\'AI',  icon: <Sparkle size={14} weight="duotone" />, action: 'ai' },
  { label: 'Appunti',         icon: <NotePencil size={14} />,               action: 'block', blockType: 'paragraph' },
  { label: 'Intestazione',    icon: <TextHOne size={14} />,                 action: 'block', blockType: 'heading_1' },
  { label: 'Lista',           icon: <ListBullets size={14} />,              action: 'block', blockType: 'bulleted_list_item' },
  { label: 'Citazione',       icon: <Quotes size={14} />,                   action: 'block', blockType: 'quote' },
  { label: 'Callout',         icon: <Info size={14} />,                     action: 'block', blockType: 'callout' },
  { label: 'Codice',          icon: <Code size={14} />,                     action: 'block', blockType: 'code' },
];

interface Props {
  onInsertBlock: (type: BlockType) => void;
  onOpenAI: () => void;
}

export function EmptyPageSuggestions({ onInsertBlock, onOpenAI }: Props) {
  function handleClick(s: Suggestion) {
    if (s.action === 'ai') {
      onOpenAI();
    } else if (s.blockType) {
      onInsertBlock(s.blockType);
    }
  }

  return (
    <div className="empty-page-suggestions">
      <span className="empty-page-suggestions__label">Inizia con</span>
      <div className="empty-page-suggestions__pills">
        {SUGGESTIONS.map(s => (
          <button
            key={s.label}
            className={`empty-page-suggestions__pill${s.action === 'ai' ? ' empty-page-suggestions__pill--ai' : ''}`}
            onClick={() => handleClick(s)}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
