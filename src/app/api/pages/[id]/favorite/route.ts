import { NextRequest, NextResponse } from 'next/server';
import { toggleFavorite } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const page = await toggleFavorite(id);
    return NextResponse.json(page);
  } catch (err) {
    console.error('[POST /api/pages/[id]/favorite]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
