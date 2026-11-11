import { NextResponse } from 'next/server';
import type { UnsplashImage } from '@/lib/types';

/** GET /api/unsplash?word=xxx&page=1&pageSize=20 — search Unsplash for images matching a word. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    if (!word) return NextResponse.json([]);

    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình UNSPLASH_ACCESS_KEY' }, { status: 500 });
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(30, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));

    const url = `https://api.unsplash.com/search/photos?page=${page}&per_page=${pageSize}&query=${encodeURIComponent(word)}`;
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${apiKey}` } });
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const images: UnsplashImage[] = (data.results || []).map((r: { urls: { thumb: string; regular: string } }) => ({
      thumb: r.urls.thumb,
      regular: r.urls.regular,
    }));

    return NextResponse.json(images);
  } catch {
    return NextResponse.json([]);
  }
}
