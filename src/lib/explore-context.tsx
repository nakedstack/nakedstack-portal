'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { Language, DetailLevel } from '@/lib/ai/prompts';
import type { ParsedResponse } from '@/lib/ai/parser';
import { stripRestatedQuestion } from '@/lib/ai/response-cleaner';
import { computeParagraphDiff, diffHasChanges, type DiffSegment } from '@/lib/diff';
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
  /** Incrementato quando l'enrichment agent modifica la concept map (trigger refetch) */
  conceptMapRefreshNonce: number;
  /** Incrementato quando un keyword click apre la chat (trigger auto-open ChatDock) */
  chatOpenNonce: number;
  /** Diff (vecchio -> nuovo) dell'ultimo arricchimento del testo, per la review evidenziata */
  enrichmentDiff: DiffSegment[] | null;
}

interface ExploreContextType extends ExploreState {
  search: (query: string) => Promise<void>;
  exploreKeyword: (term: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<string | null>;
  /** Registra la funzione send dell'adapter attivo (usata da exploreKeyword per delegare) */
  registerAdapterSend: (fn: ((msg: string) => Promise<void>) | null) => void;
  /** Applica l'output dell'enrichment agent allo stato locale (no re-persist) */
  applyEnrichment: (payload: { text?: string; conceptMapChanged?: boolean }) => void;
  /** Nasconde la review evidenziata delle modifiche dell'agent */
  clearEnrichmentDiff: () => void;
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
  conceptMapRefreshNonce: 0,
  chatOpenNonce: 0,
  enrichmentDiff: null,
};

const ExploreContext = createContext<ExploreContextType>({
  ...defaultState,
  search: async () => {},
  exploreKeyword: async () => {},
  sendChatMessage: async () => null,
  registerAdapterSend: () => {},
  applyEnrichment: () => {},
  clearEnrichmentDiff: () => {},
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

  // Ref all'adapter send attivo: permette a exploreKeyword di delegare
  // al pipeline completo (chat + arricchimento + banner) senza duplicare logica.
  const adapterSendRef = useRef<((msg: string) => Promise<void>) | null>(null);

  const registerAdapterSend = useCallback((fn: ((msg: string) => Promise<void>) | null) => {
    adapterSendRef.current = fn;
  }, []);

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
      enrichmentDiff: null,
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

      const data: ParsedResponse = await res.json();

      // Pulisci il testo della risposta da eventuali ripetizioni della domanda
      const cleanedText = stripRestatedQuestion(data.text, query);
      const cleaned: ParsedResponse = { ...data, text: cleanedText };

      // Auto-save as a new topic with original query as title
      const saved = await Storage.saveTopic({
        title: query,
        results: cleaned,
        chatHistory: [],
        language: state.language,
        detailLevel: state.detailLevel,
      });

      const topics = await Storage.getTopics();

      setState(prev => ({
        ...prev,
        results: cleaned,
        isLoading: false,
        currentTopicId: saved.id,
        savedTopics: topics,
      }));

      // Generate a better title asynchronously
      fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context: cleanedText }),
      }).then(r => r.json()).then(d => {
        if (d.title && d.title !== query) {
          Storage.saveTopic({
            id: saved.id,
            title: d.title,
            results: cleaned,
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
      fetchSuggestions(query, cleanedText);

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
    // Apre il ChatDock e delega al pipeline completo dell'adapter
    // (sendChatMessage + useChatEnrichment + banner isEnriching).
    setState(prev => ({ ...prev, chatOpenNonce: prev.chatOpenNonce + 1 }));
    if (adapterSendRef.current) {
      await adapterSendRef.current(`Approfondisci: ${term}`);
    }
  }, []);

  const sendChatMessage = useCallback(async (message: string): Promise<string | null> => {
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
        const updated = [...prev.chatHistory, assistantEntry];
        if (prev.currentTopicId) {
          Storage.updateTopicChat(prev.currentTopicId, updated); // fire-and-forget
        }
        return {
          ...prev,
          chatHistory: updated,
          chatIsLoading: false,
        };
      });

      return data.answer as string;

    } catch (err) {
      setState(prev => ({
        ...prev,
        chatIsLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
      return null;
    }
  }, [state.language, state.detailLevel, state.chatHistory]);

  // Applica l'output dell'enrichment agent allo stato locale.
  // La persistenza e gia avvenuta server-side (/api/enrich): qui aggiorniamo
  // solo la UI (testo del topic) e segnaliamo il refresh della concept map.
  const applyEnrichment = useCallback((payload: { text?: string; conceptMapChanged?: boolean }) => {
    setState(prev => {
      const nextNonce = payload.conceptMapChanged
        ? prev.conceptMapRefreshNonce + 1
        : prev.conceptMapRefreshNonce;

      // Nessun cambio di testo: aggiorna solo la mappa
      if (!payload.text || !prev.results || payload.text === prev.results.text) {
        return { ...prev, conceptMapRefreshNonce: nextNonce };
      }

      // Calcola il diff (vecchio -> nuovo) per la review evidenziata
      const diff = computeParagraphDiff(prev.results.text, payload.text);
      return {
        ...prev,
        results: { ...prev.results, text: payload.text },
        enrichmentDiff: diffHasChanges(diff) ? diff : null,
        conceptMapRefreshNonce: nextNonce,
      };
    });
  }, []);

  const clearEnrichmentDiff = useCallback(() => {
    setState(prev => (prev.enrichmentDiff ? { ...prev, enrichmentDiff: null } : prev));
  }, []);

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
        enrichmentDiff: null,
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
        enrichmentDiff: null,
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
    try {
      const topic = await Storage.getTopic(id);
      if (!topic) return;

      // Pulisci anche i topic vecchi (salvati prima del fix)
      const cleanedResults: ParsedResponse | null = topic.results
        ? (() => {
            const cleanedText = stripRestatedQuestion(topic.results.text, topic.title);
            return cleanedText !== topic.results.text
              ? { ...topic.results, text: cleanedText }
              : topic.results;
          })()
        : null;

      setState(prev => ({
        ...prev,
        query: topic.title,
        results: cleanedResults,
        chatHistory: topic.chatHistory,
        breadcrumbs: [],
        suggestions: [],
        error: null,
        currentTopicId: topic.id,
        enrichmentDiff: null,
      }));

      // Rigenera i suggerimenti per topic vecchi che non li hanno
      if (cleanedResults) {
        fetchSuggestions(topic.title, cleanedResults.text);
      }
    } catch (err) {
      // Topic non trovato (es. dopo migrazione schema) → ignora
      console.warn('Failed to load topic:', id, err instanceof Error ? err.message : err);
    }
  }, [fetchSuggestions]);

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
        registerAdapterSend,
        applyEnrichment,
        clearEnrichmentDiff,
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
