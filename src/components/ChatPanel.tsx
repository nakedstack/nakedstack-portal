'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { useExplore } from '@/lib/explore-context';
import { PaperPlaneRight, ChatCircle, X } from '@phosphor-icons/react';
import FormattedText from '@/components/concept-map/FormattedText';

export default function ChatPanel() {
  const { results, chatHistory, chatIsLoading, sendChatMessage, currentTopicId } = useExplore();
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chiudi pannello al cambio topic
  useEffect(() => {
    setIsOpen(false);
  }, [currentTopicId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen]);

  const handleKeywordClick = useCallback((term: string) => {
    sendChatMessage(`Approfondisci "${term}"`);
    setIsOpen(true);
  }, [sendChatMessage]);

  if (!results) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || chatIsLoading) return;
    sendChatMessage(trimmed);
    setInput('');
    setIsOpen(true);
  };

  const assistantCount = chatHistory.filter(m => m.role === 'assistant').length;

  return (
    <div className={`chat-panel${isOpen ? ' chat-panel--open' : ''}`}>
      <button
        className="chat-panel__toggle"
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Chiudi chat' : 'Apri chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={16} weight="bold" /> : <ChatCircle size={20} weight="duotone" />}
        {!isOpen && assistantCount > 0 && (
          <span className="chat-panel__badge">{assistantCount}</span>
        )}
      </button>

      <div className="chat-panel__body">
        <div className="chat-panel__header">
          <span className="chat-panel__title">Chat</span>
        </div>

        <div className="chat-messages">
          {chatHistory.length === 0 && !chatIsLoading && (
            <p className="chat-empty">Fai una domanda per approfondire questo argomento.</p>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
              <FormattedText text={msg.content} onKeywordClick={handleKeywordClick} />
            </div>
          ))}
          {chatIsLoading && (
            <div className="chat-msg chat-msg--assistant" style={{ opacity: 0.6 }}>
              Scrivendo...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input"
              placeholder="Fai una domanda..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={chatIsLoading}
              aria-label="Domanda di approfondimento"
            />
            <button
              type="submit"
              className="chat-send"
              disabled={chatIsLoading || !input.trim()}
              aria-label="Invia"
            >
              <PaperPlaneRight size={18} weight="duotone" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
