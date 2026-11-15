import { NextResponse } from 'next/server';
import type { UnsplashImage } from '@/lib/types';

/**
 * Lấy danh sách API key từ biến môi trường UNSPLASH_ACCESS_KEY.
 * Nhiều key phân cách bằng dấu `;` — ví dụ: key1;key2;key3
 */
function getApiKeys(): string[] {
  const raw = process.env.UNSPLASH_ACCESS_KEY || '';
  return raw
    .split(';')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

/**
 * Gọi Unsplash API với danh sách key, tự động chuyển sang key tiếp theo
 * khi gặp lỗi 429 (rate limit) hoặc 403 (forbidden/key hết hạn).
 * Trả về response thành công đầu tiên, hoặc null nếu hết tất cả key.
 */
async function fetchWithKeyRotation(url: string): Promise<Response | null> {
  const keys = getApiKeys();
  if (keys.length === 0) return null;

  for (const key of keys) {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
    });

    if (res.status === 429 || res.status === 403) {
      // Key này đã hết lượt hoặc bị block — thử key tiếp theo
      console.warn(`[Unsplash] Key ${key.substring(0, 8)}... bị lỗi ${res.status}, chuyển key tiếp theo`);
      continue;
    }

    // Thành công hoặc lỗi khác (không phải rate limit) — trả về luôn
    return res;
  }

  // Hết tất cả key
  console.error('[Unsplash] Tất cả API key đều bị rate limit hoặc lỗi');
  return null;
}

/** GET /api/unsplash?word=xxx&page=1&pageSize=20 — search Unsplash for images matching a word. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    if (!word) return NextResponse.json([]);

    const keys = getApiKeys();
    if (keys.length === 0) {
      return NextResponse.json(
        { error: 'Chưa cấu hình UNSPLASH_ACCESS_KEY' },
        { status: 500 }
      );
    }

    const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(30, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    const url = `https://api.unsplash.com/search/photos?page=${page}&per_page=${pageSize}&query=${encodeURIComponent(word)}`;
    const res = await fetchWithKeyRotation(url);

    if (!res) {
      // Hết tất cả key
      return NextResponse.json(
        { error: 'Đã hết lượt gọi Unsplash API (tất cả key đều rate limit). Vui lòng thử lại sau.' },
        { status: 429 }
      );
    }

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const images: UnsplashImage[] = (data.results || []).map(
      (r: { urls: { thumb: string; regular: string } }) => ({
        thumb: r.urls.thumb,
        regular: r.urls.regular,
      })
    );

    return NextResponse.json(images);
  } catch {
    return NextResponse.json([]);
  }
}
