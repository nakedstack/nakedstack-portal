'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PageTreeNode } from '@/lib/types/pages';
import { MagnifyingGlass } from '@phosphor-icons/react';

interface Props {
  tree: PageTreeNode[];
}

function flattenTree(nodes: PageTreeNode[]): PageTreeNode[] {
  return nodes.flatMap(n => [n, ...flattenTree(n.children)]);
}

export function SidebarSearch({ tree }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const results = query.trim().length > 0
    ? flattenTree(tree).filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <>
      <button className="sidebar-search__trigger" onClick={() => setOpen(true)}>
        <MagnifyingGlass size={14} /> Search
      </button>

      {open && (
        <div className="sidebar-search__overlay" onClick={() => { setOpen(false); setQuery(''); }}>
          <div className="sidebar-search__modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Search pages">
            <div className="sidebar-search__input-wrap">
              <MagnifyingGlass size={16} />
              <input
                className="sidebar-search__input"
                placeholder="Search pages…"
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div className="sidebar-search__results">
              {results.length === 0 && query.trim() && (
                <div className="sidebar-search__empty">No results</div>
              )}
              {results.map(page => (
                <button
                  key={page.id}
                  className="sidebar-search__result"
                  onClick={() => { setOpen(false); setQuery(''); router.push(`/pages/${page.id}`); }}
                >
                  <span>{page.icon ?? '📄'}</span>
                  <span>{page.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
