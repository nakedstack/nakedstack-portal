'use client';

import Link from 'next/link';
import type { BlockComponentProps } from '@/lib/types/pages';
import { FileText } from '@phosphor-icons/react';

export function SubpageBlock({ block }: BlockComponentProps) {
  const pageId = block.content.page_id;
  const title = block.content.rich_text?.[0]?.text ?? 'Untitled';

  if (!pageId) return null;

  return (
    <Link href={`/pages/${pageId}`} className="block-subpage" data-block-id={block.id}>
      <FileText size={16} />
      <span>{title}</span>
    </Link>
  );
}
