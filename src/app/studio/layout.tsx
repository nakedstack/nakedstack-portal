import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreProvider } from "@/lib/explore-context";

export const metadata: Metadata = {
  title: "Studio — nakedstack",
  description: "Il tuo spazio di ricerca e approfondimento. Fai domande, esplora concetti, costruisci la tua conoscenza con l'AI.",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExploreProvider>
      <Suspense fallback={<div className="explore__loading"><div className="explore__loading-spinner" /><p>Caricamento...</p></div>}>
        {children}
      </Suspense>
    </ExploreProvider>
  );
}
