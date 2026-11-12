import { neon } from '@neondatabase/serverless';

/**
 * Neon serverless driver — reads the connection string injected by Vercel's
 * Neon integration (DATABASE_URL). Falls back to POSTGRES_URL for legacy dbs.
 */
const sql = neon(
  process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
);

export { sql };

/** Function-call style query (for dynamic SQL with runtime-built WHERE clauses). */
export async function sqlQuery<T = any>(query: string, params: (string | number)[] = []): Promise<T[]> {
  // neon() attaches a .query method for conventional call style with $1, $2 placeholders
  return sql.query(query, params) as Promise<T[]>;
}

/**
 * Column-select helper — returns rows with camelCase keys matching the frontend.
 * JOIN với bảng topics để lấy tên chủ đề hiển thị (topic) bên cạnh topic_id.
 * Dùng alias `v` cho vocab — mọi câu SQL dùng VOCAB_COLUMNS phải FROM vocab v (có thể kèm JOIN topics t).
 */
export const VOCAB_COLUMNS = `
  v.word_id       AS "wordId",
  v.english_word  AS "englishWord",
  v.ipa           AS "ipa",
  v.word_type     AS "wordType",
  v.vietnamese_meaning AS "vietnameseMeaning",
  v.topic_id      AS "topicId",
  t.name          AS "topic",
  v.image_url     AS "imageUrl"
`;

/** Clause JOIN dùng chung sau "FROM vocab v" để lấy tên topic (LEFT JOIN vì topic_id có thể NULL). */
export const VOCAB_TOPIC_JOIN = `LEFT JOIN topics t ON v.topic_id = t.topic_id`;

/** Box levels for spaced repetition: hours to wait before next review. */
export const BOX_LEVELS: Record<number, number> = {
  1: 24,   // Box 1: review after 1 day
  2: 72,   // Box 2: review after 3 days
  3: 168,  // Box 3: review after 7 days
};
export const MAX_BOX_LEVEL = 3;

/**
 * Ensures all tables exist with the current schema.
 * Bao gồm migration 1 lần: nếu vocab còn schema cũ (cột `topic` text tự do,
 * chưa có `topic_id`), drop và tạo lại vocab theo schema mới, đồng thời dọn
 * các dòng user_progress đã trở thành orphan (word_id không còn khớp từ nào).
 */
export async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS topics (
      id           SERIAL PRIMARY KEY,
      topic_id     UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      name         VARCHAR(100) NOT NULL,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  try {
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_name_lower
      ON topics (LOWER(name))
    `;
  } catch (e) {
    console.error(
      'Không thể tạo unique index idx_topics_name_lower (có thể do dữ liệu trùng tên chủ đề).',
      e
    );
  }

  await sql`
    CREATE TABLE IF NOT EXISTS vocab (
      id                  SERIAL PRIMARY KEY,
      word_id             UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      english_word        VARCHAR(255) NOT NULL,
      ipa                 TEXT DEFAULT '',
      word_type           VARCHAR(50) DEFAULT '',
      vietnamese_meaning  TEXT NOT NULL,
      topic_id            UUID REFERENCES topics(topic_id),
      image_url           TEXT DEFAULT '',
      created_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  // Nới cột word_type nếu bảng đã tồn tại từ trước với kích thước cũ (VARCHAR(20)) —
  // CREATE TABLE IF NOT EXISTS không tự alter cột của bảng đã có.
  // Một số giá trị loại từ hợp lệ (ví dụ "adj, adv, exclamation") dài hơn 20 ký tự.
  try {
    await sql`ALTER TABLE vocab ALTER COLUMN word_type TYPE VARCHAR(50)`;
  } catch (e) {
    console.error('Không thể nới cột word_type lên VARCHAR(50):', e);
  }

  // Lưu ý: migration 1 lần (drop + tạo lại vocab để đổi cột `topic` text -> `topic_id` UUID)
  // đã HOÀN TẤT và bị loại bỏ khỏi code chạy thường trực. KHÔNG thêm lại logic
  // DROP TABLE tự động ở đây — ensureTables() chạy trên mọi request và có thể bị gọi
  // đồng thời từ nhiều request song song (ví dụ lúc `next build` prerender nhiều route),
  // nên bất kỳ điều kiện DROP TABLE tự động nào đều là rủi ro mất dữ liệu thật trong production.
  // Nếu cần đổi schema trong tương lai, hãy chạy migration qua 1 script riêng, chạy 1 lần,
  // có xác nhận rõ ràng — không đặt trong đường dẫn code mà mọi request đều đi qua.

  await sql`
    CREATE TABLE IF NOT EXISTS user_progress (
      id           SERIAL PRIMARY KEY,
      user_name    VARCHAR(50) NOT NULL,
      word_id      UUID,
      box_level    INTEGER DEFAULT 1,
      next_review  TIMESTAMP,
      wrong_count  INTEGER DEFAULT 0
    )
  `;
  // Prevent duplicate (user, word) pairs for actual word records
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_user_word
    ON user_progress (user_name, word_id)
    WHERE word_id IS NOT NULL
  `;
  // Xóa index cũ (chỉ theo english_word) nếu còn tồn tại từ phiên bản trước — giờ 1 từ có thể
  // có nhiều bản ghi khác loại từ (ví dụ "forward" adj và "forward" adv là 2 từ riêng biệt).
  await sql`DROP INDEX IF EXISTS idx_vocab_english_word_lower`;

  // Unique index (case-insensitive) trên (english_word, word_type) để hỗ trợ bulk upsert (ON CONFLICT)
  // khi import CSV. Khóa theo CẢ loại từ: cùng từ nhưng khác loại từ (ví dụ "good" adj và "good" n)
  // được coi là 2 bản ghi riêng biệt, không ghi đè lẫn nhau.
  // Bọc try/catch riêng: nếu dữ liệu cũ đã có (english_word, word_type) trùng hệt,
  // việc tạo index sẽ lỗi — không để lỗi này làm sập toàn bộ ensureTables().
  try {
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_vocab_word_type_lower
      ON vocab (LOWER(english_word), LOWER(word_type))
    `;
  } catch (e) {
    console.error(
      'Không thể tạo unique index idx_vocab_word_type_lower (có thể do dữ liệu trùng english_word + word_type). ' +
      'Import CSV sẽ dùng chế độ chậm hơn (SELECT + INSERT/UPDATE từng dòng) cho tới khi dữ liệu trùng được dọn.',
      e
    );
  }

  // Seed sample vocabulary if table is empty
  // (Đã comment: không tự động seed lại dữ liệu mẫu khi bảng vocab bị xóa rỗng)
  // const count = await sql`SELECT COUNT(*) AS cnt FROM vocab`;
  // if (Number(count[0].cnt) === 0) {
  //   await seedSampleVocabulary();
  // }
}

/** Pattern UUID chuẩn (v1-v5), dùng để phát hiện khi ai đó vô tình đưa topic_id/word_id
 * (dạng UUID) vào chỗ cần TÊN chủ đề — ví dụ copy nhầm cột topicId thay vì tên khi tạo CSV import. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Lỗi ném ra khi phát hiện tên chủ đề thực chất là 1 UUID (rất có thể nhập sai dữ liệu). */
export class InvalidTopicNameError extends Error {
  constructor(public readonly invalidNames: string[]) {
    super(`Tên chủ đề không hợp lệ (trông giống UUID, có thể đã nhập nhầm id thay vì tên): ${invalidNames.join(', ')}`);
    this.name = 'InvalidTopicNameError';
  }
}

/**
 * Resolve danh sách TÊN chủ đề thành topic_id, tự tạo (upsert) chủ đề mới nếu tên chưa tồn tại.
 * So khớp không phân biệt hoa/thường. Tên rỗng/chỉ khoảng trắng bị bỏ qua (không tạo topic rỗng).
 * Trả về Map tên gốc (chưa chuẩn hóa) -> topic_id, để caller tra cứu lại đúng tên đã truyền vào.
 *
 * Ném InvalidTopicNameError nếu phát hiện tên nào đó có dạng UUID — chặn việc vô tình tạo ra
 * 1 "chủ đề" có tên là chuỗi UUID (ví dụ copy nhầm topicId thay vì tên lúc chuẩn bị file CSV).
 */
export async function resolveTopicIds(names: string[]): Promise<Map<string, string>> {
  const distinctNames = Array.from(
    new Set(names.map((n) => n.trim()).filter((n) => n.length > 0))
  );
  const result = new Map<string, string>();
  if (distinctNames.length === 0) return result;

  const invalidNames = distinctNames.filter((n) => UUID_PATTERN.test(n));
  if (invalidNames.length > 0) {
    throw new InvalidTopicNameError(invalidNames);
  }

  // Upsert từng tên: tạo mới nếu chưa có (ON CONFLICT theo LOWER(name) bỏ qua nếu đã tồn tại).
  for (const name of distinctNames) {
    await sql`
      INSERT INTO topics (name) VALUES (${name})
      ON CONFLICT (LOWER(name)) DO NOTHING
    `;
  }

  const lowerNames = distinctNames.map((n) => n.toLowerCase());
  const lowerToOriginal = new Map(distinctNames.map((n) => [n.toLowerCase(), n]));
  const rows = await sql`
    SELECT topic_id, name FROM topics WHERE LOWER(name) = ANY(${lowerNames})
  `;
  for (const row of rows) {
    const original = lowerToOriginal.get(String(row.name).toLowerCase());
    if (original) result.set(original, row.topic_id);
  }
  return result;
}

async function seedSampleVocabulary() {
  const samples: [string, string, string, string, string][] = [
    ['apple', '/ˈæp.əl/', 'n', 'quả táo', 'Trái cây'],
    ['orange', '/ˈɒr.ɪndʒ/', 'n', 'quả cam', 'Trái cây'],
    ['book', '/bʊk/', 'n', 'quyển sách', 'Trường học'],
    ['pen', '/pen/', 'n', 'cây bút', 'Trường học'],
    ['school', '/skuːl/', 'n', 'trường học', 'Trường học'],
    ['cat', '/kæt/', 'n', 'con mèo', 'Con vật'],
    ['dog', '/dɒɡ/', 'n', 'con chó', 'Con vật'],
    ['bird', '/bɜːd/', 'n', 'con chim', 'Con vật'],
    ['fish', '/fɪʃ/', 'n', 'con cá', 'Con vật'],
    ['house', '/haʊs/', 'n', 'ngôi nhà', 'Nhà cửa & Đồ vật'],
    ['door', '/dɔːr/', 'n', 'cái cửa', 'Nhà cửa & Đồ vật'],
    ['table', '/ˈteɪ.bəl/', 'n', 'cái bàn', 'Nhà cửa & Đồ vật'],
    ['water', '/ˈwɔː.tər/', 'n', 'nước', 'Thiên nhiên & Thời tiết'],
    ['sun', '/sʌn/', 'n', 'mặt trời', 'Thiên nhiên & Thời tiết'],
    ['moon', '/muːn/', 'n', 'mặt trăng', 'Thiên nhiên & Thời tiết'],
    ['tree', '/triː/', 'n', 'cái cây', 'Thiên nhiên & Thời tiết'],
    ['red', '/red/', 'adj', 'màu đỏ', 'Màu sắc'],
    ['blue', '/bluː/', 'adj', 'màu xanh dương', 'Màu sắc'],
    ['mother', '/ˈmʌð.ər/', 'n', 'mẹ', 'Gia đình & Con người'],
    ['father', '/ˈfɑː.ðər/', 'n', 'bố', 'Gia đình & Con người'],
  ];

  const names = samples.map((s) => s[4]);
  const topicIds = await resolveTopicIds(names);

  for (const [englishWord, ipa, wordType, meaning, topic] of samples) {
    const topicId = topicIds.get(topic) || null;
    await sql`
      INSERT INTO vocab (english_word, ipa, word_type, vietnamese_meaning, topic_id, image_url)
      VALUES (${englishWord}, ${ipa}, ${wordType}, ${meaning}, ${topicId}, '')
    `;
  }
}

/** Kiểm tra unique index hỗ trợ bulk upsert (ON CONFLICT) cho vocab đã được tạo thành công chưa. */
export async function hasVocabUpsertIndex(): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'vocab' AND indexname = 'idx_vocab_word_type_lower'
  `;
  return rows.length > 0;
}

/** Parse a single CSV line into an array of fields (handles quoted commas). */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (line.charAt(i + 1) === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else { cur += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}
