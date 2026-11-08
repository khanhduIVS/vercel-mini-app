import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/** PUT /api/vocab/:id — update an existing vocabulary entry. */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { word, meaning, example } = await request.json();

    if (!word?.trim() || !meaning?.trim()) {
      return NextResponse.json({ error: 'Thiếu từ hoặc nghĩa.' }, { status: 400 });
    }

    const rows = await sql`
      UPDATE vocab
      SET word = ${word.trim()}, meaning = ${meaning.trim()}, example = ${example?.trim() || null}
      WHERE id = ${Number(params.id)}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy từ vựng.' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: 'Không thể cập nhật từ vựng.' }, { status: 500 });
  }
}

/** DELETE /api/vocab/:id — remove a vocabulary entry. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const rows = await sql`DELETE FROM vocab WHERE id = ${Number(params.id)}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy từ vựng.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Không thể xóa từ vựng.' }, { status: 500 });
  }
}
