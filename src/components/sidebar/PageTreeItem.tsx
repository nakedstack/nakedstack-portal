'use client';

import { useState, useRef, useEffect } from 'react';
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

/** Posizione viewport-relative del menu contestuale (per position: fixed) */
interface MenuPos { top: number; left: number; }

export function PageTreeItem({ node, depth, onCreateChild, onUpdate, onDelete, onToggleFavorite }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { expandedPageIds, toggleExpand, expandPath } = useNav();

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = pathname === `/pages/${node.id}`;
  const isExpanded = expandedPageIds.has(node.id);
  const hasChildren = node.children.length > 0;

  // Chiude il menu al click fuori
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !menuBtnRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  function navigate() {
    router.push(`/pages/${node.id}`);
    expandPath([node.id]);
  }

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    if (!menuBtnRef.current) return;
    const rect = menuBtnRef.current.getBoundingClientRect();
    // Posiziona il menu a destra del bottone, agganciato in basso
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.max(4, rect.right - 168),
    });
    setMenuOpen(v => !v);
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
    // La navigazione post-eliminazione è gestita dal Sidebar (ha visibilità sull'albero)
    await onDelete(node.id);
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
          aria-label={isExpanded ? 'Comprimi' : 'Espandi'}
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
              className="page-tree-item__rename"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setRenaming(false);
              }}
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="page-tree-item__title">{node.title}</span>
          )}
        </button>

        <div className="page-tree-item__actions">
          <button className="page-tree-item__action-btn" onClick={handleAddChild} title="Aggiungi sottopagina">
            <Plus size={12} />
          </button>
          <button
            ref={menuBtnRef}
            className="page-tree-item__action-btn"
            onClick={openMenu}
            title="Opzioni"
            aria-expanded={menuOpen}
          >
            <DotsThree size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* Menu contestuale — position: fixed per evitare clipping dall'overflow del sidebar */}
      {menuOpen && menuPos && (
        <div
          ref={menuRef}
          className="page-tree-item__menu"
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 500 }}
          role="menu"
        >
          <button
            role="menuitem"
            className="page-tree-item__menu-item"
            onClick={e => { e.stopPropagation(); setMenuOpen(false); setRenaming(true); }}
          >
            <PencilSimple size={13} /> Rinomina
          </button>
          <button role="menuitem" className="page-tree-item__menu-item" onClick={handleFavorite}>
            {node.is_favorite ? <StarHalf size={13} /> : <Star size={13} />}
            {node.is_favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          </button>
          <div className="page-tree-item__menu-divider" />
          <button
            role="menuitem"
            className="page-tree-item__menu-item page-tree-item__menu-item--danger"
            onClick={handleDelete}
          >
            <Trash size={13} /> Elimina
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
