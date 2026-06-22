'use client';

import Link from 'next/link';
import type { Page } from '@/lib/types/pages';
import { CaretRight } from '@phosphor-icons/react';

interface Props {
  ancestors: Page[];
  current: Page;
}

export function PageBreadcrumb({ ancestors, current }: Props) {
  if (ancestors.length === 0) return null;

  return (
    <nav className="page-breadcrumb" aria-label="Page path">
      {ancestors.map(page => (
        <span key={page.id} className="page-breadcrumb__item">
          <Link href={`/pages/${page.id}`} className="page-breadcrumb__link">
            {page.icon && <span>{page.icon}</span>}
            {page.title}
          </Link>
          <CaretRight size={12} className="page-breadcrumb__sep" aria-hidden />
        </span>
      ))}
      <span className="page-breadcrumb__item page-breadcrumb__item--current">
        {current.icon && <span>{current.icon}</span>}
        {current.title}
      </span>
    </nav>
  );
}
