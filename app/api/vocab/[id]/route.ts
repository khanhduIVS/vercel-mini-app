import { NextResponse } from 'next/server';
import { sql, ensureTables, resolveTopicIds } from '@/lib/db';
import type { Vocab } from '@/lib/types';

/** GET /api/vocab/:id — get a single word by word_id. JOIN topics để trả tên chủ đề hiển thị. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureTables();
    const rows = await sql`
      SELECT
        v.word_id       AS "wordId",
        v.english_word  AS "englishWord",
        v.ipa           AS "ipa",
        v.word_type     AS "wordType",
        v.vietnamese_meaning AS "vietnameseMeaning",
        v.topic_id      AS "topicId",
        t.name          AS "topic",
        v.image_url     AS "imageUrl"
      FROM vocab v
      LEFT JOIN topics t ON v.topic_id = t.topic_id
      WHERE v.word_id = ${params.id}
    ` as Vocab[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy từ' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: 'Không thể tải từ vựng' }, { status: 500 });
  }
}

/** PUT /api/vocab/:id — update word fields. `topic` là TÊN chủ đề (tự do), tự tạo topic mới nếu chưa tồn tại. */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureTables();
    const { ipa, wordType, vietnameseMeaning, topic, imageUrl } = await request.json();

    const topicName = (topic || '').trim();
    let topicId: string | null = null;
    if (topicName) {
      const topicIds = await resolveTopicIds([topicName]);
      topicId = topicIds.get(topicName) || null;
    }

    const rows = await sql`
      UPDATE vocab
      SET ipa = ${ipa?.trim() || ''},
          word_type = ${wordType?.trim() || ''},
          vietnamese_meaning = ${vietnameseMeaning?.trim() || ''},
          topic_id = ${topicId},
          image_url = ${imageUrl?.trim() || ''}
      WHERE word_id = ${params.id}
      RETURNING word_id AS "wordId"
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy từ' }, { status: 404 });
    }

    // Trả lại bản ghi đầy đủ kèm tên topic (JOIN) để client cập nhật đúng hiển thị.
    const updated = await sql`
      SELECT
        v.word_id       AS "wordId",
        v.english_word  AS "englishWord",
        v.ipa           AS "ipa",
        v.word_type     AS "wordType",
        v.vietnamese_meaning AS "vietnameseMeaning",
        v.topic_id      AS "topicId",
        t.name          AS "topic",
        v.image_url     AS "imageUrl"
      FROM vocab v
      LEFT JOIN topics t ON v.topic_id = t.topic_id
      WHERE v.word_id = ${params.id}
    ` as Vocab[];

    return NextResponse.json(updated[0]);
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
