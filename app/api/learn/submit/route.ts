import { NextResponse } from 'next/server';
import { sql, ensureTables, BOX_LEVELS, MAX_BOX_LEVEL } from '@/lib/db';
import type { SubmitResult } from '@/lib/types';

/** POST /api/learn/submit — record answer and update spaced-repetition progress. */
export async function POST(request: Request) {
  try {
    const { userName, wordId, isKnown } = await request.json();

    if (!userName || !wordId) {
      return NextResponse.json({ error: 'Thiếu thông tin người dùng hoặc từ vựng' }, { status: 400 });
    }

    await ensureTables();

    // Find existing progress record for this user + word
    const existing = await sql`
      SELECT id, box_level, wrong_count
      FROM user_progress
      WHERE user_name = ${userName} AND word_id = ${wordId}
    `;

    let newBoxLevel: number;

    if (existing.length === 0) {
      // First time seeing this word
      newBoxLevel = isKnown ? 2 : 1;
      const wrongCount = isKnown ? 0 : 1;
      const nextReview = isKnown
        ? new Date(Date.now() + (BOX_LEVELS[newBoxLevel] || 24) * 3600_000).toISOString()
        : new Date().toISOString();

      await sql`
        INSERT INTO user_progress (user_name, word_id, box_level, next_review, wrong_count)
        VALUES (${userName}, ${wordId}, ${newBoxLevel}, ${nextReview}, ${wrongCount})
      `;
    } else {
      // Update existing record
      const cur = existing[0];
      const currentBox = Number(cur.box_level) || 1;
      const currentWrong = Number(cur.wrong_count) || 0;

      newBoxLevel = isKnown ? Math.min(currentBox + 1, MAX_BOX_LEVEL) : 1;
      const newWrongCount = isKnown ? currentWrong : currentWrong + 1;
      const nextReview = isKnown
        ? new Date(Date.now() + (BOX_LEVELS[newBoxLevel] || 24) * 3600_000).toISOString()
        : new Date().toISOString();

      await sql`
        UPDATE user_progress
        SET box_level = ${newBoxLevel}, next_review = ${nextReview}, wrong_count = ${newWrongCount}
        WHERE id = ${cur.id}
      `;
    }

    const result: SubmitResult = {
      success: true,
      message: isKnown ? 'Tuyệt vời! 🌟' : 'Không sao, mình học lại nhé! 💪',
      newBoxLevel,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Không thể ghi nhận' }, { status: 500 });
  }
}
