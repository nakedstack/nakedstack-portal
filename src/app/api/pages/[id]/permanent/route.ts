import { NextRequest, NextResponse } from 'next/server';
import { permanentDeletePage } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await permanentDeletePage(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[DELETE /api/pages/[id]/permanent]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
