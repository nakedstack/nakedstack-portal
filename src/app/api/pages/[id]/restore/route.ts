import { NextRequest, NextResponse } from 'next/server';
import { restorePage } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const page = await restorePage(id);
    return NextResponse.json(page);
  } catch (err) {
    console.error('[POST /api/pages/[id]/restore]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
