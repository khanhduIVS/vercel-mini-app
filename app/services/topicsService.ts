/** Service cho /api/topics — danh sách chủ đề từ vựng hiện có (bảng topics riêng). */
import type { Topic } from '@/lib/types';

/** GET /api/topics — danh sách chủ đề. */
export async function fetchTopics(): Promise<Topic[]> {
  const res = await fetch('/api/topics');
  if (!res.ok) throw new Error('Không thể tải chủ đề');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
