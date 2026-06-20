'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useExplore } from '@/lib/explore-context';
import { PaperPlaneRight } from '@phosphor-icons/react';

export default function ChatPanel() {
  const { results, chatHistory, chatIsLoading, sendChatMessage } = useExplore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!results) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || chatIsLoading) return;
    sendChatMessage(trimmed);
    setInput('');
  };

  return (
    <div className="chat-panel">
      {chatHistory.length > 0 && (
        <div className="chat-messages">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`chat-msg chat-msg--${msg.role}`}
            >
              {msg.content}
            </div>
          ))}
          {chatIsLoading && (
            <div className="chat-msg chat-msg--assistant" style={{ opacity: 0.6 }}>
              Scrivendo...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="chat-input-row">
          <input
            type="text"
            className="chat-input"
            placeholder="Fai una domanda di approfondimento..."
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
  );
}
