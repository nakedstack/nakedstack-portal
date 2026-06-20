// ============================================================
// NodeSidebar — Pannello laterale destro per dettagli nodo
// SRP: solo rendering UI. Lo stato viene dal context.
// OCP: sezioni estensibili via prop `sections`.
// ============================================================

'use client';

import { useCallback, type ReactNode } from 'react';
import { useNodeSidebar, type NodeDetailSection } from './NodeSidebarContext';
import type { ConceptNodeData, RawGraphNode } from './types';

// ============================================================
// Sezioni predefinite (possono essere estese dall'esterno)
// ============================================================

const DEFAULT_SECTIONS: NodeDetailSection[] = [
  {
    id: 'overview',
    title: 'Panoramica',
    render: (nodeData: ConceptNodeData, rawNode: RawGraphNode | null) => (
      <div className="ns-section-body">
        <div className="ns-field">
          <span className="ns-field-label">Tipo</span>
          <span className="ns-field-value ns-field-value--group">
            <span
              className="ns-group-dot"
              style={{ background: nodeData.color }}
            />
            {rawNode?.group ?? nodeData.group}
          </span>
        </div>
        <div className="ns-field">
          <span className="ns-field-label">ID Nodo</span>
          <span className="ns-field-value ns-field-value--mono">
            {rawNode?.id ?? '-'}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'description',
    title: 'Descrizione',
    render: (nodeData: ConceptNodeData) => (
      <div className="ns-section-body">
        <p className="ns-description">
          {nodeData.description || 'Nessuna descrizione disponibile.'}
        </p>
      </div>
    ),
  },
];

// ============================================================
// Props
// ============================================================

export interface NodeSidebarProps {
  /** Sezioni aggiuntive o sovrascritte (OCP: estensibilità senza modifiche) */
  sections?: NodeDetailSection[];
  /** Renderizzato sopra le sezioni (es. azioni custom) */
  headerActions?: ReactNode;
  /** Renderizzato sotto le sezioni (es. footer con link) */
  footer?: ReactNode;
}

// ============================================================
// Component
// ============================================================

export default function NodeSidebar({
  sections: extraSections = [],
  headerActions,
  footer,
}: NodeSidebarProps) {
  const { selectedNode, rawNode, isOpen, closeSidebar } = useNodeSidebar();

  const handleOverlayClick = useCallback(() => {
    closeSidebar();
  }, [closeSidebar]);

  const handlePanelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const nodeData = selectedNode?.data as ConceptNodeData | undefined;

  // Merge sezioni: default + extra (le extra con stesso id sovrascrivono)
  const mergedSections = [...DEFAULT_SECTIONS];
  for (const extra of extraSections) {
    const idx = mergedSections.findIndex(s => s.id === extra.id);
    if (idx >= 0) {
      mergedSections[idx] = extra;
    } else {
      mergedSections.push(extra);
    }
  }

  if (!isOpen || !nodeData) return null;

  return (
    <>
      {/* Overlay semi-trasparente (desktop: nessuno; mobile: visibile) */}
      <div
        className="node-sidebar-overlay"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Pannello */}
      <aside
        className={`node-sidebar${isOpen ? ' node-sidebar--open' : ''}`}
        onClick={handlePanelClick}
        role="complementary"
        aria-label={`Dettagli nodo: ${nodeData.label}`}
      >
        {/* Header */}
        <div className="ns-header">
          <div className="ns-header-top">
            <div
              className="ns-header-accent"
              style={{ background: nodeData.color }}
            />
            <h2 className="ns-title">{nodeData.label}</h2>
            <button
              className="ns-close-btn"
              onClick={closeSidebar}
              title="Chiudi dettagli"
              aria-label="Chiudi pannello dettagli"
            >
              ✕
            </button>
          </div>
          {headerActions && (
            <div className="ns-header-actions">{headerActions}</div>
          )}
        </div>

        {/* Corpo */}
        <div className="ns-body">
          {mergedSections.map(section => (
            <div key={section.id} className="ns-section">
              <h3 className="ns-section-title">{section.title}</h3>
              {section.render(nodeData, rawNode)}
            </div>
          ))}
        </div>

        {/* Footer opzionale */}
        {footer && <div className="ns-footer">{footer}</div>}
      </aside>
    </>
  );
}
