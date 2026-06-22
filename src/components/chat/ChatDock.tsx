'use client';

import { useState } from 'react';
import { ChatCircle, X } from '@phosphor-icons/react';
import Chat from './Chat';
import { usePageChatAdapter } from './usePageChatAdapter';

interface Props {
  pageId?: string;
  pageTitle?: string;
}

function ChatDockInner({ pageId, pageTitle }: Required<Props>) {
  const adapter = usePageChatAdapter({ pageId, pageTitle });
  return <Chat adapter={adapter} />;
}

export default function ChatDock({ pageId, pageTitle }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!pageId) return null;

  return (
    <div className={`chat-dock`}>
      <button
        className="chat-dock__toggle"
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Chiudi chat' : 'Apri chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={16} weight="bold" /> : <ChatCircle size={20} weight="duotone" />}
      </button>

      {isOpen && (
        <div className="chat-dock__panel">
          <div className="chat-dock__header">
            <span>{pageTitle ?? 'Chat'}</span>
            <button onClick={() => setIsOpen(false)} aria-label="Chiudi"><X size={14} /></button>
          </div>
          <div className="chat-dock__body">
            <ChatDockInner pageId={pageId} pageTitle={pageTitle ?? ''} />
          </div>
        </div>
      )}
    </div>
  );
}
