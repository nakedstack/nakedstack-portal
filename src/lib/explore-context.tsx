'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Language, DetailLevel } from '@/lib/ai/prompts';
import type { ParsedResponse } from '@/lib/ai/parser';
import * as Storage from '@/lib/storage';
import type { SavedTopic, ChatEntry } from '@/lib/storage';

// ---- Types ----

export type { ChatEntry } from '@/lib/storage';

export interface BreadcrumbItem {
  term: string;
  query: string;
  response: ParsedResponse | null;
}

interface ExploreState {
  query: string;
  results: ParsedResponse | null;
  breadcrumbs: BreadcrumbItem[];
  chatHistory: ChatEntry[];
  language: Language;
  detailLevel: DetailLevel;
  isLoading: boolean;
  chatIsLoading: boolean;
  suggestions: string[];
  suggestionsLoading: boolean;
  error: string | null;
  currentTopicId: string | null;
  savedTopics: SavedTopic[];
}

interface ExploreContextType extends ExploreState {
  search: (query: string) => Promise<void>;
  exploreKeyword: (term: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  goBackTo: (index: number) => void;
  setLanguage: (lang: Language) => void;
  setDetailLevel: (level: DetailLevel) => void;
  clearAll: () => void;
  loadTopic: (id: string) => void;
  saveCurrentTopic: () => void;
  deleteSavedTopic: (id: string) => void;
}

// ---- Default state ----

const defaultState: ExploreState = {
  query: '',
  results: null,
  breadcrumbs: [],
  chatHistory: [],
  language: 'it',
  detailLevel: 'avanzato',
  isLoading: false,
  chatIsLoading: false,
  suggestions: [],
  suggestionsLoading: false,
  error: null,
  currentTopicId: null,
  savedTopics: [],
};

const ExploreContext = createContext<ExploreContextType>({
  ...defaultState,
  search: async () => {},
  exploreKeyword: async () => {},
  sendChatMessage: async () => {},
  goBackTo: () => {},
  setLanguage: () => {},
  setDetailLevel: () => {},
  clearAll: () => {},
  loadTopic: () => {},
  saveCurrentTopic: () => {},
  deleteSavedTopic: () => {},
});

// ---- Provider ----

export function ExploreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ExploreState>(defaultState);

  // Auto-detect language from browser
  useEffect(() => {
    const browserLang = (typeof navigator !== 'undefined' ? navigator.language : 'it').split('-')[0];
    const supported = ['it', 'en', 'es', 'fr'];
    const lang = supported.includes(browserLang) ? browserLang as Language : 'it';
    setState(prev => (prev.language === 'it' ? { ...prev, language: lang } : prev));
  }, []);

  // Load saved topics on mount
  useEffect(() => {
    Storage.getTopics().then(topics => {
      setState(prev => ({ ...prev, savedTopics: topics }));
    });
  }, []);

  const refreshTopics = useCallback(async () => {
    const topics = await Storage.getTopics();
    setState(prev => ({ ...prev, savedTopics: topics }));
  }, []);

  const search = useCallback(async (query: string) => {
    setState(prev => ({
      ...prev,
      query,
      isLoading: true,
      error: null,
      results: null,
      chatHistory: [],
      suggestions: [],
    }));

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          language: state.language,
          detailLevel: state.detailLevel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Search failed');
      }

      const data: ParsedResponse & { query: string } = await res.json();

      // Auto-save as a new topic with original query as title
      const saved = await Storage.saveTopic({
        title: query,
        results: data,
        chatHistory: [],
        language: state.language,
        detailLevel: state.detailLevel,
      });

      const topics = await Storage.getTopics();

      setState(prev => ({
        ...prev,
        results: data,
        isLoading: false,
        currentTopicId: saved.id,
        savedTopics: topics,
      }));

      // Generate a better title asynchronously
      fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context: data.text }),
      }).then(r => r.json()).then(d => {
        if (d.title && d.title !== query) {
          Storage.saveTopic({
            id: saved.id,
            title: d.title,
            results: data,
            chatHistory: [],
            language: state.language,
            detailLevel: state.detailLevel,
          }).then(() => {
            Storage.getTopics().then(updated => {
              setState(prev => ({ ...prev, savedTopics: updated }));
            });
          });
        }
      }).catch(() => { /* title generation failed, keep original */ });

      // Fetch suggestions after results
      fetchSuggestions(query, data.text);

    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [state.language, state.detailLevel]);

  const fetchSuggestions = useCallback(async (topic: string, context: string) => {
    setState(prev => ({ ...prev, suggestionsLoading: true }));

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, context, language: state.language }),
      });

      if (res.ok) {
        const data = await res.json();
        setState(prev => ({
          ...prev,
          suggestions: data.suggestions || [],
          suggestionsLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, suggestionsLoading: false }));
      }
    } catch {
      setState(prev => ({ ...prev, suggestionsLoading: false }));
    }
  }, [state.language]);

  const exploreKeyword = useCallback(async (term: string) => {
    // Se il termine e gia nella breadcrumb, torna a quel livello
    const existingIndex = state.breadcrumbs.findIndex(b => b.term === term);
    if (existingIndex >= 0) {
      const item = state.breadcrumbs[existingIndex];
      setState(prev => ({
        ...prev,
        query: item.query,
        results: item.response,
        breadcrumbs: prev.breadcrumbs.slice(0, existingIndex + 1),
        chatHistory: [],
        suggestions: [],
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: term,
          language: state.language,
          detailLevel: state.detailLevel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Search failed');
      }

      const data: ParsedResponse & { query: string } = await res.json();

      const breadcrumbItem: BreadcrumbItem = {
        term,
        query: term,
        response: data,
      };

      setState(prev => ({
        ...prev,
        query: term,
        results: data,
        breadcrumbs: [...prev.breadcrumbs, breadcrumbItem],
        chatHistory: [],
        suggestions: [],
        isLoading: false,
      }));

      fetchSuggestions(term, data.text);

    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [state.language, state.detailLevel, state.breadcrumbs, fetchSuggestions]);

  const sendChatMessage = useCallback(async (message: string) => {
    const newEntry: ChatEntry = { role: 'user', content: message };

    setState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, newEntry],
      chatIsLoading: true,
      error: null,
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: state.chatHistory,
          question: message,
          language: state.language,
          detailLevel: state.detailLevel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chat failed');
      }

      const data = await res.json();
      const assistantEntry: ChatEntry = { role: 'assistant', content: data.answer };

      setState(prev => {
        const updated = [...prev.chatHistory, newEntry, assistantEntry];
        if (prev.currentTopicId) {
          Storage.updateTopicChat(prev.currentTopicId, updated); // fire-and-forget
        }
        return {
          ...prev,
          chatHistory: updated,
          chatIsLoading: false,
        };
      });

    } catch (err) {
      setState(prev => ({
        ...prev,
        chatIsLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [state.language, state.detailLevel, state.chatHistory]);

  const goBackTo = useCallback((index: number) => {
    if (index < 0) {
      // Torna allo stato iniziale
      setState(prev => ({
        ...prev,
        query: '',
        results: null,
        breadcrumbs: [],
        chatHistory: [],
        suggestions: [],
        error: null,
      }));
      return;
    }

    const item = state.breadcrumbs[index];
    if (item) {
      setState(prev => ({
        ...prev,
        query: item.query,
        results: item.response,
        breadcrumbs: prev.breadcrumbs.slice(0, index + 1),
        chatHistory: [],
        suggestions: [],
      }));
    }
  }, [state.breadcrumbs]);

  const setLanguageHandler = useCallback((lang: Language) => {
    setState(prev => ({ ...prev, language: lang }));
  }, []);

  const setDetailLevelHandler = useCallback((level: DetailLevel) => {
    setState(prev => ({ ...prev, detailLevel: level }));
  }, []);

  const clearAll = useCallback(() => {
    setState(prev => ({ ...defaultState, savedTopics: prev.savedTopics }));
  }, []);

  const loadTopic = useCallback(async (id: string) => {
    const topic = await Storage.getTopic(id);
    if (!topic) return;
    setState(prev => ({
      ...prev,
      query: topic.title,
      results: topic.results,
      chatHistory: topic.chatHistory,
      breadcrumbs: [],
      suggestions: [],
      error: null,
      currentTopicId: topic.id,
    }));
  }, []);

  const saveCurrentTopic = useCallback(async () => {
    setState(prev => {
      if (!prev.results) return prev;
      Storage.saveTopic({
        id: prev.currentTopicId || undefined,
        title: prev.query,
        results: prev.results,
        chatHistory: prev.chatHistory,
        language: prev.language,
        detailLevel: prev.detailLevel,
      }).then(async (saved) => {
        const topics = await Storage.getTopics();
        setState(p => ({
          ...p,
          currentTopicId: saved.id,
          savedTopics: topics,
        }));
      });
      return prev;
    });
  }, []);

  const deleteSavedTopic = useCallback(async (id: string) => {
    await Storage.deleteTopic(id);
    const topics = await Storage.getTopics();
    setState(prev => ({
      ...prev,
      savedTopics: topics,
      currentTopicId: prev.currentTopicId === id ? null : prev.currentTopicId,
    }));
  }, []);

  return (
    <ExploreContext.Provider
      value={{
        ...state,
        search,
        exploreKeyword,
        sendChatMessage,
        goBackTo,
        setLanguage: setLanguageHandler,
        setDetailLevel: setDetailLevelHandler,
        clearAll,
        loadTopic,
        saveCurrentTopic,
        deleteSavedTopic,
      }}
    >
      {children}
    </ExploreContext.Provider>
  );
}

// ---- Hook ----

export function useExplore() {
  return useContext(ExploreContext);
}
