// ============================================================
// NodeSidebarContext — Dependency Inversion Principle
// Fornisce lo stato della sidebar del nodo via React Context.
// Qualsiasi implementazione di NodeSidebarState può essere iniettata.
// ============================================================

'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Node } from '@xyflow/react';
import type { ConceptNodeData, RawGraphNode } from './types';

// ============================================================
// Interface Segregation — interfaccia minima per lo stato sidebar
// ============================================================

export interface NodeSidebarState {
  /** Il nodo React Flow attualmente selezionato, o null */
  selectedNode: Node | null;
  /** Dati grezzi del nodo (dall'API), per dettagli estesi */
  rawNode: RawGraphNode | null;
  /** Se la sidebar è aperta */
  isOpen: boolean;
  /** Apre la sidebar con i dati del nodo */
  openSidebar: (node: Node, rawNode?: RawGraphNode) => void;
  /** Chiude la sidebar */
  closeSidebar: () => void;
}

// ============================================================
// Contratto per sezioni dettaglio estensibili (Open/Closed)
// ============================================================

export interface NodeDetailSection {
  /** Identificativo univoco della sezione */
  id: string;
  /** Titolo mostrato nell'header della sezione */
  title: string;
  /** Renderizza il contenuto della sezione dati i dati del nodo */
  render: (nodeData: ConceptNodeData, rawNode: RawGraphNode | null) => ReactNode;
}

// ============================================================
// Context
// ============================================================

const NodeSidebarContext = createContext<NodeSidebarState | null>(null);

// ============================================================
// Provider
// ============================================================

export function NodeSidebarProvider({ children }: { children: ReactNode }) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [rawNode, setRawNode] = useState<RawGraphNode | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openSidebar = useCallback((node: Node, raw?: RawGraphNode) => {
    setSelectedNode(node);
    setRawNode(raw ?? null);
    setIsOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    // Piccolo ritardo per lasciar finire l'animazione prima di pulire i dati
    setTimeout(() => {
      setSelectedNode(null);
      setRawNode(null);
    }, 300);
  }, []);

  return (
    <NodeSidebarContext.Provider
      value={{ selectedNode, rawNode, isOpen, openSidebar, closeSidebar }}
    >
      {children}
    </NodeSidebarContext.Provider>
  );
}

// ============================================================
// Hook consumer (con fallback sicuro se usato fuori dal provider)
// ============================================================

export function useNodeSidebar(): NodeSidebarState {
  const ctx = useContext(NodeSidebarContext);
  if (!ctx) {
    // Fallback sicuro: sidebar sempre chiusa, operazioni no-op
    return {
      selectedNode: null,
      rawNode: null,
      isOpen: false,
      openSidebar: () => {},
      closeSidebar: () => {},
    };
  }
  return ctx;
}
