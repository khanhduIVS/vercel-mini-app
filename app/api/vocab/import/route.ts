import { NextResponse } from 'next/server';
import { sql, sqlQuery, ensureTables, parseCsvLine, hasVocabUpsertIndex, resolveTopicIds, InvalidTopicNameError } from '@/lib/db';
import type { ImportResult } from '@/lib/types';

interface ParsedRow {
  english: string;
  ipa: string;
  wordType: string;
  meaning: string;
  /**
   * Cột 5 trong CSV — có thể là:
   *   - Tên chủ đề tự do (ví dụ "Con vật", "Màu sắc")
   *   - UUID topic_id xuất thẳng từ DB (ví dụ "6b487997-0ec6-44f1-ae46-c53e496b328b")
   *   - Rỗng = không chỉ định chủ đề
   */
  topicRaw: string;
  imageUrl: string;
}

interface ResolvedRow extends ParsedRow {
  /** topic_id đã resolve; null nếu topicRaw rỗng hoặc không tìm thấy. */
  topicId: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BULK_BATCH_SIZE = 500;

/** Parse toàn bộ text CSV thành danh sách dòng hợp lệ, đếm số dòng lỗi định dạng.
 *  Cột 7 (created_date từ export DB) được bỏ qua tự động nếu có.
 */
function parseCsvRows(text: string): { rows: ParsedRow[]; errors: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const rows: ParsedRow[] = [];
  let errors = 0;

  for (const line of lines) {
    const parts = parseCsvLine(line);
    if (parts.length < 4) { errors++; continue; }

    const english   = (parts[0] || '').trim();
    const ipa       = (parts[1] || '').trim();
    const wordType  = (parts[2] || '').trim();
    const meaning   = (parts[3] || '').trim();
    const topicRaw  = parts.length > 4 ? (parts[4] || '').trim() : '';
    const imageUrl  = parts.length > 5 ? (parts[5] || '').trim() : '';
    // parts[6] = created_date từ export DB → bỏ qua

    if (!english || !meaning) { errors++; continue; }
    rows.push({ english, ipa, wordType, meaning, topicRaw, imageUrl });
  }

  return { rows, errors };
}

/**
 * Resolve cột topic cho từng dòng:
 *   - UUID  → tra thẳng bảng topics, lấy topic_id nếu tồn tại
 *   - Tên   → resolveTopicIds (tạo mới nếu chưa có)
 *   - Rỗng  → topicId = null
 */
async function resolveRowTopics(rows: ParsedRow[]): Promise<ResolvedRow[]> {
  // Tách UUID và tên riêng để xử lý khác nhau
  const uuidValues  = Array.from(new Set(rows.map(r => r.topicRaw).filter(v => UUID_PATTERN.test(v))));
  const nameValues  = Array.from(new Set(rows.map(r => r.topicRaw).filter(v => v && !UUID_PATTERN.test(v))));

  // Map topicRaw → topic_id
  const topicMap = new Map<string, string>();

  // UUID: kiểm tra tồn tại trong bảng topics
  if (uuidValues.length > 0) {
    const found = await sql`SELECT topic_id FROM topics WHERE topic_id = ANY(${uuidValues})`;
    for (const row of found) {
      topicMap.set(String(row.topic_id), String(row.topic_id));
    }
  }

  // Tên: resolve (upsert) qua resolveTopicIds
  if (nameValues.length > 0) {
    const resolved = await resolveTopicIds(nameValues);
    resolved.forEach((id, name) => { topicMap.set(name, id); });
  }

  return rows.map(row => ({
    ...row,
    topicId: row.topicRaw ? (topicMap.get(row.topicRaw) || null) : null,
  }));
}

function dedupeRowsForBatch(rows: ResolvedRow[]): ResolvedRow[] {
  const map = new Map<string, ResolvedRow>();
  for (const row of rows) {
    const key = `${row.english.toLowerCase()}|${row.wordType.toLowerCase()}`;
    map.set(key, row);
  }
  return Array.from(map.values());
}

async function bulkUpsertBatch(batch: ResolvedRow[]): Promise<{ imported: number; updated: number }> {
  const valuesSql: string[] = [];
  const params: (string | null)[] = [];
  let idx = 1;

  for (const row of batch) {
    valuesSql.push(`($${idx}, $${idx+1}, $${idx+2}, $${idx+3}, $${idx+4}, $${idx+5})`);
    params.push(row.english, row.ipa, row.wordType, row.meaning, row.topicId, row.imageUrl);
    idx += 6;
  }

  const query = `
    INSERT INTO vocab (english_word, ipa, word_type, vietnamese_meaning, topic_id, image_url)
    VALUES ${valuesSql.join(', ')}
    ON CONFLICT (LOWER(english_word), LOWER(word_type)) DO UPDATE SET
      ipa                = COALESCE(NULLIF(EXCLUDED.ipa, ''), vocab.ipa),
      vietnamese_meaning = COALESCE(NULLIF(EXCLUDED.vietnamese_meaning, ''), vocab.vietnamese_meaning),
      topic_id           = COALESCE(EXCLUDED.topic_id, vocab.topic_id),
      image_url          = COALESCE(NULLIF(EXCLUDED.image_url, ''), vocab.image_url)
    RETURNING (xmax = 0) AS inserted
  `;

  const rows = await sqlQuery<{ inserted: boolean }>(query, params as (string | number)[]);
  const imported = rows.filter(r => r.inserted).length;
  return { imported, updated: rows.length - imported };
}

async function upsertRowSlow(row: ResolvedRow): Promise<'imported' | 'updated' | 'unchanged'> {
  const { english, ipa, wordType, meaning, topicId, imageUrl } = row;
  const existing = await sql`
    SELECT word_id, ipa, vietnamese_meaning, topic_id, image_url
    FROM vocab WHERE LOWER(english_word) = LOWER(${english}) AND LOWER(word_type) = LOWER(${wordType})
  `;

  if (existing.length === 0) {
    await sql`
      INSERT INTO vocab (english_word, ipa, word_type, vietnamese_meaning, topic_id, image_url)
      VALUES (${english}, ${ipa}, ${wordType}, ${meaning}, ${topicId}, ${imageUrl})
    `;
    return 'imported';
  }

  const cur = existing[0];
  const newIpa       = ipa       || cur.ipa;
  const newMeaning   = meaning   || cur.vietnamese_meaning;
  const newTopicId   = topicId   || cur.topic_id;
  const newImageUrl  = imageUrl  || cur.image_url;

  const changed = newIpa !== cur.ipa || newMeaning !== cur.vietnamese_meaning
    || newTopicId !== cur.topic_id || newImageUrl !== cur.image_url;

  if (!changed) return 'unchanged';

  await sql`
    UPDATE vocab
    SET ipa = ${newIpa}, vietnamese_meaning = ${newMeaning},
        topic_id = ${newTopicId}, image_url = ${newImageUrl}
    WHERE word_id = ${cur.word_id}
  `;
  return 'updated';
}

/** POST /api/vocab/import — bulk import / upsert from CSV.
 *  Cột 5 (topic) chấp nhận tên tự do HOẶC UUID topic_id xuất từ DB.
 *  Cột 7 (created_date từ export DB) được bỏ qua tự động.
 */
export async function POST(request: Request) {
  try {
    await ensureTables();
    const { csv } = await request.json();
    const text = String(csv ?? '').trim();
    if (!text) return NextResponse.json({ error: 'Dữ liệu CSV trống' }, { status: 400 });

    const { rows: parsedRows, errors } = parseCsvRows(text);
    const resolvedRows = await resolveRowTopics(parsedRows);
    let imported = 0, updated = 0, unchanged = 0;

    const canBulkUpsert = await hasVocabUpsertIndex();

    if (canBulkUpsert) {
      const rows = dedupeRowsForBatch(resolvedRows);
      for (let i = 0; i < rows.length; i += BULK_BATCH_SIZE) {
        const result = await bulkUpsertBatch(rows.slice(i, i + BULK_BATCH_SIZE));
        imported += result.imported;
        updated  += result.updated;
      }
    } else {
      for (const row of resolvedRows) {
        const outcome = await upsertRowSlow(row);
        if (outcome === 'imported') imported++;
        else if (outcome === 'updated') updated++;
        else unchanged++;
      }
    }

    return NextResponse.json({ imported, updated, unchanged, errors } as ImportResult);
  } catch (e) {
    if (e instanceof InvalidTopicNameError) {
      return NextResponse.json(
        { error: `Lỗi chủ đề: ${e.invalidNames.join(', ')}` },
        { status: 400 }
      );
    }
    console.error('Import CSV lỗi:', e);
    return NextResponse.json({ error: 'Không thể import' }, { status: 500 });
  }
}
