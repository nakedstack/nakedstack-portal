'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useExplore } from '@/lib/explore-context';
import SearchInput from '@/components/SearchInput';
import BreadcrumbTrail from '@/components/BreadcrumbTrail';
import SearchResults from '@/components/SearchResults';
import DetailCard from '@/components/DetailCard';
import SuggestionsBar from '@/components/SuggestionsBar';
import ChatPanel from '@/components/ChatPanel';
import ExportButtons from '@/components/ExportButtons';
import { ConceptMap, ConceptMapProvider } from '@/components/concept-map';

export default function StudioPage() {
  const { results, isLoading, error, search, loadTopic, clearAll } = useExplore();
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topic');

  useEffect(() => {
    if (topicId) {
      loadTopic(topicId);
    } else {
      clearAll();
    }
  }, [topicId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="explore">
      {!results && !isLoading && (
        <section className="explore__hero">
          <h1 className="explore__title">Studio</h1>
          <p className="explore__subtitle">
            Il tuo spazio di ricerca. Fai una domanda, approfondisci i concetti, costruisci
            la tua documentazione personale — tutto in un unico posto.
          </p>
          <SearchInput />
        </section>
      )}

      {isLoading && (
        <div className="explore__loading">
          <div className="explore__loading-spinner" />
          <p>Generando risposta...</p>
        </div>
      )}

      <BreadcrumbTrail />

      {error && (
        <div className="explore__error">
          <p>{error}</p>
        </div>
      )}

      {results && !isLoading && (
        <>
          <ExportButtons />
          <SearchResults />
          <ConceptMapProvider>
            <ConceptMap />
          </ConceptMapProvider>
          <SuggestionsBar />
          <ChatPanel />
        </>
      )}

      {!results && !isLoading && !error && (
        <div className="explore__empty">
          <p>Inizia con una domanda su qualsiasi argomento tecnico.</p>
          <div className="explore__examples">
            <span>Esempi:</span>
            <button onClick={() => search("Cos'è un sistema distribuito?")}>Cos&apos;è un sistema distribuito?</button>
            <button onClick={() => search('Come funziona un database SQL?')}>Come funziona un database SQL?</button>
            <button onClick={() => search('Spiegami il modello OSI')}>Spiegami il modello OSI</button>
          </div>
        </div>
      )}

      <DetailCard />
    </div>
  );
}
