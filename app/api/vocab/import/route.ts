import { NextResponse } from 'next/server';
import { sql, sqlQuery, ensureTables, parseCsvLine, hasVocabUpsertIndex, resolveTopicIds } from '@/lib/db';
import type { ImportResult } from '@/lib/types';

interface ParsedRow {
  english: string;
  ipa: string;
  wordType: string;
  meaning: string;
  /** Tên chủ đề thô từ CSV (chuỗi rỗng = không chỉ định). */
  topicName: string;
  imageUrl: string;
}

interface ResolvedRow extends ParsedRow {
  /** topic_id đã resolve từ topicName; null nếu topicName rỗng. */
  topicId: string | null;
}

/** Số dòng xử lý mỗi batch khi dùng bulk upsert — giữ câu lệnh SQL ở kích thước hợp lý. */
const BULK_BATCH_SIZE = 500;

/** Parse toàn bộ text CSV thành danh sách dòng hợp lệ, đếm số dòng lỗi định dạng. */
function parseCsvRows(text: string): { rows: ParsedRow[]; errors: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const rows: ParsedRow[] = [];
  let errors = 0;

  for (const line of lines) {
    const parts = parseCsvLine(line);
    if (parts.length < 4) { errors++; continue; }

    const english = (parts[0] || '').trim();
    const ipa = (parts[1] || '').trim();
    const wordType = (parts[2] || '').trim();
    const meaning = (parts[3] || '').trim();
    const topicName = parts.length > 4 ? (parts[4] || '').trim() : '';
    const imageUrl = parts.length > 5 ? (parts[5] || '').trim() : '';

    if (!english || !meaning) { errors++; continue; }
    rows.push({ english, ipa, wordType, meaning, topicName, imageUrl });
  }

  return { rows, errors };
}

/**
 * Resolve tên chủ đề (text tự do trong CSV) thành topic_id cho toàn bộ các dòng,
 * tự tạo chủ đề mới nếu tên chưa tồn tại. Chỉ 1 lần gọi resolveTopicIds cho mọi tên
 * distinct xuất hiện trong file, tránh round-trip DB lặp lại cho mỗi dòng.
 */
async function resolveRowTopics(rows: ParsedRow[]): Promise<ResolvedRow[]> {
  const names = rows.map((r) => r.topicName).filter((n) => n.length > 0);
  const topicIds = await resolveTopicIds(names);
  return rows.map((row) => ({
    ...row,
    topicId: row.topicName ? (topicIds.get(row.topicName) || null) : null,
  }));
}

/**
 * Upsert hàng loạt bằng 1 câu lệnh INSERT ... ON CONFLICT DO UPDATE cho mỗi batch,
 * thay vì 1 SELECT + 1 INSERT/UPDATE riêng cho từng dòng. Giảm số round-trip DB
 * từ O(n) query xuống O(n / BULK_BATCH_SIZE), tránh timeout khi import file lớn (vài nghìn dòng).
 * `xmax = 0` là cách PostgreSQL phân biệt dòng vừa được INSERT mới (true) với dòng bị UPDATE (false)
 * trong cùng 1 câu lệnh ON CONFLICT.
 * Lưu ý: topic_id rỗng (null) nghĩa là "không chỉ định" trong dòng CSV này — giữ nguyên
 * topic_id cũ của bản ghi đã tồn tại (COALESCE), không ghi đè thành NULL.
 */
async function bulkUpsertBatch(batch: ResolvedRow[]): Promise<{ imported: number; updated: number }> {
  const valuesSql: string[] = [];
  const params: (string | null)[] = [];
  let idx = 1;

  for (const row of batch) {
    valuesSql.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`);
    params.push(row.english, row.ipa, row.wordType, row.meaning, row.topicId, row.imageUrl);
    idx += 6;
  }

  const query = `
    INSERT INTO vocab (english_word, ipa, word_type, vietnamese_meaning, topic_id, image_url)
    VALUES ${valuesSql.join(', ')}
    ON CONFLICT (LOWER(english_word)) DO UPDATE SET
      ipa = COALESCE(NULLIF(EXCLUDED.ipa, ''), vocab.ipa),
      word_type = COALESCE(NULLIF(EXCLUDED.word_type, ''), vocab.word_type),
      vietnamese_meaning = COALESCE(NULLIF(EXCLUDED.vietnamese_meaning, ''), vocab.vietnamese_meaning),
      topic_id = COALESCE(EXCLUDED.topic_id, vocab.topic_id),
      image_url = COALESCE(NULLIF(EXCLUDED.image_url, ''), vocab.image_url)
    RETURNING (xmax = 0) AS inserted
  `;

  const rows = await sqlQuery<{ inserted: boolean }>(query, params as (string | number)[]);
  const imported = rows.filter((r) => r.inserted).length;
  const updated = rows.length - imported;
  return { imported, updated };
}

/** Fallback chậm (SELECT + INSERT/UPDATE từng dòng) — dùng khi chưa có unique index hỗ trợ ON CONFLICT. */
async function upsertRowSlow(row: ResolvedRow): Promise<'imported' | 'updated' | 'unchanged'> {
  const { english, ipa, wordType, meaning, topicId, imageUrl } = row;
  const existing = await sql`
    SELECT word_id, ipa, word_type, vietnamese_meaning, topic_id, image_url
    FROM vocab WHERE LOWER(english_word) = LOWER(${english})
  `;

  if (existing.length === 0) {
    await sql`
      INSERT INTO vocab (english_word, ipa, word_type, vietnamese_meaning, topic_id, image_url)
      VALUES (${english}, ${ipa}, ${wordType}, ${meaning}, ${topicId}, ${imageUrl})
    `;
    return 'imported';
  }

  const cur = existing[0];
  const newIpa = ipa || cur.ipa;
  const newType = wordType || cur.word_type;
  const newMeaning = meaning || cur.vietnamese_meaning;
  const newTopicId = topicId || cur.topic_id;
  const newImageUrl = imageUrl || cur.image_url;

  const changed =
    newIpa !== cur.ipa ||
    newType !== cur.word_type ||
    newMeaning !== cur.vietnamese_meaning ||
    newTopicId !== cur.topic_id ||
    newImageUrl !== cur.image_url;

  if (!changed) return 'unchanged';

  await sql`
    UPDATE vocab
    SET ipa = ${newIpa}, word_type = ${newType}, vietnamese_meaning = ${newMeaning},
        topic_id = ${newTopicId}, image_url = ${newImageUrl}
    WHERE word_id = ${cur.word_id}
  `;
  return 'updated';
}

/** POST /api/vocab/import — bulk import / upsert from CSV text. Cột topic trong CSV là TÊN tự do. */
export async function POST(request: Request) {
  try {
    await ensureTables();
    const { csv } = await request.json();
    const text = String(csv ?? '').trim();
    if (!text) {
      return NextResponse.json({ error: 'Dữ liệu CSV trống' }, { status: 400 });
    }

    const { rows: parsedRows, errors } = parseCsvRows(text);
    const rows = await resolveRowTopics(parsedRows);
    let imported = 0, updated = 0, unchanged = 0;

    const canBulkUpsert = await hasVocabUpsertIndex();

    if (canBulkUpsert) {
      // Chế độ nhanh: upsert theo batch, mỗi batch 1 round-trip DB.
      for (let i = 0; i < rows.length; i += BULK_BATCH_SIZE) {
        const batch = rows.slice(i, i + BULK_BATCH_SIZE);
        const result = await bulkUpsertBatch(batch);
        imported += result.imported;
        updated += result.updated;
      }
      // Bulk upsert không phân biệt được "unchanged" vs "updated" (ON CONFLICT luôn chạy UPDATE SET),
      // nên mọi dòng trùng đã tồn tại đều được tính là "updated" dù giá trị có thể giống hệt cũ.
    } else {
      // Fallback chậm: xử lý tuần tự từng dòng (chỉ dùng khi dữ liệu cũ có english_word trùng
      // khiến không tạo được unique index cho ON CONFLICT).
      for (const row of rows) {
        const outcome = await upsertRowSlow(row);
        if (outcome === 'imported') imported++;
        else if (outcome === 'updated') updated++;
        else unchanged++;
      }
    }

    const result: ImportResult = { imported, updated, unchanged, errors };
    return NextResponse.json(result);
  } catch (e) {
    console.error('Import CSV lỗi:', e);
    return NextResponse.json({ error: 'Không thể import' }, { status: 500 });
  }
}
