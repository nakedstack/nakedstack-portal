'use client';

import { useCallback } from 'react';
import { usePageEditor } from '@/lib/hooks/usePageEditor';
import { usePageAncestors } from '@/lib/hooks/usePageAncestors';
import { useBlocksReorder } from '@/lib/hooks/useBlocksReorder';
import { PageTitle } from './PageTitle';
import { PageBreadcrumb } from './PageBreadcrumb';
import { BlockList } from './BlockList';
import type { Block } from '@/lib/types/pages';

interface Props {
  pageId: string;
}

export function PageEditor({ pageId }: Props) {
  const {
    page, blocks, loading, error,
    updateBlockContent, convertBlockType, insertBlockAfter, deleteBlock, updateTitle,
  } = usePageEditor(pageId);

  const { ancestors } = usePageAncestors(pageId);

  const setReorderedBlocks = useCallback((reordered: Block[]) => {
    // blocks state is managed inside usePageEditor; reorder hook calls the API
  }, []);

  const { handleDragEnd } = useBlocksReorder(pageId, blocks, setReorderedBlocks);

  if (loading) return <div className="page-editor__loading">Loading…</div>;
  if (error || !page) return <div className="page-editor__error">{error ?? 'Page not found'}</div>;

  return (
    <div className="page-editor">
      <PageBreadcrumb ancestors={ancestors} current={page} />
      <div className="page-editor__header">
        {page.icon && <span className="page-editor__icon">{page.icon}</span>}
        <PageTitle title={page.title} onChange={updateTitle} />
      </div>
      <BlockList
        blocks={blocks}
        onUpdate={updateBlockContent}
        onDelete={deleteBlock}
        onInsertAfter={insertBlockAfter}
        onConvertType={convertBlockType}
        onReorder={handleDragEnd}
      />
      {blocks.length === 0 && (
        <button
          className="page-editor__empty-hint"
          onClick={() => insertBlockAfter('', 'paragraph')}
        >
          Click to start writing, or type &apos;/&apos; for commands
        </button>
      )}
    </div>
  );
}
