'use client';

import { useState } from 'react';
import type { Vocab } from '@/lib/types';
import { speak } from '@/app/hooks/useLearnSession';
import { WORD_TYPE_MAP, parseWordTypeCodes, filterKnownWordTypeCodes } from '@/app/lib/wordTypes';

function WordMeta({ wordType, ipa, onSpeak }: { wordType: string; ipa: string; onSpeak: () => void }) {
  const codes = filterKnownWordTypeCodes(parseWordTypeCodes(wordType));
  const desc = codes.map((c) => WORD_TYPE_MAP[c]).filter(Boolean).join(', ');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {/* Dòng 1: loại từ */}
      {wordType && (
        <div className="learn-meta">
          <span className="word-type">{wordType}</span>
          {desc && <span className="word-type-desc">({desc})</span>}
        </div>
      )}
      {/* Dòng 2: phiên âm + nút phát âm */}
      <div className="learn-meta">
        {ipa && <span className="word-ipa" style={{ marginTop: 0 }}>{ipa}</span>}
        <button className="learn-speak-btn" onClick={onSpeak} title="Nghe phát âm">🔊</button>
      </div>
    </div>
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

export function LearnView({
  active, currentWord, currentIndex, totalWords, countdown,
  visitedIndices, isLastWord,
  onBackToDashboard, onPrevWord, onNextWord, onGoToIndex,
}: LearnViewProps) {
  const [imageErrorWordId, setImageErrorWordId] = useState<string | null>(null);
  const hasImage = !!currentWord?.imageUrl && currentWord.wordId !== imageErrorWordId;

  return (
    <section className={`view learn-view ${active ? 'active' : ''}`}>
      <div className="learn-card">

        {/* Header */}
        <div className="learn-header">
          <span className="badge">Từ {currentIndex + 1}/{totalWords}</span>
          <span className="countdown-badge">⏱ {countdown}s</span>
          <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '0.85rem' }} onClick={onBackToDashboard}>
            ← Quay lại
          </button>
        </div>

        {/* Thanh số từ */}
        {totalWords > 0 && (
          <div className="learn-nav">
            {Array.from({ length: totalWords }, (_, idx) => (
              <button
                key={idx}
                type="button"
                className={[
                  'question-nav-item',
                  idx === currentIndex ? 'current' : visitedIndices.has(idx) ? 'visited' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => onGoToIndex(idx)}
                title={`Từ số ${idx + 1}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}

        {/* Nội dung thẻ từ */}
        {currentWord && (
          <div className="learn-body">
            {currentWord.topic && (
              <div className="learn-topic">📂 {currentWord.topic}</div>
            )}

            {/* Khung ảnh — luôn hiển thị (placeholder nếu chưa có ảnh) */}
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

            {/* Từ tiếng Anh */}
            <div className="learn-word-en">{currentWord.englishWord}</div>

            {/* Loại từ + IPA + nút phát âm — 1 dòng ngang */}
            <WordMeta
              wordType={currentWord.wordType}
              ipa={currentWord.ipa}
              onSpeak={() => speak(currentWord.englishWord)}
            />

            <div className="learn-divider" />

            {/* Nghĩa tiếng Việt */}
            <div className="learn-word-vi">{currentWord.vietnameseMeaning}</div>
          </div>
        )}

        {/* Footer: 2 nút điều hướng */}
        <div className="learn-footer">
          <button
            className="btn btn-secondary"
            onClick={onPrevWord}
            disabled={currentIndex === 0}
          >
            ← Trước
          </button>
          {isLastWord ? (
            <button className="btn btn-primary" onClick={onBackToDashboard}>
              ✓ Kết thúc
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onNextWord}>
              Tiếp →
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
