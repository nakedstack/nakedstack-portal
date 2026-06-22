import { NextRequest, NextResponse } from 'next/server';
import { getPage, getBlocks, updatePage, deletePage } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const [page, blocks] = await Promise.all([getPage(id), getBlocks(id)]);
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ page, blocks });
  } catch (err) {
    console.error('[GET /api/pages/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json() as Partial<{ title: string; parent_id: string | null; icon: string | null; cover: string | null; is_favorite: boolean }>;
    const page = await updatePage(id, body);
    return NextResponse.json(page);
  } catch (err) {
    console.error('[PUT /api/pages/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deletePage(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[DELETE /api/pages/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
