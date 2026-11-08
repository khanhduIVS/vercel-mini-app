import { NextResponse } from 'next/server';
import { sql, ensureTables } from '@/lib/db';
import type { Vocab } from '@/lib/types';

/** GET /api/vocab/:id — get a single word by word_id. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureTables();
    const rows = await sql`
      SELECT
        word_id       AS "wordId",
        english_word  AS "englishWord",
        ipa           AS "ipa",
        word_type     AS "wordType",
        vietnamese_meaning AS "vietnameseMeaning",
        topic         AS "topic",
        image_url     AS "imageUrl"
      FROM vocab WHERE word_id = ${params.id}
    ` as Vocab[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy từ' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: 'Không thể tải từ vựng' }, { status: 500 });
  }
}

/** PUT /api/vocab/:id — update word fields. */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureTables();
    const { ipa, wordType, vietnameseMeaning, topic, imageUrl } = await request.json();

    const rows = await sql`
      UPDATE vocab
      SET ipa = ${ipa?.trim() || ''},
          word_type = ${wordType?.trim() || ''},
          vietnamese_meaning = ${vietnameseMeaning?.trim() || ''},
          topic = ${topic?.trim() || ''},
          image_url = ${imageUrl?.trim() || ''}
      WHERE word_id = ${params.id}
      RETURNING
        word_id       AS "wordId",
        english_word  AS "englishWord",
        ipa           AS "ipa",
        word_type     AS "wordType",
        vietnamese_meaning AS "vietnameseMeaning",
        topic         AS "topic",
        image_url     AS "imageUrl"
    ` as Vocab[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy từ' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: 'Không thể cập nhật từ vựng' }, { status: 500 });
  }
}

/** DELETE /api/vocab/:id — remove a word and its progress records. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureTables();
    const rows = await sql`DELETE FROM vocab WHERE word_id = ${params.id} RETURNING word_id`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy từ' }, { status: 404 });
    }
    await sql`DELETE FROM user_progress WHERE word_id = ${params.id}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Không thể xóa từ vựng' }, { status: 500 });
  }
}
