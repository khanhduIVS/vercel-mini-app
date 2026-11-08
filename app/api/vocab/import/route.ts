import { NextResponse } from 'next/server';
import { sql, ensureTables, parseCsvLine } from '@/lib/db';
import type { ImportResult } from '@/lib/types';

/** POST /api/vocab/import — bulk import / upsert from CSV text. */
export async function POST(request: Request) {
  try {
    await ensureTables();
    const { csv } = await request.json();
    const text = String(csv ?? '').trim();
    if (!text) {
      return NextResponse.json({ error: 'Dữ liệu CSV trống' }, { status: 400 });
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    let imported = 0, updated = 0, unchanged = 0, errors = 0;

    for (const line of lines) {
      const parts = parseCsvLine(line);
      if (parts.length < 4) { errors++; continue; }

      const english = (parts[0] || '').trim();
      const ipa = (parts[1] || '').trim();
      const wordType = (parts[2] || '').trim();
      const meaning = (parts[3] || '').trim();
      const topic = parts.length > 4 ? (parts[4] || '').trim() : '';
      const imageUrl = parts.length > 5 ? (parts[5] || '').trim() : '';

      if (!english || !meaning) { errors++; continue; }

      const existing = await sql`
        SELECT word_id, ipa, word_type, vietnamese_meaning, topic, image_url
        FROM vocab WHERE LOWER(english_word) = LOWER(${english})
      `;

      if (existing.length === 0) {
        await sql`
          INSERT INTO vocab (english_word, ipa, word_type, vietnamese_meaning, topic, image_url)
          VALUES (${english}, ${ipa}, ${wordType}, ${meaning}, ${topic}, ${imageUrl})
        `;
        imported++;
      } else {
        const cur = existing[0];
        const newIpa = ipa || cur.ipa;
        const newType = wordType || cur.word_type;
        const newMeaning = meaning || cur.vietnamese_meaning;
        const newTopic = topic || cur.topic;
        const newImageUrl = imageUrl || cur.image_url;

        const changed =
          newIpa !== cur.ipa ||
          newType !== cur.word_type ||
          newMeaning !== cur.vietnamese_meaning ||
          newTopic !== cur.topic ||
          newImageUrl !== cur.image_url;

        if (changed) {
          await sql`
            UPDATE vocab
            SET ipa = ${newIpa}, word_type = ${newType}, vietnamese_meaning = ${newMeaning},
                topic = ${newTopic}, image_url = ${newImageUrl}
            WHERE word_id = ${cur.word_id}
          `;
          updated++;
        } else {
          unchanged++;
        }
      }
    }

    const result: ImportResult = { imported, updated, unchanged, errors };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Không thể import' }, { status: 500 });
  }
}
