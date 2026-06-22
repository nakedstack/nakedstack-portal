import type { BlockComponentProps } from '@/lib/types/pages';
import Image from 'next/image';

export function ImageBlock({ block }: BlockComponentProps) {
  const url = block.content.url;
  const caption = block.content.caption;

  if (!url) {
    return (
      <div className="block-image block-image--empty" data-block-id={block.id}>
        Add an image URL
      </div>
    );
  }

  return (
    <figure className="block-image" data-block-id={block.id}>
      {/* Use a regular img for user-provided URLs (external domains not configured in next.config) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={caption ?? ''} className="block-image__img" />
      {caption && <figcaption className="block-image__caption">{caption}</figcaption>}
    </figure>
  );
}
