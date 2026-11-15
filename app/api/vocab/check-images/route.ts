import { NextResponse } from 'next/server';
import { sql, ensureTables } from '@/lib/db';

/**
 * POST /api/vocab/check-images
 * Body: { topicId?: string }
 *
 * Quét tất cả từ có image_url, fetch HEAD từng URL song song theo batch.
 * Nếu status 4xx (404, 403...) → xóa image_url về rỗng.
 * Trả về: { checked, broken, fixed }
 */

const BATCH_SIZE = 10;    // số URL fetch song song mỗi lần
const TIMEOUT_MS = 5000;  // timeout mỗi request HEAD

/** Fetch HEAD 1 URL, trả về true nếu ảnh còn sống (2xx/3xx), false nếu 4xx/lỗi. */
async function isImageAlive(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    return res.status < 400;
  } catch {
    // timeout hoặc network error — coi như lỗi
    return false;
  }
}

export async function POST(request: Request) {
  try {
    await ensureTables();

    const body = await request.json().catch(() => ({}));
    const topicId = (body?.topicId || '').trim();

    // Lấy tất cả từ đang có image_url (lọc theo topic nếu có)
    const rows = topicId
      ? await sql`
          SELECT word_id AS "wordId", image_url AS "imageUrl"
          FROM vocab
          WHERE image_url IS NOT NULL AND image_url != ''
            AND topic_id = ${topicId}
        `
      : await sql`
          SELECT word_id AS "wordId", image_url AS "imageUrl"
          FROM vocab
          WHERE image_url IS NOT NULL AND image_url != ''
        `;

    if (rows.length === 0) {
      return NextResponse.json({ checked: 0, broken: 0, fixed: 0 });
    }

    let broken = 0;
    let fixed = 0;

    // Xử lý theo batch song song
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (row: any) => ({
          wordId: row.wordId as string,
          alive: await isImageAlive(row.imageUrl as string),
        }))
      );

      // Collect word_id cần xóa ảnh
      const brokenIds = results.filter((r) => !r.alive).map((r) => r.wordId);

      if (brokenIds.length > 0) {
        broken += brokenIds.length;
        // Xóa image_url hàng loạt cho batch này
        await sql`
          UPDATE vocab SET image_url = ''
          WHERE word_id = ANY(${brokenIds})
        `;
        fixed += brokenIds.length;
      }
    }

    return NextResponse.json({ checked: rows.length, broken, fixed });
  } catch (e) {
    console.error('[check-images]', e);
    return NextResponse.json({ error: 'Không thể quét ảnh lỗi' }, { status: 500 });
  }
}
