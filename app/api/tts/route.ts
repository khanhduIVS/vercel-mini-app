import { NextResponse } from 'next/server';
import { EdgeTTS } from '@travisvn/edge-tts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tts?text=...&voice=vi-VN-HoaiMyNeural&rate=-10%
 *
 * Gọi Microsoft Edge TTS (miễn phí, không cần API key) server-side,
 * trả về audio/mpeg để client phát bằng Web Audio API.
 *
 * Voices tiếng Việt:
 *   vi-VN-HoaiMyNeural   — nữ, miền Nam (default)
 *   vi-VN-NamMinhNeural  — nam, miền Bắc
 *
 * Timeout 8s — tránh treo request trên Vercel free (limit 10s).
 */

const TIMEOUT_MS = 8000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const text  = searchParams.get('text') || '';
    const voice = searchParams.get('voice') || 'vi-VN-HoaiMyNeural';
    const rate  = searchParams.get('rate') || '-10%';

    if (!text.trim()) {
      return NextResponse.json({ error: 'Thiếu text' }, { status: 400 });
    }

    const tts = new EdgeTTS(text.trim(), voice, { rate });

    // Race giữa synthesize và timeout 8s
    const result = await Promise.race([
      tts.synthesize(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Edge TTS timeout')), TIMEOUT_MS)
      ),
    ]);

    const arrayBuffer = await result.audio.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    console.error('[Edge TTS]', e);
    return NextResponse.json({ error: 'Không thể tạo audio' }, { status: 500 });
  }
}
