import type { BlockComponentProps } from '@/lib/types/pages';

export function DividerBlock({ block }: BlockComponentProps) {
  return <hr className="block-divider" data-block-id={block.id} />;
}
