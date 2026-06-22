import { NextRequest, NextResponse } from 'next/server';
import { getPageAncestors } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const ancestors = await getPageAncestors(id);
    return NextResponse.json(ancestors);
  } catch (err) {
    console.error('[GET /api/pages/[id]/ancestors]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
