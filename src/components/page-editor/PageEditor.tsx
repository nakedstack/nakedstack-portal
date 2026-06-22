'use client';

import { useState, useCallback } from 'react';
import { Sparkle } from '@phosphor-icons/react';
import { usePageEditor } from '@/lib/hooks/usePageEditor';
import { usePageAncestors } from '@/lib/hooks/usePageAncestors';
import { useBlocksReorder } from '@/lib/hooks/useBlocksReorder';
import { usePageAIAdapter } from '@/lib/hooks/usePageAIAdapter';
import { AIChatPanel } from '@/components/chat/AIChatPanel';
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
    blockWriter,
  } = usePageEditor(pageId);

  const { ancestors } = usePageAncestors(pageId);

  const setReorderedBlocks = useCallback((_reordered: Block[]) => {
    // blocks state is managed inside usePageEditor; reorder hook calls the API
  }, []);

  const { handleDragEnd } = useBlocksReorder(pageId, blocks, setReorderedBlocks);

  const [aiOpen, setAiOpen] = useState(false);

  // Adapter depends on IBlockWriter abstraction (Dependency Inversion)
  const aiAdapter = usePageAIAdapter({
    pageId,
    pageTitle: page?.title ?? '',
    blockWriter,
  });

  if (loading) return <div className="page-editor__loading">Loading…</div>;
  if (error || !page) return <div className="page-editor__error">{error ?? 'Page not found'}</div>;

  return (
    <>
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
            Clicca per iniziare a scrivere, oppure &apos;/&apos; per i comandi, o apri AI per generare contenuto
          </button>
        )}
      </div>

      {/* Fixed FAB — bottom-right */}
      <button
        className={`ai-fab${aiOpen ? ' ai-fab--active' : ''}`}
        onClick={() => setAiOpen(v => !v)}
        aria-label={aiOpen ? 'Chiudi AI' : 'Apri AI'}
        aria-pressed={aiOpen}
      >
        <Sparkle size={20} weight={aiOpen ? 'fill' : 'duotone'} />
      </button>

      {/* Fixed chat panel — right side */}
      {aiOpen && <AIChatPanel adapter={aiAdapter} onClose={() => setAiOpen(false)} />}
    </>
  );
}
