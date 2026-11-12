import { NextResponse } from 'next/server';
import { sql, ensureTables } from '@/lib/db';
import type { Topic } from '@/lib/types';

/** GET /api/topics — danh sách chủ đề từ bảng topics (chuẩn hóa, không còn lấy distinct từ vocab). */
export async function GET() {
  try {
    await ensureTables();
    const rows = await sql`
      SELECT topic_id AS "topicId", name FROM topics ORDER BY name
    ` as Topic[];
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Không thể tải chủ đề' }, { status: 500 });
  }
}
