import { NextResponse } from 'next/server';
import { getDeletedPages } from '@/lib/db';

export async function GET() {
  try {
    const pages = await getDeletedPages();
    return NextResponse.json(pages);
  } catch (err) {
    console.error('[GET /api/pages/trash]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
