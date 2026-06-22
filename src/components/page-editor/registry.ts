import type { BlockComponentProps, BlockType } from '@/lib/types/pages';
import type { FC } from 'react';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { ListItemBlock } from './blocks/ListItemBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { ToggleBlock } from './blocks/ToggleBlock';
import { SubpageBlock } from './blocks/SubpageBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { ImageBlock } from './blocks/ImageBlock';

// O — Open/Closed: add new block types here without modifying the editor
export const BLOCK_REGISTRY: Record<BlockType, FC<BlockComponentProps>> = {
  paragraph:           ParagraphBlock,
  heading_1:           HeadingBlock,
  heading_2:           HeadingBlock,
  heading_3:           HeadingBlock,
  bulleted_list_item:  ListItemBlock,
  numbered_list_item:  ListItemBlock,
  toggle:              ToggleBlock,
  code:                CodeBlock,
  divider:             DividerBlock,
  quote:               QuoteBlock,
  subpage:             SubpageBlock,
  callout:             CalloutBlock,
  image:               ImageBlock,
};
