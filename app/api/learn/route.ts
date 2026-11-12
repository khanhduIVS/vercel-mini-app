import { NextResponse } from 'next/server';
import { sqlQuery, ensureTables, VOCAB_COLUMNS, VOCAB_TOPIC_JOIN } from '@/lib/db';
import type { Vocab } from '@/lib/types';

/** GET /api/learn?user=name&count=5&topicId=xxx — random word list for a learning session. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user') || '';
    const count = Math.max(1, parseInt(searchParams.get('count') || '5', 10));
    const topicId = searchParams.get('topicId') || '';

    await ensureTables();

    // Build query with optional topic filter, random order (alias v = vocab)
    let queryStr = `SELECT ${VOCAB_COLUMNS} FROM vocab v ${VOCAB_TOPIC_JOIN}`;
    const params: (string | number)[] = [];
    let idx = 1;

    if (topicId && topicId !== 'all') {
      queryStr += ` WHERE v.topic_id = $${idx}`;
      params.push(topicId);
      idx++;
    }

    queryStr += ` ORDER BY RANDOM() LIMIT $${idx}`;
    params.push(count);

    const rows = await sqlQuery<Vocab>(queryStr, params as (string | number)[]);

    // Total count for context
    let countStr = 'SELECT COUNT(*) AS cnt FROM vocab v';
    const countParams: string[] = [];
    if (topicId && topicId !== 'all') {
      countStr += ' WHERE v.topic_id = $1';
      countParams.push(topicId);
    }
    const countResult = await sqlQuery(countStr, countParams as (string | number)[]);
    const total = Number(countResult[0].cnt);

    return NextResponse.json({ words: rows, total });
  } catch {
    return NextResponse.json({ error: 'Không thể tải từ vựng' }, { status: 500 });
  }
}
