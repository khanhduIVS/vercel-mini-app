import { NextResponse } from 'next/server';
import { sql, ensureTables } from '@/lib/db';

/** GET /api/topics — all distinct topics from vocab. */
export async function GET() {
  try {
    await ensureTables();
    const rows = await sql`
      SELECT DISTINCT topic FROM vocab
      WHERE topic IS NOT NULL AND topic != ''
      ORDER BY topic
    `;
    return NextResponse.json(rows.map((r: any) => r.topic));
  } catch {
    return NextResponse.json({ error: 'Không thể tải chủ đề' }, { status: 500 });
  }
}
