/** Service cho /api/stats — thống kê học tập theo người dùng. */
import type { UserStats } from '@/lib/types';

/** GET /api/stats?user=name — thống kê học của 1 người dùng. */
export async function fetchUserStats(userName: string): Promise<UserStats> {
  const res = await fetch(`/api/stats?user=${encodeURIComponent(userName)}`);
  if (!res.ok) throw new Error('Không thể tải thống kê');
  return res.json();
}
