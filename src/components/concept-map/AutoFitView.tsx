// ============================================================
// AutoFitView — Componente invisibile che chiama fitView
// quando trigger/canvas cambiano. Da usare come child di <ReactFlow>
// ============================================================

'use client';

import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

interface AutoFitViewProps {
  /** Quando cambia, triggera un fitView */
  trigger?: unknown;
  /** Ritardo in ms (default 150) */
  delay?: number;
}

/**
 * Render null, ma internamente chiama fitView() ogni volta
 * che il trigger cambia o la finestra viene ridimensionata.
 */
export default function AutoFitView({ trigger, delay = 150 }: AutoFitViewProps) {
  const { fitView } = useReactFlow();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fitView({ padding: 0.3, duration: 300 });
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [trigger, fitView, delay]);

  useEffect(() => {
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
  }, [fitView]);

  return null;
}
