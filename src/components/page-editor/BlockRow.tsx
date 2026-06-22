'use client';

import { useState, useRef } from 'react';
import type { Block, BlockType } from '@/lib/types/pages';
import { BLOCK_REGISTRY } from './registry';
import { CommandMenu } from './CommandMenu';
import { BlockHandle } from './BlockHandle';
import type { BlockComponentProps } from '@/lib/types/pages';

interface Props {
  block: Block;
  onUpdate: BlockComponentProps['onUpdate'];
  onDelete: BlockComponentProps['onDelete'];
  onInsertAfter: BlockComponentProps['onInsertAfter'];
  onConvertType: BlockComponentProps['onConvertType'];
  readOnly?: boolean;
  /** Listener dnd-kit da applicare SOLO sul drag handle */
  dragListeners?: Record<string, unknown>;
  /** Ref callback dnd-kit per il nodo attivatore del drag */
  setDragActivatorRef?: (node: HTMLElement | null) => void;
}

export function BlockRow({ block, onUpdate, onDelete, onInsertAfter, onConvertType, readOnly, dragListeners, setDragActivatorRef }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuQuery, setMenuQuery] = useState('');
  const rowRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLElement | null>(null);

  const BlockComponent = BLOCK_REGISTRY[block.type];

  function handleKeyDownCapture(e: React.KeyboardEvent) {
    const target = e.target as HTMLElement;
    const text = target.textContent ?? '';

    if (e.key === '/' && text === '') {
      setShowMenu(true);
      setMenuQuery('');
      e.preventDefault();
      return;
    }

    if (showMenu) {
      if (e.key === 'Escape') { setShowMenu(false); return; }
      if (e.key === 'Backspace' && menuQuery.length === 0) { setShowMenu(false); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setMenuQuery(prev => prev + e.key);
        e.preventDefault();
        return;
      }
      if (e.key === 'Backspace') {
        setMenuQuery(prev => prev.slice(0, -1));
        e.preventDefault();
        return;
      }
    }
  }

  function handleSelectCommand(type: BlockType) {
    setShowMenu(false);
    setMenuQuery('');
    onConvertType(block.id, type);
  }

  return (
    <div
      ref={rowRef}
      className="block-row"
      data-block-id={block.id}
      onKeyDownCapture={handleKeyDownCapture}
    >
      {!readOnly && (
        <BlockHandle
          onDelete={() => onDelete(block.id)}
          onInsertAfter={() => onInsertAfter(block.id, 'paragraph')}
          onConvert={(type) => onConvertType(block.id, type)}
          dragListeners={dragListeners}
          setDragActivatorRef={setDragActivatorRef}
        />
      )}
      <div className="block-row__content" ref={el => { blockRef.current = el; }}>
        <BlockComponent
          block={block}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onInsertAfter={onInsertAfter}
          onConvertType={onConvertType}
          readOnly={readOnly}
        />
      </div>
      {showMenu && (
        <CommandMenu
          query={menuQuery}
          onSelect={handleSelectCommand}
          onClose={() => setShowMenu(false)}
          anchorRef={blockRef}
        />
      )}
    </div>
  );
}
