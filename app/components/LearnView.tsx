'use client';

import { useState } from 'react';
import type { Vocab } from '@/lib/types';
import { speak } from '@/app/hooks/useLearnSession';
import { WORD_TYPE_MAP, parseWordTypeCodes, filterKnownWordTypeCodes } from '@/app/lib/wordTypes';

/**
 * Hiển thị loại từ: wordType có thể là 1 mã đơn ("adj") hoặc nhiều mã ghép bởi dấu phẩy ("n, v").
 * Hiện mã gốc (nguyên văn như đang lưu) kèm mô tả tiếng Việt cho từng mã hợp lệ, nối bởi ", ".
 * Mã lạ không khớp danh sách chuẩn (ví dụ "to", lỗi chính tả) không có mô tả, bị bỏ qua phần mô tả.
 */
function getWordTypeHtml(wordType: string) {
  if (!wordType) return null;
  const codes = filterKnownWordTypeCodes(parseWordTypeCodes(wordType));
  const desc = codes.map((c) => WORD_TYPE_MAP[c]).filter(Boolean).join(', ');
  return (
    <>
      <span className="word-type">{wordType}</span>
      {desc && <span className="word-type-desc">({desc})</span>}
    </>
  );
}

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

/** View 3: flashcard học từ vựng với đếm ngược tự động chuyển từ kế tiếp. */
export function LearnView({
  active, currentWord, currentIndex, totalWords, countdown,
  visitedIndices, isLastWord,
  onBackToDashboard, onPrevWord, onNextWord, onGoToIndex,
}: LearnViewProps) {
  // Theo dõi ảnh của từ nào đang lỗi load, để hiện placeholder "no image" thay vì ảnh vỡ.
  // Dùng wordId làm key nên tự "reset" đúng khi chuyển sang từ khác (không cần clear thủ công).
  const [imageErrorWordId, setImageErrorWordId] = useState<string | null>(null);
  const hasImage = !!currentWord?.imageUrl && currentWord.wordId !== imageErrorWordId;

  return (
    <section className={`view ${active ? 'active' : ''}`}>
      <div className="card">
        <div className="row-between">
          <span className="badge">
            Từ {currentIndex + 1}/{totalWords}
          </span>
          <span className="countdown-badge">⏱ {countdown}s</span>
          <button className="btn btn-secondary" onClick={onBackToDashboard}>← Quay lại</button>
        </div>

        {totalWords > 0 && (
          <div className="question-nav mt-16">
            {Array.from({ length: totalWords }, (_, idx) => {
              const isCurrent = idx === currentIndex;
              const isVisited = visitedIndices.has(idx);
              const className = [
                'question-nav-item',
                isCurrent ? 'current' : isVisited ? 'visited' : '',
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={idx}
                  type="button"
                  className={className}
                  onClick={() => onGoToIndex(idx)}
                  title={`Từ số ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        )}

        {currentWord && (
          <div className="mt-16">
            <div className="word-card">
              {currentWord.topic && (
                <div className="word-topic">📂 {currentWord.topic}</div>
              )}
              <div className="word-image-frame">
                {hasImage ? (
                  <img
                    key={currentWord.wordId}
                    className="word-image"
                    src={currentWord.imageUrl}
                    alt={currentWord.englishWord}
                    onError={() => setImageErrorWordId(currentWord.wordId)}
                  />
                ) : (
                  <div className="word-image-placeholder">
                    <span className="icon">🖼️</span>
                    <span>No image</span>
                  </div>
                )}
              </div>
              <div className="word-en">{currentWord.englishWord}</div>
              <div className="word-type-row">{getWordTypeHtml(currentWord.wordType)}</div>
              {currentWord.ipa && <div className="word-ipa">{currentWord.ipa}</div>}
              <button
                className="speak-btn"
                onClick={() => speak(currentWord.englishWord)}
                title="Nghe phát âm"
              >
                🔊
              </button>
              <div className="word-divider" />
              <div className="word-vi">{currentWord.vietnameseMeaning}</div>
            </div>

            <div className="nav-buttons">
              <button className="btn btn-secondary" onClick={onPrevWord} disabled={currentIndex === 0}>
                ← Từ trước đó
              </button>
              {isLastWord ? (
                <button className="btn btn-primary" onClick={onBackToDashboard}>
                  ✓ Kết thúc
                </button>
              ) : (
                <button className="btn btn-primary" onClick={onNextWord}>
                  Từ kế tiếp →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
