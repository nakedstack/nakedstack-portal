// ============================================================
// useAutoFitView — Hook che adatta automaticamente la vista
// al contenitore (SRP: solo fit-view logic)
// ============================================================

'use client';

import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

interface UseAutoFitViewOptions {
  /** Quando cambia, triggera un fitView (es. fullscreen toggle) */
  trigger?: unknown;
  /** Ritardo in ms prima di chiamare fitView (per dare tempo al DOM di aggiornarsi) */
  delay?: number;
  /** Se true, il fit è abilitato */
  enabled?: boolean;
}

/**
 * Chiama fitView() automaticamente quando:
 * - Il trigger cambia (es. isFullscreen, dati caricati)
 * - La finestra viene ridimensionata (in fullscreen)
 */
export function useAutoFitView({ trigger, delay = 150, enabled = true }: UseAutoFitViewOptions = {}) {
  const { fitView } = useReactFlow();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!enabled) return;

    // Debounce: aspetta che il DOM si aggiorni
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fitView({ padding: 0.3, duration: 300 });
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [trigger, enabled, fitView, delay]);

  // Ascolta resize della finestra per riadattare
  useEffect(() => {
    if (!enabled) return;

    const handleResize = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        fitView({ padding: 0.3, duration: 200 });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutRef.current);
    };
  }, [enabled, fitView]);
}
