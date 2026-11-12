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

/** Column-select helper — returns rows with camelCase keys matching the frontend. */
export const VOCAB_COLUMNS = `
  word_id       AS "wordId",
  english_word  AS "englishWord",
  ipa           AS "ipa",
  word_type     AS "wordType",
  vietnamese_meaning AS "vietnameseMeaning",
  topic         AS "topic",
  image_url     AS "imageUrl"
`;

/** Box levels for spaced repetition: hours to wait before next review. */
export const BOX_LEVELS: Record<number, number> = {
  1: 24,   // Box 1: review after 1 day
  2: 72,   // Box 2: review after 3 days
  3: 168,  // Box 3: review after 7 days
};
export const MAX_BOX_LEVEL = 3;

/** Ensures both tables exist, then seeds sample vocabulary if empty. */
export async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS vocab (
      id                  SERIAL PRIMARY KEY,
      word_id             UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      english_word        VARCHAR(255) NOT NULL,
      ipa                 TEXT DEFAULT '',
      word_type           VARCHAR(20) DEFAULT '',
      vietnamese_meaning  TEXT NOT NULL,
      topic               VARCHAR(100) DEFAULT '',
      image_url           TEXT DEFAULT '',
      created_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
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
  // Unique index (case-insensitive) trên english_word để hỗ trợ bulk upsert (ON CONFLICT) khi import CSV.
  // Bọc try/catch riêng: nếu dữ liệu cũ đã có english_word trùng (khác hoa/thường),
  // việc tạo index sẽ lỗi — không để lỗi này làm sập toàn bộ ensureTables().
  try {
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_vocab_english_word_lower
      ON vocab (LOWER(english_word))
    `;
  } catch (e) {
    console.error(
      'Không thể tạo unique index idx_vocab_english_word_lower (có thể do dữ liệu trùng english_word). ' +
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

  for (const [englishWord, ipa, wordType, meaning, topic] of samples) {
    await sql`
      INSERT INTO vocab (english_word, ipa, word_type, vietnamese_meaning, topic, image_url)
      VALUES (${englishWord}, ${ipa}, ${wordType}, ${meaning}, ${topic}, '')
    `;
  }
}

/** Kiểm tra unique index hỗ trợ bulk upsert (ON CONFLICT) cho vocab đã được tạo thành công chưa. */
export async function hasVocabUpsertIndex(): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'vocab' AND indexname = 'idx_vocab_english_word_lower'
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
