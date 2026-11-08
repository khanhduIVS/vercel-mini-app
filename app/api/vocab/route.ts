import { NextResponse } from 'next/server';
import { sql, ensureTable } from '@/lib/db';

/** GET /api/vocab — list all vocabulary (newest first). */
export async function GET() {
  try {
    await ensureTable();
    const rows = await sql`SELECT * FROM vocab ORDER BY id DESC`;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Không thể tải danh sách từ vựng.' }, { status: 500 });
  }
}

/** POST /api/vocab — create a new vocabulary entry. */
export async function POST(request: Request) {
  try {
    await ensureTable();
    const { word, meaning, example } = await request.json();

    if (!word?.trim() || !meaning?.trim()) {
      return NextResponse.json({ error: 'Thiếu từ hoặc nghĩa.' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO vocab (word, meaning, example)
      VALUES (${word.trim()}, ${meaning.trim()}, ${example?.trim() || null})
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Không thể thêm từ vựng.' }, { status: 500 });
  }
}
