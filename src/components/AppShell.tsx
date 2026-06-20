'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import HeaderBar from '@/components/HeaderBar';
import { NavProvider } from '@/lib/nav-context';
import { GithubLogo } from '@phosphor-icons/react';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'nakedstack';
  if (pathname === '/design-system') return 'Design System';
  if (pathname === '/studio') return 'Studio';
  return 'nakedstack';
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const pageTitle = getPageTitle(pathname);

  return (
    <NavProvider>
      {!isHome && <Sidebar />}
      <main className={`main-content${isHome ? ' main-content--full' : ''}`}>
        <HeaderBar title={pageTitle} />
        <div className="content">
          {children}
        </div>
        <footer className="page-footer">
          <div className="page-footer__inner">
            <div className="page-footer__brand">
              <span className="page-footer__logo">naked<span>stack</span></span>
              <span className="page-footer__tagline">Powered by Nicolay</span>
            </div>
            <nav className="page-footer__links">
              <Link href="/studio">Studio</Link>
              <Link href="/design-system">Design System</Link>
              <a href="https://github.com" target="_blank" rel="noopener"><GithubLogo size={16} weight="duotone" /> GitHub</a>
            </nav>
            <div className="page-footer__copy">
              Versione 2.0 &middot; Next.js
            </div>
          </div>
        </footer>
      </main>
    </NavProvider>
  );
}
