'use client';

import { useRouter } from 'next/navigation';
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
  const { tree, loading, createPage, updatePage, deletePage, toggleFavorite } = usePageTree();

  const favorites = flattenTree(tree).filter(p => p.is_favorite);

  async function handleNewPage() {
    const page = await createPage({ title: 'Untitled' });
    router.push(`/pages/${page.id}`);
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
                  onDelete={deletePage}
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
                  onDelete={deletePage}
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
            <Trash size={14} /> Trash
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
