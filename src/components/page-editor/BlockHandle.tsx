'use client';

import { useState, useRef } from 'react';
import type { BlockType } from '@/lib/types/pages';
import { DotsSixVertical, Plus, Trash, ArrowsOut } from '@phosphor-icons/react';
import { BLOCK_REGISTRY } from './registry';

interface Props {
  onDelete: () => void;
  onInsertAfter: () => void;
  onConvert: (type: BlockType) => void;
  /** Listener dnd-kit — applicati solo sul bottone ⠿ */
  dragListeners?: Record<string, unknown>;
  /** Ref callback dnd-kit per il nodo attivatore drag */
  setDragActivatorRef?: (node: HTMLElement | null) => void;
}

const CONVERT_OPTIONS = Object.keys(BLOCK_REGISTRY) as BlockType[];

export function BlockHandle({ onDelete, onInsertAfter, onConvert, dragListeners, setDragActivatorRef }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <div className="block-handle">
      <button className="block-handle__btn" onClick={onInsertAfter} title="Add block below">
        <Plus size={14} />
      </button>
      {/* Drag handle — listeners solo su questo bottone */}
      <button
        ref={setDragActivatorRef}
        className="block-handle__btn block-handle__btn--drag"
        title="Trascina per spostare / clic per opzioni"
        onClick={() => setMenuOpen(v => !v)}
        {...(dragListeners as Record<string, React.EventHandler<React.SyntheticEvent>>)}
      >
        <DotsSixVertical size={14} />
      </button>

      {menuOpen && (
        <div ref={menuRef} className="block-handle__menu" role="menu">
          <button role="menuitem" className="block-handle__menu-item block-handle__menu-item--danger" onClick={() => { setMenuOpen(false); onDelete(); }}>
            <Trash size={14} /> Delete
          </button>
          <div className="block-handle__menu-divider" />
          <div className="block-handle__menu-label">Turn into</div>
          {CONVERT_OPTIONS.map(type => (
            <button
              key={type}
              role="menuitem"
              className="block-handle__menu-item"
              onClick={() => { setMenuOpen(false); onConvert(type); }}
            >
              <ArrowsOut size={12} /> {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
