import { NextRequest, NextResponse } from 'next/server';
import { updateBlock, deleteBlock } from '@/lib/db';
import type { BlockType, BlockContent } from '@/lib/types/pages';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json() as { content?: BlockContent; type?: BlockType };
    const block = await updateBlock(id, body);
    return NextResponse.json(block);
  } catch (err) {
    console.error('[PUT /api/blocks/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteBlock(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[DELETE /api/blocks/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
