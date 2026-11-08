import { NextResponse } from 'next/server';
import { sql, ensureTables } from '@/lib/db';

/** GET /api/users — list all user names (sorted). */
export async function GET() {
  try {
    await ensureTables();
    const rows = await sql`
      SELECT DISTINCT user_name FROM user_progress
      WHERE user_name IS NOT NULL AND user_name != ''
      ORDER BY user_name
    `;
    return NextResponse.json(rows.map((r: any) => r.user_name));
  } catch {
    return NextResponse.json({ error: 'Không thể tải danh sách người dùng' }, { status: 500 });
  }
}

/** POST /api/users — get or create a user. */
export async function POST(request: Request) {
  try {
    await ensureTables();
    const { name } = await request.json();
    const userName = String(name ?? '').trim();

    if (!userName) {
      return NextResponse.json({ error: 'Vui lòng nhập tên người dùng' }, { status: 400 });
    }
    if (userName.length < 2 || userName.length > 20) {
      return NextResponse.json({ error: 'Tên phải từ 2 đến 20 ký tự' }, { status: 400 });
    }

    const existing = await sql`SELECT user_name FROM user_progress WHERE user_name = ${userName} LIMIT 1`;
    const isNew = existing.length === 0;

    if (isNew) {
      await sql`
        INSERT INTO user_progress (user_name, word_id, box_level, wrong_count)
        VALUES (${userName}, NULL, 1, 0)
      `;
    }

    return NextResponse.json({
      userName,
      isNew,
      message: isNew ? 'Người dùng mới đã được tạo' : 'Chào mừng trở lại!',
    });
  } catch {
    return NextResponse.json({ error: 'Không thể tạo người dùng' }, { status: 500 });
  }
}
