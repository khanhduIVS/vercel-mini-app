import { NextResponse } from 'next/server';
import { sqlQuery, ensureTables, VOCAB_COLUMNS } from '@/lib/db';
import type { Vocab } from '@/lib/types';

/** GET /api/learn?user=name&count=5&topic=xxx — random word list for a learning session. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user') || '';
    const count = Math.max(1, parseInt(searchParams.get('count') || '5', 10));
    const topic = searchParams.get('topic') || '';

    await ensureTables();

    // Build query with optional topic filter, random order
    let queryStr = `SELECT ${VOCAB_COLUMNS} FROM vocab`;
    const params: (string | number)[] = [];
    let idx = 1;

    if (topic && topic !== 'all') {
      queryStr += ` WHERE topic = $${idx}`;
      params.push(topic);
      idx++;
    }

    queryStr += ` ORDER BY RANDOM() LIMIT $${idx}`;
    params.push(count);

    const rows = await sqlQuery<Vocab>(queryStr, params as (string | number)[]);

    // Total count for context
    let countStr = 'SELECT COUNT(*) AS cnt FROM vocab';
    const countParams: string[] = [];
    if (topic && topic !== 'all') {
      countStr += ' WHERE topic = $1';
      countParams.push(topic);
    }
    const countResult = await sqlQuery(countStr, countParams as (string | number)[]);
    const total = Number(countResult[0].cnt);

    return NextResponse.json({ words: rows, total });
  } catch {
    return NextResponse.json({ error: 'Không thể tải từ vựng' }, { status: 500 });
  }
}
