'use client';

import Link from 'next/link';
import { useNav } from '@/lib/nav-context';
import { List } from '@phosphor-icons/react';

export default function HeaderBar({ title = 'nakedstack' }: { title?: string }) {
  const { toggleSidebar } = useNav();

  return (
    <header className="page-header">
      <div className="page-header__breadcrumb">
        <span className="current">{title}</span>
      </div>
      <div className="page-header__actions">
        <Link href="/studio">Studio</Link>
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label="Menu"
        >
          <List size={22} weight="duotone" />
        </button>
      </div>
    </header>
  );
}
