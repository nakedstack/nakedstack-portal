// ---- Block Types ----

export type BlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'toggle'
  | 'code'
  | 'divider'
  | 'quote'
  | 'subpage'
  | 'callout'
  | 'image';

export interface RichTextAnnotations {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  link: string | null;
}

export interface RichTextSpan {
  text: string;
  annotations: Partial<RichTextAnnotations>;
}

export interface BlockContent {
  rich_text?: RichTextSpan[];
  /** For code blocks */
  language?: string;
  /** For image / subpage blocks */
  url?: string;
  /** For image / callout */
  caption?: string;
  /** For callout icon */
  icon?: string;
  /** For subpage reference */
  page_id?: string;
  /** For toggle: whether expanded */
  expanded?: boolean;
}

export interface Block {
  id: string;
  page_id: string;
  parent_block_id: string | null;
  type: BlockType;
  content: BlockContent;
  position: number;
  createdAt: number;
  updatedAt: number;
}

// ---- Page Types ----

export interface Page {
  id: string;
  title: string;
  parent_id: string | null;
  icon: string | null;
  cover: string | null;
  is_favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

// ---- Block Component Interface (L of SOLID) ----

export interface BlockComponentProps {
  block: Block;
  onUpdate: (id: string, content: BlockContent) => void;
  onDelete: (id: string) => void;
  onInsertAfter: (afterId: string, type: BlockType) => void;
  onConvertType: (id: string, type: BlockType) => void;
  readOnly?: boolean;
}

// ---- Chat ----

export interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
}
