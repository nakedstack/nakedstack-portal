// ============================================================
// Chat — Barrel pubblico del modulo chat condiviso
// ============================================================

export { default as Chat } from './Chat';
export { default as ChatDock } from './ChatDock';
export { useTopicChatAdapter } from './useTopicChatAdapter';
export { useNodeChatAdapter, type UseNodeChatAdapterOptions, type NodeChatParent } from './useNodeChatAdapter';
export { useChatEnrichment } from './useChatEnrichment';
export type { ChatAdapter, ChatEntry } from './types';
