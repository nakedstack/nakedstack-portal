'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkle } from '@phosphor-icons/react';
import { usePageEditor } from '@/lib/hooks/usePageEditor';
import { usePageAncestors } from '@/lib/hooks/usePageAncestors';
import { useBlocksReorder } from '@/lib/hooks/useBlocksReorder';
import { usePageAIAdapter } from '@/lib/hooks/usePageAIAdapter';
import { useTextSelection } from '@/lib/hooks/useTextSelection';
import { useInlineAI } from '@/lib/hooks/useInlineAI';
import { AIChatPanel } from '@/components/chat/AIChatPanel';
import { SelectionToolbar } from './SelectionToolbar';
import { PageTitle } from './PageTitle';
import { PageBreadcrumb } from './PageBreadcrumb';
import { BlockList } from './BlockList';
import { EmptyPageSuggestions } from './EmptyPageSuggestions';
import { plainText } from '@/lib/utils/rich-text';
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
  const editorRef = useRef<HTMLDivElement>(null);

  // Adapter AI dipende dall'astrazione IBlockWriter (Dependency Inversion)
  const aiAdapter = usePageAIAdapter({
    pageId,
    pageTitle: page?.title ?? '',
    blockWriter,
  });

  // Selezione testo scoped al container dell'editor
  const textSelection = useTextSelection(editorRef);

  // AI inline: rielaborazione del testo selezionato
  const inlineAI = useInlineAI({ pageId, onApply: updateBlockContent });

  // Auto-focus sul primo blocco editabile al caricamento della pagina (come Word)
  const didAutoFocus = useRef(false);
  useEffect(() => { didAutoFocus.current = false; }, [pageId]);
  useEffect(() => {
    if (loading || didAutoFocus.current || !editorRef.current) return;
    const editable = editorRef.current.querySelector<HTMLElement>('[contenteditable="true"]');
    if (editable) { editable.focus(); didAutoFocus.current = true; }
  }, [loading, pageId]);

  // Click su area vuota dell'editor → riporta il focus all'ultimo blocco editabile
  function handleEditorClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('[contenteditable]') || target.closest('button') || target.closest('input')) return;
    const editables = editorRef.current?.querySelectorAll<HTMLElement>('[contenteditable="true"]');
    const last = editables?.[editables.length - 1];
    last?.focus();
  }

  if (loading) return <div className="page-editor__loading">Loading…</div>;
  if (error || !page) return <div className="page-editor__error">{error ?? 'Page not found'}</div>;

  // Vero quando c'è un solo blocco paragrafo ancora senza testo
  const hasOnlyEmptyBlock =
    blocks.length === 1 &&
    blocks[0].type === 'paragraph' &&
    plainText(blocks[0].content.rich_text) === '';

  return (
    <>
      <div className={`page-editor${hasOnlyEmptyBlock ? ' page-editor--empty' : ''}`} ref={editorRef} onClick={handleEditorClick}>
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
        {hasOnlyEmptyBlock && (
          <>
            <div className="page-editor__spacer" />
            <EmptyPageSuggestions
              onInsertBlock={type => insertBlockAfter('', type)}
              onOpenAI={() => setAiOpen(true)}
            />
          </>
        )}
      </div>

      {/* FAB fisso in basso a destra */}
      <button
        className={`ai-fab${aiOpen ? ' ai-fab--active' : ''}`}
        onClick={() => setAiOpen(v => !v)}
        aria-label={aiOpen ? 'Chiudi AI' : 'Apri AI'}
        aria-pressed={aiOpen}
      >
        <Sparkle size={20} weight={aiOpen ? 'fill' : 'duotone'} />
      </button>

      {/* Pannello AI fisso a destra */}
      {aiOpen && <AIChatPanel adapter={aiAdapter} onClose={() => setAiOpen(false)} />}

      {/* Toolbar selezione testo inline */}
      {textSelection && textSelection.blockId && (
        <SelectionToolbar
          selection={textSelection}
          isLoading={inlineAI.isLoading}
          pendingText={inlineAI.pendingText}
          onAction={(action, prompt) => {
            if (textSelection.blockId) {
              inlineAI.request(textSelection.blockId, textSelection.text, action, prompt);
            }
          }}
          onApply={inlineAI.apply}
          onDiscard={inlineAI.discard}
        />
      )}
    </>
  );
}
