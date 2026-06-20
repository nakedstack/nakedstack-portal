// ============================================================
// ChatDock — Guscio flottante per la chat del topic (Studio)
// ------------------------------------------------------------
// Contenitore: bottone toggle + pannello. All'interno usa il
// componente <Chat> condiviso, identico a quello della sidebar.
// ============================================================

'use client';

import { useState } from 'react';
import { useExplore } from '@/lib/explore-context';
import { ChatCircle, X } from '@phosphor-icons/react';
import Chat from './Chat';
import { useTopicChatAdapter } from './useTopicChatAdapter';

export default function ChatDock() {
  const { results, chatHistory, currentTopicId } = useExplore();
  const adapter = useTopicChatAdapter();
  const [isOpen, setIsOpen] = useState(false);
  const [seenTopicId, setSeenTopicId] = useState(currentTopicId);

  // Chiudi al cambio di topic (adeguamento dello stato durante il render)
  if (currentTopicId !== seenTopicId) {
    setSeenTopicId(currentTopicId);
    setIsOpen(false);
  }

  if (!results) return null;

  const assistantCount = chatHistory.filter(m => m.role === 'assistant').length;

  return (
    <div className={`chat-dock${isOpen ? ' chat-dock--open' : ''}`}>
      <button
        className="chat-dock__toggle"
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Chiudi chat' : 'Apri chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={16} weight="bold" /> : <ChatCircle size={20} weight="duotone" />}
        {!isOpen && assistantCount > 0 && (
          <span className="chat-dock__badge">{assistantCount}</span>
        )}
      </button>

      <div className="chat-dock__body">
        <div className="chat-dock__header">
          <span className="chat-dock__title">Chat</span>
        </div>
        <Chat adapter={adapter} />
      </div>
    </div>
  );
}
