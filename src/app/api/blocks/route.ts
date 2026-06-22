import { NextRequest, NextResponse } from 'next/server';
import { createBlock } from '@/lib/db';
import type { BlockType, BlockContent } from '@/lib/types/pages';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      page_id: string;
      parent_block_id?: string | null;
      type: BlockType;
      content?: BlockContent;
      position?: number;
    };

    if (!body.page_id || !body.type) {
      return NextResponse.json({ error: 'page_id and type are required' }, { status: 400 });
    }

    const block = await createBlock(body);
    return NextResponse.json(block, { status: 201 });
  } catch (err) {
    console.error('[POST /api/blocks]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
