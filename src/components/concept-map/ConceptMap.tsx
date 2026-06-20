// ============================================================
// ConceptMap — Orchestrazione (SRP: solo composizione)
// ============================================================

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useExplore } from '@/lib/explore-context';
import { useConceptMapConfig } from './ConceptMapProvider';
import { useConceptMap } from './useConceptMap';
import AutoFitView from './AutoFitView';
import ConceptNode from './ConceptNode';
import ConceptEdge from './ConceptEdge';
import Legend from './Legend';
import ConceptMapHeader from './ConceptMapHeader';
import { NodeSidebarProvider, useNodeSidebar } from './NodeSidebarContext';
import { useNodeSidebarDerived } from './useNodeSidebar';
import { useNodeDescription } from './useNodeDescription';
import NodeSidebar from './NodeSidebar';
import NodeChatInput from './NodeChatInput';
import FormattedText from './FormattedText';
import type { ConceptNodeData, ConceptEdgeData, RawGraphNode, RawGraphEdge } from './types';
import type { NodeDetailSection } from './NodeSidebarContext';
import type { ChatEntry } from '@/lib/storage';
import type { Language, DetailLevel } from '@/lib/ai/prompts';

// ============================================================
// Registro statico node/edge types
// Può essere esteso dall'esterno via ConceptMapProvider
// ============================================================
const DEFAULT_NODE_TYPES = {
  conceptNode: ConceptNode,
};

const DEFAULT_EDGE_TYPES = {
  conceptEdge: ConceptEdge,
};

// ============================================================
// ConceptMap — Wrapper: fornisce NodeSidebarProvider (DIP)
// ============================================================

export default function ConceptMap() {
  return (
    <NodeSidebarProvider>
      <ConceptMapInner />
    </NodeSidebarProvider>
  );
}

// ============================================================
// ConceptMapInner — Logica interna (SRP: orchestrazione mappa)
// ============================================================

function ConceptMapInner() {
  const { results, chatHistory, language, detailLevel, currentTopicId } = useExplore();
  const config = useConceptMapConfig();
  const { openSidebar } = useNodeSidebar();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Nodo selezionato e nodo hoverato (tracciati separatamente per priorità)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const topic = results?.text.slice(0, 100) ?? null;

  const { loading, error, conceptMapId, version, versions, rawData, graphNodes, graphEdges, fetchMap, regenerate, loadVersion, savePositions } = useConceptMap({
    topic,
    topicId: currentTopicId,
    language: 'it',
    config,
  });

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graphEdges);

  // Sincronizza nodi/edge quando cambiano i dati
  const prevDataRef = useRef<string>('');
  const currentKey = JSON.stringify({ nodes: graphNodes.map(n => n.id), edges: graphEdges.map(e => e.id) });
  if (currentKey !== prevDataRef.current) {
    prevDataRef.current = currentKey;
    setNodes(graphNodes);
    setEdges(graphEdges);
  }

  // Highlight logic: selected = solid, hovered = dashed animated, selected ha priorità
  useEffect(() => {
    const hasSelected = selectedNodeId !== null;
    const hasHovered = hoveredNodeId !== null;

    if (!hasSelected && !hasHovered) {
      setEdges(prev =>
        prev.map(e => {
          const d = e.data as ConceptEdgeData | undefined;
          if (d?.highlighted) {
            return {
              ...e,
              data: { ...e.data, highlighted: false, highlightColor: undefined, highlightStyle: undefined, animated: false },
            };
          }
          return e;
        }),
      );
      return;
    }

    setEdges(prev => {
      // Mappa target → edge ids
      const incoming = new Map<string, string[]>();
      for (const e of prev) {
        if (!incoming.has(e.target)) incoming.set(e.target, []);
        incoming.get(e.target)!.push(e.id);
      }

      // Helper: BFS all'indietro
      const traceParents = (startId: string): Set<string> => {
        const edgeIds = new Set<string>();
        const queue = [startId];
        const visited = new Set<string>();
        while (queue.length > 0) {
          const current = queue.shift()!;
          if (visited.has(current)) continue;
          visited.add(current);
          for (const eid of incoming.get(current) ?? []) {
            edgeIds.add(eid);
            const edge = prev.find(e => e.id === eid);
            if (edge && !visited.has(edge.source)) queue.push(edge.source);
          }
        }
        return edgeIds;
      };

      // Edges del nodo selezionato (solid, priorità)
      const selectedEdges = hasSelected ? traceParents(selectedNodeId!) : new Set<string>();
      const selectedColor = hasSelected
        ? ((nodes.find(n => n.id === selectedNodeId)?.data as ConceptNodeData | undefined)?.color ?? '#0069FF')
        : '#0069FF';

      // Edges del nodo hoverato (dashed, escludi quelli già nel selected)
      const hoveredEdges = new Set<string>();
      let hoveredColor = '#0069FF';
      if (hasHovered && hoveredNodeId !== selectedNodeId) {
        hoveredColor = (nodes.find(n => n.id === hoveredNodeId)?.data as ConceptNodeData | undefined)?.color ?? '#0069FF';
        const raw = traceParents(hoveredNodeId!);
        for (const eid of raw) {
          if (!selectedEdges.has(eid)) hoveredEdges.add(eid);
        }
      }

      return prev
        .map(e => {
          const isSelected = selectedEdges.has(e.id);
          const isHovered = hoveredEdges.has(e.id);
          const highlighted = isSelected || isHovered;
          return {
            ...e,
            data: {
              ...e.data,
              highlighted,
              highlightColor: isSelected ? selectedColor : isHovered ? hoveredColor : undefined,
              highlightStyle: isSelected ? 'solid' : isHovered ? 'dashed' : undefined,
              animated: isHovered,
            },
          };
        })
        .sort((a, b) => {
          const aH = (a.data as ConceptEdgeData).highlighted ? 1 : 0;
          const bH = (b.data as ConceptEdgeData).highlighted ? 1 : 0;
          return aH - bH;
        });
    });
  }, [selectedNodeId, hoveredNodeId, nodes]);

  // Auto-fetch al mount (quando il topic è disponibile)
  useEffect(() => {
    if (topic && graphNodes.length === 0 && !loading) {
      fetchMap();
    }
  }, [topic]);

  // Handler per hover: mostra edge tratteggiati
  const handleNodeEnter = useCallback((_event: React.MouseEvent, node: Node) => {
    setHoveredNodeId(node.id);
  }, []);
  const handleNodeLeave = useCallback((_event: React.MouseEvent, node: Node) => {
    setHoveredNodeId(null);
  }, []);

  // Quando cambia la selezione, imposta selectedNodeId (solid edge)
  const handleSelectionChange = useCallback(({ nodes: selNodes }: { nodes: Node[] }) => {
    if (selNodes.length === 1) {
      setSelectedNodeId(selNodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  // Persiste le posizioni dopo il drag dei nodi
  const handleNodeDragStop = useCallback((_event: React.MouseEvent, _node: Node, allNodes: Node[]) => {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const n of allNodes) {
      positions[n.id] = { x: n.position.x, y: n.position.y };
    }
    savePositions(positions);
  }, [savePositions]);

  // Apre la sidebar al click su un nodo
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const rawNode = rawData?.nodes.find(n => n.id === node.id);
    openSidebar(node as Node<ConceptNodeData>, rawNode);
  }, [rawData, openSidebar]);

  // Fullscreen: toggle e gestione tasto Escape
  const enterFullscreen = useCallback(() => setIsFullscreen(true), []);
  const exitFullscreen = useCallback(() => setIsFullscreen(false), []);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitFullscreen();
    };
    document.addEventListener('keydown', onKeyDown);
    // Blocca scroll del body in fullscreen
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen, exitFullscreen]);

  // Merge dei node/edge types: default + eventuali custom dal provider
  const nodeTypes = { ...DEFAULT_NODE_TYPES, ...config.nodeTypes };
  const edgeTypes = { ...DEFAULT_EDGE_TYPES, ...config.edgeTypes };

  const hasGraph = !loading && !error && nodes.length > 0;

  if (!results) return null;

  return (
    <div>
      <div
        className="concept-map-container"
          style={{
            height: isFullscreen ? '100dvh' : 520,
            ...(isFullscreen
              ? {
                  position: 'fixed',
                  inset: 0,
                  zIndex: 1000,
                  borderRadius: 0,
                  margin: 0,
                  border: 'none',
                }
              : {}),
            ...config.theme.containerStyles,
          }}
        >
          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', color: '#5B6B86' }}>
              <div className="explore__loading-spinner" />
              <p style={{ marginTop: '0.75rem' }}>Generando mappa concettuale...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ padding: '2rem', color: '#FF3B30', textAlign: 'center' }}>
              <p>Errore: {error}</p>
              <button className="concept-map-btn" onClick={fetchMap} style={{ marginTop: '0.75rem' }}>Riprova</button>
            </div>
          )}

          {/* React Flow Graph */}
          {hasGraph && (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.3}
              maxZoom={3}
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable
              onNodeMouseEnter={handleNodeEnter}
              onNodeMouseLeave={handleNodeLeave}
              onNodeClick={handleNodeClick}
              onSelectionChange={handleSelectionChange}
              onNodeDragStop={handleNodeDragStop}
              proOptions={{ hideAttribution: true }}
            >
              <AutoFitView trigger={`${isFullscreen}-${nodes.length}`} />
              <Background color="#E2E6ED" gap={20} size={1} />
              <Controls
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E6ED',
                  borderRadius: 8,
                }}
              />
              <MiniMap
                style={{
                  background: '#F7F8FA',
                  border: '1px solid #E2E6ED',
                  borderRadius: 8,
                }}
                nodeColor={(node) => {
                  const d = node.data as ConceptNodeData | undefined;
                  return d?.color ?? config.theme.defaultColor;
                }}
              />
              <Panel position="top-right">
                <button
                  onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                  style={{
                    background: 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid #E2E6ED',
                    borderRadius: 8,
                    padding: '4px 9px',
                    fontSize: 13,
                    color: '#5B6B86',
                    cursor: 'pointer',
                    fontFamily: "'Space Grotesk','Segoe UI',sans-serif",
                    lineHeight: 1,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                  title={isFullscreen ? 'Esci da schermo intero (Esc)' : 'Schermo intero'}
                >
                  {isFullscreen ? '⤡' : '⤢'}
                </button>
              </Panel>
            </ReactFlow>
          )}

          {/* Stato vuoto dopo fetch senza errori né nodi */}
          {!loading && !error && nodes.length === 0 && graphNodes.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8895AD' }}>
              <p>Nessun nodo disponibile. Riprova.</p>
            </div>
          )}

          {/* Footer: versione + rigenera */}
          <ConceptMapHeader
            versions={versions}
            conceptMapId={conceptMapId}
            loading={loading}
            canRegenerate={!!currentTopicId}
            onVersionChange={loadVersion}
            onRegenerate={regenerate}
          />
        </div>

      {/* Sidebar dettagli nodo — fuori dal container, overlay sull'intera pagina */}
      <NodeSidebarConnector
        rawNodes={rawData?.nodes ?? []}
        rawEdges={rawData?.edges ?? []}
        chatHistory={chatHistory}
        language={language}
        detailLevel={detailLevel}
        topic={topic ?? results?.text.slice(0, 80) ?? ''}
        topicId={currentTopicId}
        conceptMapId={conceptMapId}
      />

      {/* Legenda (visibile solo quando la mappa ha dati) */}
      {!loading && !error && nodes.length > 0 && (
        <Legend theme={config.theme} />
      )}
    </div>
  );
}

// ============================================================
// NodeSidebarConnector — Bridge tra rawData, chat e NodeSidebar
// Inietta la sezione descrizione AI generata con contesto chat + parent.
// ============================================================

function NodeSidebarConnector({
  rawNodes,
  rawEdges,
  chatHistory,
  language,
  detailLevel,
  topic,
  topicId,
  conceptMapId,
}: {
  rawNodes: RawGraphNode[];
  rawEdges: RawGraphEdge[];
  chatHistory: ChatEntry[];
  language: Language;
  detailLevel: DetailLevel;
  topic: string;
  topicId: string | null;
  conceptMapId: number | null;
}) {
  const derived = useNodeSidebarDerived(rawNodes, rawEdges);
  const nodeData = derived.selectedNode?.data as ConceptNodeData | undefined;
  const nodeId = derived.rawNode?.id ?? '';
  const nodeLabel = nodeData?.label ?? '';

  // Estrai i nodi parent (incoming edges) per il contesto AI
  const parentNodes = useMemo(
    () =>
      derived.connectedEdges
        .filter(e => e.direction === 'incoming')
        .map(e => ({ label: e.otherNodeLabel, relation: e.relation })),
    [derived.connectedEdges],
  );

  // Contesto chat: ultimi messaggi per dare continuità
  const chatContext = useMemo(
    () =>
      chatHistory
        .slice(-6)
        .map(m => `${m.role === 'user' ? 'Utente' : 'Assistente'}: ${m.content}`)
        .join('\n'),
    [chatHistory],
  );

  const {
    description,
    isLoading: descLoading,
    error: descError,
    refetch,
    regenerate: regenerateDesc,
  } = useNodeDescription({
    conceptMapId,
    nodeId,
    nodeLabel: nodeLabel || null,
    nodeGroup: nodeData?.group ?? '',
    topic: topic || '',
    language,
    detailLevel,
    parentNodes,
    chatContext,
  });

  // Chat locale alla sidebar (indipendente dal ChatPanel principale)
  const [nodeChatHistory, setNodeChatHistory] = useState<ChatEntry[]>([]);
  const [nodeChatLoading, setNodeChatLoading] = useState(false);

  // Reset chat quando cambia nodo
  useEffect(() => {
    setNodeChatHistory([]);
  }, [nodeId]);

  const sendNodeChatMessage = useCallback(async (message: string) => {
    setNodeChatLoading(true);
    const entry: ChatEntry = { role: 'user', content: message };
    setNodeChatHistory(prev => [...prev, entry]);

    const nodeContext = [
      `Stai rispondendo a una domanda di approfondimento sul concetto "${nodeLabel}" (categoria: ${nodeData?.group ?? ''}).`,
      description ? `Descrizione del concetto: ${description}` : '',
      parentNodes.length > 0
        ? `Collegato a: ${parentNodes.map(p => `"${p.label}" (${p.relation})`).join(', ')}.`
        : '',
      'Rispondi in modo conciso e pertinente al concetto specifico, non alla piattaforma in generale.',
    ].filter(Boolean).join('\n');

    const contextEntry: ChatEntry = { role: 'assistant', content: nodeContext };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: message,
          history: [...chatHistory, contextEntry, ...nodeChatHistory],
          language,
          detailLevel,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNodeChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setNodeChatHistory(prev => [...prev, { role: 'assistant', content: 'Errore: ' + (err instanceof Error ? err.message : 'Sconosciuto') }]);
    } finally {
      setNodeChatLoading(false);
    }
  }, [chatHistory, nodeChatHistory, language, detailLevel, nodeLabel, nodeData?.group, description, parentNodes]);

  // Click su [[termine]] → invia come messaggio nella chat del nodo
  const handleKeywordClick = useCallback((term: string) => {
    sendNodeChatMessage(`Approfondisci "${term}"`);
  }, [sendNodeChatMessage]);

  // Sezione AI che sovrascrive la "description" statica di default
  const aiDescriptionSection: NodeDetailSection = {
    id: 'description',
    title: 'Descrizione',
    render: () => (
      <div className="ns-section-body">
        {descLoading && (
          <div className="ns-description-loading">
            <span>Generando descrizione...</span>
          </div>
        )}
        {descError && (
          <div className="ns-description-error">
            <p className="ns-error-text">{descError}</p>
            <button className="ns-retry-btn" onClick={refetch}>
              Riprova
            </button>
          </div>
        )}
        {!descLoading && !descError && description && (
          <>
            <p className="ns-description">
              <FormattedText text={description} onKeywordClick={handleKeywordClick} />
            </p>
            <button
              className="ns-retry-btn ns-regenerate-btn"
              onClick={regenerateDesc}
              title="Genera una nuova descrizione per questo nodo"
            >
              Rigenera descrizione
            </button>
          </>
        )}
        {!descLoading && !descError && !description && (
          <p className="ns-description ns-description--empty">
            Nessuna descrizione disponibile.
          </p>
        )}
      </div>
    ),
  };

  // Sezione chat history locale
  const chatSection: NodeDetailSection = {
    id: 'node-chat',
    title: 'Approfondimenti',
    render: () => (
      <div className="ns-section-body">
        {nodeChatHistory.length === 0 && (
          <p className="ns-description ns-description--empty">
            Fai una domanda su "{nodeLabel}" per approfondire.
          </p>
        )}
        {nodeChatHistory.map((entry, i) => (
          <div key={i} className={`ns-chat-msg ns-chat-msg--${entry.role}`}>
            <span className="ns-chat-role">{entry.role === 'user' ? 'Tu' : 'AI'}</span>
            <p className="ns-chat-text">
              <FormattedText text={entry.content} onKeywordClick={handleKeywordClick} />
            </p>
          </div>
        ))}
        {nodeChatLoading && (
          <div className="ns-description-loading">
            <span>Rispondendo...</span>
          </div>
        )}
      </div>
    ),
  };

  return (
    <NodeSidebar
      sections={[aiDescriptionSection, chatSection]}
      footer={
        <NodeChatInput
          nodeLabel={nodeLabel}
          onSend={sendNodeChatMessage}
          loading={nodeChatLoading}
        />
      }
    />
  );
}
