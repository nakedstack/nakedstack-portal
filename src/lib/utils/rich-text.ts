import type { RichTextSpan } from '@/lib/types/pages';

export function plainText(spans?: RichTextSpan[]): string {
  return spans?.map(s => s.text).join('') ?? '';
}

export function toRichText(text: string): RichTextSpan[] {
  return [{ text, annotations: {} }];
}
