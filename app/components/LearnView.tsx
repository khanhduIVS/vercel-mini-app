'use client';

import { useState, useEffect, useRef } from 'react';
import type { Vocab } from '@/lib/types';
import { speak, speakSlow, speakWithVietnamese } from '@/app/hooks/useLearnSession';
import { WORD_TYPE_MAP, parseWordTypeCodes, filterKnownWordTypeCodes } from '@/app/lib/wordTypes';

// ---------------------------------------------------------------------------
//  Chu kỳ phát âm cho 1 từ:
//    1s chờ → EN → 2s → EN → 1s → VI → 1s  (tổng ~5s / chu kỳ)
//  Số chu kỳ = Math.floor(countdown / 5), tối thiểu 1.
//  Mỗi khi wordId thay đổi, cancel cycle cũ và bắt đầu cycle mới.
// ---------------------------------------------------------------------------
function useSpeakCycle(word: Vocab | undefined, countdown: number, active: boolean) {
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!active || !word) return;

    cancelRef.current = false;
    const cycles = Math.max(1, Math.floor(countdown / 5));
    const en = word.englishWord;
    const vi = word.vietnameseMeaning;

    // Helper: delay có thể bị cancel
    const delay = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => {
          if (cancelRef.current) reject(new Error('cancelled'));
          else resolve();
        }, ms);
        // Lưu timeout để cancel nếu cần (không dùng clearTimeout trực tiếp,
        // dùng cancelRef để reject bên trong setTimeout)
        void t;
      });

    const runCycles = async () => {
      try {
        for (let i = 0; i < cycles; i++) {
          if (cancelRef.current) return;
          await delay(1000);                    // 1s chờ
          if (cancelRef.current) return;
          speak(en);                            // phát EN bình thường
          await delay(2000);                    // 2s
          if (cancelRef.current) return;
          speakSlow(en);                        // phát EN chậm
          await delay(1000);                    // 1s chờ cuối chu kỳ
        }
      } catch {
        // bị cancel — dừng im lặng
      }
    };

    runCycles();

    return () => {
      cancelRef.current = true;
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  // countdown chỉ dùng lúc khởi động để tính số chu kỳ, không re-run khi đếm ngược
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.wordId, active]);
}

// ---------------------------------------------------------------------------
//  WordMeta: loại từ + IPA + nút phát âm
// ---------------------------------------------------------------------------
function WordMeta({ wordType, ipa, onSpeak, onSpeakSlow, onSpeakBoth }: {
  wordType: string;
  ipa: string;
  onSpeak: () => void;
  onSpeakSlow: () => void;
  onSpeakBoth: () => void;
}) {
  const codes = filterKnownWordTypeCodes(parseWordTypeCodes(wordType));
  const desc = codes.map((c) => WORD_TYPE_MAP[c]).filter(Boolean).join(', ');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {wordType && (
        <div className="learn-meta">
          <span className="word-type">{wordType}</span>
          {desc && <span className="word-type-desc">({desc})</span>}
        </div>
      )}
      <div className="learn-meta">
        {ipa && <span className="word-ipa" style={{ marginTop: 0 }}>{ipa}</span>}
        <button className="learn-speak-btn" onClick={onSpeak} title="Phát âm tiếng Anh">🔊</button>
        <button className="learn-speak-btn learn-speak-slow-btn" onClick={onSpeakSlow} title="Phát âm tiếng Anh (chậm)">🐢</button>
        <button className="learn-speak-btn learn-speak-both-btn" onClick={onSpeakBoth} title="Phát âm Anh rồi Việt">🔊🇻🇳</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  LearnView
// ---------------------------------------------------------------------------
export interface LearnViewProps {
  active: boolean;
  currentWord: Vocab | undefined;
  currentIndex: number;
  totalWords: number;
  countdown: number;
  visitedIndices: Set<number>;
  isLastWord: boolean;
  onBackToDashboard: () => void;
  onPrevWord: () => void;
  onNextWord: () => void;
  onGoToIndex: (index: number) => void;
}

export function LearnView({
  active, currentWord, currentIndex, totalWords, countdown,
  visitedIndices, isLastWord,
  onBackToDashboard, onPrevWord, onNextWord, onGoToIndex,
}: LearnViewProps) {
  const [imageErrorWordId, setImageErrorWordId] = useState<string | null>(null);
  const hasImage = !!currentWord?.imageUrl && currentWord.wordId !== imageErrorWordId;

  // Chu kỳ phát âm tự động
  useSpeakCycle(currentWord, countdown, active);

  // ---- Thanh số từ với phân trang kiểu ... ----
  function buildNavItems(total: number, current: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const around = new Set(
      [0, total - 1, current - 1, current, current + 1].filter(i => i >= 0 && i < total)
    );
    const items: (number | '...')[] = [];
    let prev = -1;
    for (const i of Array.from(around).sort((a, b) => a - b)) {
      if (prev !== -1 && i - prev > 1) items.push('...');
      items.push(i);
      prev = i;
    }
    return items;
  }

  const navItems = buildNavItems(totalWords, currentIndex);

  function handleDots(itemIndex: number) {
    const left  = navItems[itemIndex - 1];
    const right = navItems[itemIndex + 1];
    if (typeof left === 'number' && typeof right === 'number') {
      onGoToIndex(Math.min(Math.max(Math.round((left + right) / 2), 0), totalWords - 1));
    }
  }

  return (
    <section className={`view learn-view ${active ? 'active' : ''}`}>
      <div className="learn-card">

        {/* Header */}
        <div className="learn-header">
          <span className="badge">Từ {currentIndex + 1}/{totalWords}</span>
          <span className="countdown-badge">⏱ {countdown}s</span>
          <button
            className="btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.85rem' }}
            onClick={onBackToDashboard}
          >
            ← Quay lại
          </button>
        </div>

        {/* Thanh số từ */}
        {totalWords > 0 && (
          <div className="learn-nav" style={{ justifyContent: 'center' }}>
            {navItems.map((item, idx) =>
              item === '...' ? (
                <button
                  key={`dots-${idx}`}
                  type="button"
                  className="question-nav-item question-nav-dots"
                  onClick={() => handleDots(idx)}
                  title="Nhảy tới"
                >
                  ···
                </button>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={[
                    'question-nav-item',
                    item === currentIndex ? 'current' : visitedIndices.has(item) ? 'visited' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => onGoToIndex(item)}
                  title={`Từ số ${item + 1}`}
                >
                  {item + 1}
                </button>
              )
            )}
          </div>
        )}

        {/* Nội dung thẻ từ */}
        {currentWord && (
          <div className="learn-body">
            {currentWord.topic && (
              <div className="learn-topic">📂 {currentWord.topic}</div>
            )}

            <div className="learn-image-frame">
              {hasImage ? (
                <img
                  key={currentWord.wordId}
                  src={currentWord.imageUrl}
                  alt={currentWord.englishWord}
                  onError={() => setImageErrorWordId(currentWord.wordId)}
                />
              ) : (
                <div className="learn-image-placeholder">
                  <span className="icon">🖼️</span>
                  <span>No image</span>
                </div>
              )}
            </div>

            <div className="learn-word-en">{currentWord.englishWord}</div>

            <WordMeta
              wordType={currentWord.wordType}
              ipa={currentWord.ipa}
              onSpeak={() => speak(currentWord.englishWord)}
              onSpeakSlow={() => speakSlow(currentWord.englishWord)}
              onSpeakBoth={() => speakWithVietnamese(currentWord.englishWord, currentWord.vietnameseMeaning)}
            />

            <div className="learn-divider" />

            <div className="learn-word-vi">{currentWord.vietnameseMeaning}</div>
          </div>
        )}

        {/* Footer */}
        <div className="learn-footer">
          <button className="btn btn-secondary" onClick={onPrevWord} disabled={currentIndex === 0}>
            ← Trước
          </button>
          {isLastWord ? (
            <button className="btn btn-primary" onClick={onBackToDashboard}>✓ Kết thúc</button>
          ) : (
            <button className="btn btn-primary" onClick={onNextWord}>Tiếp →</button>
          )}
        </div>

      </div>
    </section>
  );
}
