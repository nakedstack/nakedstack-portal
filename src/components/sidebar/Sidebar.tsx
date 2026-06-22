'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { PageTreeNode } from '@/lib/types/pages';
import { useNav } from '@/lib/nav-context';
import { usePageTree } from '@/lib/hooks/usePageTree';
import { PageTreeItem } from './PageTreeItem';
import { WorkspaceHeader } from './WorkspaceHeader';
import { SidebarSearch } from './SidebarSearch';
import { SidebarResizeHandle } from './SidebarResizeHandle';
import { Plus, Trash } from '@phosphor-icons/react';

export function Sidebar() {
  const { sidebarOpen, sidebarWidth } = useNav();
  const router = useRouter();
  const pathname = usePathname();
  const { tree, loading, createPage, updatePage, deletePage, toggleFavorite } = usePageTree();

  const favorites = flattenTree(tree).filter(p => p.is_favorite);

  async function handleNewPage() {
    const page = await createPage({ title: 'Untitled' });
    router.push(`/pages/${page.id}`);
  }

  async function handleDeletePage(id: string) {
    const isCurrentPage = pathname === `/pages/${id}`;

    if (!isCurrentPage) {
      await deletePage(id);
      return;
    }

    // Determina il fallback prima di eliminare (l'albero cambierà dopo)
    const next = findNextPage(tree, id);
    await deletePage(id);

    if (next) {
      router.push(`/pages/${next.id}`);
    } else {
      // Nessuna pagina rimasta: crea una nuova e naviga
      const newPage = await createPage({ title: 'Untitled' });
      router.push(`/pages/${newPage.id}`);
    }
  }

  return (
    <>
      <aside
        className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}
        style={{ width: sidebarWidth }}
        aria-label="Navigation"
      >
        <WorkspaceHeader />
        <SidebarSearch tree={tree} />

        <nav className="sidebar__nav">
          {favorites.length > 0 && (
            <section className="sidebar__section">
              <div className="sidebar__section-title">Favorites</div>
              {favorites.map(page => (
                <PageTreeItem
                  key={page.id}
                  node={page}
                  depth={0}
                  onCreateChild={createPage}
                  onUpdate={updatePage}
                  onDelete={handleDeletePage}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </section>
          )}

          <section className="sidebar__section">
            <div className="sidebar__section-title">Pages</div>
            {loading ? (
              <div className="sidebar__loading">Loading…</div>
            ) : tree.length === 0 ? (
              <div className="sidebar__empty">No pages yet</div>
            ) : (
              tree.map(node => (
                <PageTreeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  onCreateChild={createPage}
                  onUpdate={updatePage}
                  onDelete={handleDeletePage}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            )}
          </section>
        </nav>

        <div className="sidebar__bottom">
          <button className="sidebar__new-page" onClick={handleNewPage}>
            <Plus size={14} /> New page
          </button>
          <button className="sidebar__trash" onClick={() => router.push('/trash')}>
            <Trash size={14} /> Cestino
          </button>
        </div>

        <SidebarResizeHandle />
      </aside>
      <div className="sidebar-overlay" onClick={() => {}} aria-hidden />
    </>
  );
}

function flattenTree(nodes: PageTreeNode[]): PageTreeNode[] {
  return nodes.flatMap(n => [n, ...flattenTree(n.children)]);
}

/**
 * Restituisce la pagina migliore a cui navigare dopo aver eliminato `deletedId`.
 * Preferisce la pagina immediatamente precedente nell'albero piatto;
 * se non esiste, la successiva (saltando i discendenti del nodo eliminato).
 */
function findNextPage(tree: PageTreeNode[], deletedId: string): PageTreeNode | null {
  const flat = flattenTree(tree);
  const idx = flat.findIndex(n => n.id === deletedId);
  if (flat.length <= 1 || idx === -1) return null;

  // Calcola tutti gli ID del sottoalbero eliminato (nodo + discendenti)
  const deleted = flat[idx];
  const deletedIds = new Set<string>([deletedId]);
  flattenTree(deleted.children).forEach(n => deletedIds.add(n.id));

  // Cerca prima nella direzione precedente
  for (let i = idx - 1; i >= 0; i--) {
    if (!deletedIds.has(flat[i].id)) return flat[i];
  }
  // Poi nella direzione successiva
  for (let i = idx + 1; i < flat.length; i++) {
    if (!deletedIds.has(flat[i].id)) return flat[i];
  }
  return null;
}
