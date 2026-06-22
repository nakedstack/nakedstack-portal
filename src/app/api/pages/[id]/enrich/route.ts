import { NextResponse } from 'next/server';

// This endpoint has been superseded by POST /api/pages/[id]/ai
export async function POST() {
  return NextResponse.json(
    { error: 'Gone. Use POST /api/pages/[id]/ai with action=append instead.' },
    { status: 410 },
  );
}
