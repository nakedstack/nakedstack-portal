import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

// GET /api/topics — list all topics
// GET /api/topics?id=xxx — get single topic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const topic = await db.getTopic(id);
      if (!topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
      }
      return NextResponse.json(topic);
    }

    const topics = await db.getTopics();
    return NextResponse.json(topics);
  } catch (error) {
    console.error('GET /api/topics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// POST /api/topics — create or update a topic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = await db.saveTopic(body);
    return NextResponse.json(topic);
  } catch (error) {
    console.error('POST /api/topics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// DELETE /api/topics?id=xxx — delete a topic
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    await db.deleteTopic(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/topics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
