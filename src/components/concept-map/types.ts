// ============================================================
// Concept Map — Tipi e interfacce (Interface Segregation Principle)
// ============================================================

/** Dato grezzo di un nodo ricevuto dall'API */
export interface RawGraphNode {
  id: string;
  label: string;
  group: string;
}

/** Dato grezzo di un arco ricevuto dall'API */
export interface RawGraphEdge {
  source: string;
  target: string;
  relation: string;
}

/** Payload restituito dall'API /api/concept-map */
export interface ConceptMapPayload {
  topic: string;
  nodes: RawGraphNode[];
  edges: RawGraphEdge[];
  /**
   * Posizioni salvate dei nodi (nodeId → {x, y}).
   * Se presenti, sovrascrivono il layout automatico.
   * Popolate dopo che l'utente ha spostato i nodi manualmente.
   */
  positions?: Record<string, { x: number; y: number }>;
}

/** Categoria di un nodo (group) */
export type NodeGroup = 'concetto' | 'tecnologia' | 'vantaggio' | 'svantaggio' | 'correlato' | string;

/** Dati iniettati nel custom node di React Flow */
export interface ConceptNodeData {
  label: string;
  group: NodeGroup;
  /** Breve descrizione o sottotitolo del nodo */
  description: string;
  color: string;
  textColor: string;
  borderColor: string;
}

/** Dati iniettati nel custom edge di React Flow */
export interface ConceptEdgeData {
  relation: string;
  edgeColor: string;
  /** Se true, l'edge è evidenziato perché connesso a un nodo hoverato/selezionato */
  highlighted?: boolean;
  /** Colore da usare quando highlighted (ereditato dal nodo trigger) */
  highlightColor?: string;
  /** Stile: 'solid' per nodo selezionato, 'dashed' per hover */
  highlightStyle?: 'solid' | 'dashed';
  /** Se true, anima il tratteggio (solo per hover) */
  animated?: boolean;
}

// ============================================================
// Tema (Open/Closed Principle — nuovi temi estendono senza modificare)
// ============================================================

/** Contratto per un tema di mappa concettuale */
export interface ConceptMapTheme {
  readonly id: string;
  readonly name: string;
  /** Mappa group → colore nodo */
  readonly groupColors: Record<NodeGroup, string>;
  /** Colore di fallback per gruppi sconosciuti */
  readonly defaultColor: string;
  /** Colore testo dentro il nodo */
  readonly nodeTextColor: string;
  /** Colore bordo nodo */
  readonly nodeBorderColor: string;
  /** Colore archi */
  readonly edgeColor: string;
  /** Colore label archi */
  readonly edgeLabelColor: string;
  /** Colore testo sotto il nodo */
  readonly nodeLabelColor: string;
  /** Font family */
  readonly fontFamily: string;
  /** Stili aggiuntivi per il container */
  readonly containerStyles: React.CSSProperties;
}

// ============================================================
// Layout (Open/Closed Principle — nuovi layout estendono senza modificare)
// ============================================================

/** Configurazione del layout */
export interface LayoutOptions {
  /** Larghezza viewport */
  width: number;
  /** Altezza viewport */
  height: number;
  /** Direzione del layout (per layout gerarchici) */
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  /** Spaziatura orizzontale tra nodi */
  nodeSep?: number;
  /** Spaziatura verticale tra rank */
  rankSep?: number;
}

/** Contratto per un algoritmo di layout */
export interface LayoutStrategy {
  readonly id: string;
  readonly name: string;
  /** Calcola le posizioni dei nodi */
  layout(nodes: RawGraphNode[], edges: RawGraphEdge[], options: LayoutOptions): RawGraphNode[];
}

// ============================================================
// Configurazione del provider (Dependency Inversion Principle)
// ============================================================

/** Configurazione iniettata nel ConceptMapProvider */
export interface ConceptMapConfig {
  theme: ConceptMapTheme;
  layout: LayoutStrategy;
  /** Registro di custom node types per React Flow */
  nodeTypes?: Record<string, React.ComponentType<unknown>>;
  /** Registro di custom edge types per React Flow */
  edgeTypes?: Record<string, React.ComponentType<unknown>>;
}
