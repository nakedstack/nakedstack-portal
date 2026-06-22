import { NextRequest, NextResponse } from 'next/server';
import { getPageTree, createPage } from '@/lib/db';

export async function GET() {
  try {
    const tree = await getPageTree();
    return NextResponse.json(tree);
  } catch (err) {
    console.error('[GET /api/pages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { title?: string; parent_id?: string | null; icon?: string | null };
    const page = await createPage(body);
    return NextResponse.json(page, { status: 201 });
  } catch (err) {
    console.error('[POST /api/pages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
