/** Service cho /api/learn và /api/learn/submit — phiên học & ghi nhận kết quả. */
import type { Vocab, SubmitResult } from '@/lib/types';

export interface LearnSessionResult {
  words: Vocab[];
  total: number;
}

/** GET /api/learn?user=&count=&topicId= — lấy danh sách từ ngẫu nhiên cho 1 buổi học. */
export async function fetchLearnSession(
  userName: string,
  count: number,
  topicId: string
): Promise<LearnSessionResult> {
  const params = new URLSearchParams({ user: userName, count: String(count), topicId });
  const res = await fetch(`/api/learn?${params}`);
  if (!res.ok) throw new Error('Không thể bắt đầu học');
  return res.json();
}

/** POST /api/learn/submit — ghi nhận câu trả lời đúng/sai cho 1 từ. */
export async function submitLearnAnswer(
  userName: string,
  wordId: string,
  isKnown: boolean
): Promise<SubmitResult> {
  const res = await fetch('/api/learn/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, wordId, isKnown }),
  });
  if (!res.ok) throw new Error('Không thể ghi nhận kết quả');
  return res.json();
}
