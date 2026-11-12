import { NextResponse } from 'next/server';
import { sql, ensureTables, VOCAB_COLUMNS, VOCAB_TOPIC_JOIN, sqlQuery, resolveTopicIds, InvalidTopicNameError } from '@/lib/db';
import type { Vocab } from '@/lib/types';

/** GET /api/vocab?search=&topicId=&page=1&pageSize=20 — paginated list for management. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = (searchParams.get('search') || '').trim();
    const topicId = (searchParams.get('topicId') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10));

    await ensureTables();

    // Build dynamic WHERE clause (alias v = vocab, dùng chung với VOCAB_TOPIC_JOIN)
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    let idx = 1;

    if (searchTerm) {
      where += ` AND (LOWER(v.english_word) LIKE $${idx} OR LOWER(v.vietnamese_meaning) LIKE $${idx})`;
      params.push(`%${searchTerm.toLowerCase()}%`);
      idx++;
    }
    if (topicId) {
      where += ` AND v.topic_id = $${idx}`;
      params.push(topicId);
      idx++;
    }

    // Count total (không cần JOIN topics vì chỉ lọc theo topic_id)
    const countResult = await sqlQuery(
      `SELECT COUNT(*) AS cnt FROM vocab v ${where}`,
      params
    );
    const total = Number(countResult[0].cnt);

    // Paginated query
    const offset = (page - 1) * pageSize;
    const rows = await sqlQuery<Vocab>(
      `SELECT ${VOCAB_COLUMNS} FROM vocab v ${VOCAB_TOPIC_JOIN} ${where} ORDER BY v.english_word LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, pageSize, offset]
    );

    return NextResponse.json({ words: rows, total });
  } catch {
    return NextResponse.json({ error: 'Không thể tải danh sách từ' }, { status: 500 });
  }
}

/** POST /api/vocab — create a single new word. Nhận `topic` là TÊN chủ đề (tự do), tự tạo topic mới nếu chưa tồn tại. */
export async function POST(request: Request) {
  try {
    await ensureTables();
    const { englishWord, ipa, wordType, vietnameseMeaning, topic, imageUrl } = await request.json();

    if (!englishWord?.trim() || !vietnameseMeaning?.trim()) {
      return NextResponse.json({ error: 'Thiếu từ tiếng Anh hoặc nghĩa' }, { status: 400 });
    }

    // Check duplicate: cùng từ + cùng loại từ mới coi là trùng (khác loại từ là từ riêng biệt hợp lệ)
    const existing = await sql`
      SELECT word_id FROM vocab
      WHERE LOWER(english_word) = LOWER(${englishWord.trim()})
        AND LOWER(word_type) = LOWER(${wordType?.trim() || ''})
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Từ này (cùng loại từ) đã tồn tại' }, { status: 409 });
    }

    const topicName = (topic || '').trim();
    let topicId: string | null = null;
    if (topicName) {
      const topicIds = await resolveTopicIds([topicName]);
      topicId = topicIds.get(topicName) || null;
    }

    const rows = await sql`
      INSERT INTO vocab (english_word, ipa, word_type, vietnamese_meaning, topic_id, image_url)
      VALUES (${englishWord.trim()}, ${ipa?.trim() || ''}, ${wordType?.trim() || ''}, ${vietnameseMeaning.trim()}, ${topicId}, ${imageUrl?.trim() || ''})
      RETURNING
        word_id       AS "wordId",
        english_word  AS "englishWord",
        ipa           AS "ipa",
        word_type     AS "wordType",
        vietnamese_meaning AS "vietnameseMeaning",
        topic_id      AS "topicId",
        image_url     AS "imageUrl"
    `;

    const created = { ...rows[0], topic: topicName } as Vocab;
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof InvalidTopicNameError) {
      return NextResponse.json(
        { error: `Tên chủ đề không hợp lệ (trông giống UUID): ${e.invalidNames.join(', ')}. Vui lòng nhập tên chủ đề dạng chữ.` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Không thể thêm từ vựng' }, { status: 500 });
  }
}
