import { NextResponse } from 'next/server';
import { sql, ensureTables, VOCAB_COLUMNS, sqlQuery } from '@/lib/db';
import type { Vocab } from '@/lib/types';

/** GET /api/vocab?search=&topic=&page=1&pageSize=20 — paginated list for management. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = (searchParams.get('search') || '').trim();
    const topic = (searchParams.get('topic') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10));

    await ensureTables();

    // Build dynamic WHERE clause
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    let idx = 1;

    if (searchTerm) {
      where += ` AND (LOWER(english_word) LIKE $${idx} OR LOWER(vietnamese_meaning) LIKE $${idx})`;
      params.push(`%${searchTerm.toLowerCase()}%`);
      idx++;
    }
    if (topic) {
      where += ` AND topic = $${idx}`;
      params.push(topic);
      idx++;
    }

    // Count total
    const countResult = await sqlQuery(
      `SELECT COUNT(*) AS cnt FROM vocab ${where}`,
      params
    );
    const total = Number(countResult[0].cnt);

    // Paginated query
    const offset = (page - 1) * pageSize;
    const rows = await sqlQuery<Vocab>(
      `SELECT ${VOCAB_COLUMNS} FROM vocab ${where} ORDER BY english_word LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, pageSize, offset]
    );

    return NextResponse.json({ words: rows, total });
  } catch {
    return NextResponse.json({ error: 'Không thể tải danh sách từ' }, { status: 500 });
  }
}

/** POST /api/vocab — create a single new word. */
export async function POST(request: Request) {
  try {
    await ensureTables();
    const { englishWord, ipa, wordType, vietnameseMeaning, topic, imageUrl } = await request.json();

    if (!englishWord?.trim() || !vietnameseMeaning?.trim()) {
      return NextResponse.json({ error: 'Thiếu từ tiếng Anh hoặc nghĩa' }, { status: 400 });
    }

    // Check duplicate
    const existing = await sql`SELECT word_id FROM vocab WHERE LOWER(english_word) = LOWER(${englishWord.trim()})`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Từ này đã tồn tại' }, { status: 409 });
    }

    const rows = await sql`
      INSERT INTO vocab (english_word, ipa, word_type, vietnamese_meaning, topic, image_url)
      VALUES (${englishWord.trim()}, ${ipa?.trim() || ''}, ${wordType?.trim() || ''}, ${vietnameseMeaning.trim()}, ${topic?.trim() || ''}, ${imageUrl?.trim() || ''})
      RETURNING
        word_id       AS "wordId",
        english_word  AS "englishWord",
        ipa           AS "ipa",
        word_type     AS "wordType",
        vietnamese_meaning AS "vietnameseMeaning",
        topic         AS "topic",
        image_url     AS "imageUrl"
    ` as Vocab[];

    return NextResponse.json(rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Không thể thêm từ vựng' }, { status: 500 });
  }
}
