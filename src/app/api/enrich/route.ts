import { NextResponse } from 'next/server';

// Enrich is now handled per-page at /api/pages/[id]/enrich
export async function POST() {
  return NextResponse.json({ error: 'Use /api/pages/{pageId}/enrich' }, { status: 410 });
}
