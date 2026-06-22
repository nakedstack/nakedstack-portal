'use client';

import type { AIBlockOp } from '@/lib/types/ai';

interface Props {
  ops: AIBlockOp[];
}

/** Renders a simplified preview of pending AI block operations. Read-only. */
export function BlockPreview({ ops }: Props) {
  const allBlocks = ops.flatMap(op => op.blocks);
  if (allBlocks.length === 0) return null;

  const opLabel = ops[0]?.type === 'replace_all' ? 'Sostituisce tutto il contenuto' : `Aggiunge ${allBlocks.length} blocco${allBlocks.length !== 1 ? 'i' : ''}`;

  return (
    <div className="block-preview">
      <div className="block-preview__label">{opLabel}</div>
      <div className="block-preview__list">
        {allBlocks.map((block, i) => {
          const text = block.content.rich_text?.map(s => s.text).join('') ?? block.content.url ?? block.content.caption ?? '';
          return (
            <div key={i} className="block-preview__item">
              <span className="block-preview__type">{block.type.replace(/_/g, ' ')}</span>
              {text && <span className="block-preview__text">{text.slice(0, 120)}{text.length > 120 ? '…' : ''}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
