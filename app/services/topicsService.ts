/** Service cho /api/topics — danh sách chủ đề từ vựng hiện có. */

/** GET /api/topics — danh sách chủ đề (distinct). */
export async function fetchTopics(): Promise<string[]> {
  const res = await fetch('/api/topics');
  if (!res.ok) throw new Error('Không thể tải chủ đề');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
