import { NextRequest, NextResponse } from 'next/server';
import { reorderBlocks } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const { page_id, ordered_ids } = await req.json() as { page_id: string; ordered_ids: string[] };

    if (!page_id || !Array.isArray(ordered_ids)) {
      return NextResponse.json({ error: 'page_id and ordered_ids are required' }, { status: 400 });
    }

    await reorderBlocks(page_id, ordered_ids);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[PUT /api/blocks/reorder]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
