/**
 * Service cho các endpoint quản lý từ vựng:
 * GET/POST /api/vocab, GET/PUT/DELETE /api/vocab/[id], POST /api/vocab/import.
 */
import type { Vocab, ImportResult } from '@/lib/types';

export interface VocabListResult {
  words: Vocab[];
  total: number;
}

export interface VocabUpdateInput {
  ipa: string;
  wordType: string;
  vietnameseMeaning: string;
  /** Tên chủ đề (text tự do) — server tự resolve/tạo topic nếu chưa tồn tại. */
  topic: string;
  imageUrl: string;
  /**
   * true  → xóa ảnh hiện tại (set image_url = '').
   * false → giữ nguyên ảnh cũ nếu imageUrl rỗng; ghi đè nếu imageUrl có giá trị.
   */
  clearImage?: boolean;
}

/** GET /api/vocab?search=&topicId=&page=&pageSize= — danh sách từ có phân trang/lọc. */
export async function fetchVocabList(
  search: string,
  topicId: string,
  page: number,
  pageSize: number
): Promise<VocabListResult> {
  const params = new URLSearchParams({
    search, topicId, page: String(page), pageSize: String(pageSize),
  });
  const res = await fetch(`/api/vocab?${params}`);
  if (!res.ok) throw new Error('Không thể tải danh sách từ');
  const data = await res.json();
  return { words: data.words || [], total: data.total || 0 };
}

/** GET /api/vocab/:id — lấy thông tin 1 từ. */
export async function fetchVocabById(wordId: string): Promise<Vocab> {
  const res = await fetch(`/api/vocab/${wordId}`);
  if (!res.ok) throw new Error('Không thể tải thông tin từ');
  return res.json();
}

/** PUT /api/vocab/:id — cập nhật thông tin 1 từ (không hỗ trợ partial update, phải gửi đủ field). */
export async function updateVocab(wordId: string, input: VocabUpdateInput): Promise<Vocab> {
  const res = await fetch(`/api/vocab/${wordId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Lỗi khi cập nhật');
  return res.json();
}

/** DELETE /api/vocab/:id — xóa 1 từ. */
export async function deleteVocab(wordId: string): Promise<void> {
  const res = await fetch(`/api/vocab/${wordId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Lỗi khi xóa');
}

/** POST /api/vocab/import — import/upsert hàng loạt từ CSV. */
export async function importVocabCsv(csv: string): Promise<ImportResult> {
  const res = await fetch('/api/vocab/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv }),
  });
  if (!res.ok) throw new Error('Không thể import');
  return res.json();
}
