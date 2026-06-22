'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';
import HeaderBar from '@/components/HeaderBar';
import { NavProvider } from '@/lib/nav-context';
import { useNav } from '@/lib/nav-context';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sidebarWidth } = useNav();
  const isHome = pathname === '/';
  const isPages = pathname.startsWith('/pages');

  return (
    <>
      {!isHome && <Suspense fallback={null}><Sidebar /></Suspense>}
      <main
        className={`main-content${isHome ? ' main-content--full' : ''}`}
        style={!isHome ? { marginLeft: sidebarWidth } : undefined}
      >
        {!isPages && !isHome && <HeaderBar title="nakedstack" />}
        <div className="content">
          {children}
        </div>
      </main>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <NavProvider>
      <AppShellInner>{children}</AppShellInner>
    </NavProvider>
  );
}
