import { NextResponse } from 'next/server';
import { sql, ensureTables } from '@/lib/db';
import type { UserStats } from '@/lib/types';

/** GET /api/stats?user=name — learning stats for a user. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user');
    if (!userName) {
      return NextResponse.json({ error: 'Thiếu tên người dùng' }, { status: 400 });
    }

    await ensureTables();

    const progressRows = await sql`
      SELECT box_level, next_review, wrong_count
      FROM user_progress
      WHERE user_name = ${userName} AND word_id IS NOT NULL
    `;

    const now = new Date();
    let totalLearned = 0;
    let dueForReview = 0;
    let totalCorrect = 0;
    let totalAttempts = 0;
    let box1 = 0, box2 = 0, box3 = 0;

    for (const row of progressRows) {
      totalLearned++;
      if (row.next_review && new Date(row.next_review) <= now) dueForReview++;
      const box = Number(row.box_level) || 1;
      if (box === 1) box1++;
      else if (box === 2) box2++;
      else if (box === 3) box3++;
      const wrong = Number(row.wrong_count) || 0;
      totalCorrect += 1;
      totalAttempts += wrong + 1;
    }

    const totalResult = await sql`SELECT COUNT(*) AS cnt FROM vocab`;
    const totalAvailable = Number(totalResult[0].cnt);

    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const progressPercentage = totalAvailable > 0 ? Math.round((totalLearned / totalAvailable) * 100) : 0;

    const stats: UserStats = {
      userName,
      totalLearned,
      dueForReview,
      accuracy,
      totalAvailable,
      progressPercentage,
      box1Count: box1,
      box2Count: box2,
      box3Count: box3,
    };

    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: 'Không thể tải thống kê' }, { status: 500 });
  }
}
