/** Service cho /api/unsplash — tìm ảnh minh họa theo từ khóa. */
import type { UnsplashImage } from '@/lib/types';

export type UnsplashSearchStatus = 'success' | 'empty' | 'rate_limited' | 'error';

export interface UnsplashSearchResult {
  status: UnsplashSearchStatus;
  images: UnsplashImage[];
}

/**
 * GET /api/unsplash?word=&page=&pageSize= — tìm ảnh theo từ khóa.
 * Trả về status rõ ràng để caller phân biệt được "hết lượt gọi API" (rate limit)
 * với "không tìm thấy ảnh" hay lỗi khác.
 */
export async function searchUnsplashImages(
  word: string,
  page = 1,
  pageSize = 20
): Promise<UnsplashSearchResult> {
  try {
    const params = new URLSearchParams({ word, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/unsplash?${params}`);

    if (res.status === 429) {
      return { status: 'rate_limited', images: [] };
    }
    if (!res.ok) {
      return { status: 'error', images: [] };
    }

    const images: UnsplashImage[] = await res.json();
    if (!Array.isArray(images) || images.length === 0) {
      return { status: 'empty', images: [] };
    }
    return { status: 'success', images };
  } catch {
    return { status: 'error', images: [] };
  }
}
