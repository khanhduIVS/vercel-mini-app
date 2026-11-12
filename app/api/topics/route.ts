import { NextResponse } from 'next/server';
import { sql, ensureTables } from '@/lib/db';
import type { Topic } from '@/lib/types';

// Next.js App Router mặc định có thể cache fetch ngầm bên trong driver Neon (@neondatabase/serverless
// dùng HTTP fetch) cho route handler GET. Nếu route này được gọi lần đầu lúc bảng topics còn trống
// (trước khi import CSV), kết quả rỗng có thể bị cache dính cứng và không bao giờ cập nhật lại,
// dù dữ liệu thật trong DB đã thay đổi. Đánh dấu route luôn render động để tránh cache sai dữ liệu.
export const dynamic = 'force-dynamic';

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
