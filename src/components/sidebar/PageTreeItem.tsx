'use client';

import { useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Page, PageTreeNode } from '@/lib/types/pages';
import { useNav } from '@/lib/nav-context';
import {
  CaretRight,
  Plus,
  DotsThree,
  Star,
  StarHalf,
  Trash,
  PencilSimple,
  FileText,
} from '@phosphor-icons/react';

interface Props {
  node: PageTreeNode;
  depth: number;
  onCreateChild: (data: { title?: string; parent_id?: string | null }) => Promise<Page>;
  onUpdate: (id: string, data: Partial<Pick<Page, 'title'>>) => Promise<Page>;
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<Page>;
}

export function PageTreeItem({ node, depth, onCreateChild, onUpdate, onDelete, onToggleFavorite }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { expandedPageIds, toggleExpand, expandPath } = useNav();

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const renameRef = useRef<HTMLInputElement>(null);

  const isActive = pathname === `/pages/${node.id}`;
  const isExpanded = expandedPageIds.has(node.id);
  const hasChildren = node.children.length > 0;

  function navigate() {
    router.push(`/pages/${node.id}`);
    // Auto-expand ancestors
    expandPath([node.id]);
  }

  async function handleAddChild(e: React.MouseEvent) {
    e.stopPropagation();
    const page = await onCreateChild({ title: 'Untitled', parent_id: node.id });
    expandPath([node.id]);
    router.push(`/pages/${page.id}`);
  }

  async function handleRenameSubmit() {
    if (renameValue.trim() && renameValue !== node.title) {
      await onUpdate(node.id, { title: renameValue.trim() });
    }
    setRenaming(false);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    await onDelete(node.id);
    if (pathname === `/pages/${node.id}`) router.push('/');
  }

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    await onToggleFavorite(node.id);
  }

  return (
    <div className="page-tree-item" style={{ paddingLeft: depth * 16 }}>
      <div className={`page-tree-item__row${isActive ? ' page-tree-item__row--active' : ''}`}>
        <button
          className={`page-tree-item__expand${hasChildren ? '' : ' page-tree-item__expand--hidden'}`}
          onClick={e => { e.stopPropagation(); toggleExpand(node.id); }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <CaretRight
            size={12}
            weight="bold"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
          />
        </button>

        <button className="page-tree-item__main" onClick={navigate}>
          <span className="page-tree-item__icon">{node.icon ?? <FileText size={14} />}</span>
          {renaming ? (
            <input
              ref={renameRef}
              className="page-tree-item__rename"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setRenaming(false); }}
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="page-tree-item__title">{node.title}</span>
          )}
        </button>

        <div className="page-tree-item__actions">
          <button className="page-tree-item__action-btn" onClick={handleAddChild} title="Add subpage">
            <Plus size={12} />
          </button>
          <button className="page-tree-item__action-btn" onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }} title="Options">
            <DotsThree size={14} weight="bold" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="page-tree-item__menu" role="menu">
          <button role="menuitem" className="page-tree-item__menu-item" onClick={e => { e.stopPropagation(); setMenuOpen(false); setRenaming(true); }}>
            <PencilSimple size={13} /> Rename
          </button>
          <button role="menuitem" className="page-tree-item__menu-item" onClick={handleFavorite}>
            {node.is_favorite ? <StarHalf size={13} /> : <Star size={13} />}
            {node.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          </button>
          <div className="page-tree-item__menu-divider" />
          <button role="menuitem" className="page-tree-item__menu-item page-tree-item__menu-item--danger" onClick={handleDelete}>
            <Trash size={13} /> Delete
          </button>
        </div>
      )}

      {isExpanded && hasChildren && (
        <div className="page-tree-item__children">
          {node.children.map(child => (
            <PageTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onCreateChild={onCreateChild}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
