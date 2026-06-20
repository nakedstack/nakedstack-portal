import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const { topicId, text }: { topicId: string; text: string } = await request.json();
    if (!topicId || !text) {
      return NextResponse.json({ error: 'topicId and text required' }, { status: 400 });
    }

    const topic = await db.getTopic(topicId);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    await db.updateTopicResults(topicId, { ...topic.results, text });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
