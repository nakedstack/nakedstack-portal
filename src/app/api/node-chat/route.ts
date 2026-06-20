// ============================================================
// /api/node-chat — Persistenza cronologia chat per singolo nodo
// GET  ?conceptMapId=X&nodeId=Y  → { history: ChatEntry[] }
// POST { conceptMapId, nodeId, history } → { success: true }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import type { ChatEntry } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptMapId = Number(searchParams.get('conceptMapId'));
    const nodeId = searchParams.get('nodeId')?.trim();

    if (!conceptMapId || !nodeId) {
      return NextResponse.json({ error: 'conceptMapId and nodeId are required' }, { status: 400 });
    }

    const history = await db.getNodeChat(conceptMapId, nodeId);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Node chat GET error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const conceptMapId: number = Number(body.conceptMapId);
    const nodeId: string = body.nodeId?.trim();
    const history: ChatEntry[] = Array.isArray(body.history) ? body.history : [];

    if (!conceptMapId || !nodeId) {
      return NextResponse.json({ error: 'conceptMapId and nodeId are required' }, { status: 400 });
    }

    await db.saveNodeChat(conceptMapId, nodeId, history);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Node chat POST error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
