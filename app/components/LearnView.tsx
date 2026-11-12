'use client';

import type { Vocab } from '@/lib/types';
import { speak } from '@/app/hooks/useLearnSession';

const WORD_TYPE_MAP: Record<string, string> = {
  'n': 'Danh từ', 'v': 'Động từ', 'adj': 'Tính từ', 'adv': 'Trạng từ',
  'pron': 'Đại từ', 'prep': 'Giới từ', 'conj': 'Liên từ', 'interj': 'Thán từ',
  'det': 'Từ hạn định', 'art': 'Mạo từ', 'num': 'Số từ',
  'aux': 'Trợ động từ', 'modal': 'Động từ khuyết thiếu',
  'phr': 'Cụm động từ', 'abbr': 'Từ viết tắt',
};

function getWordTypeHtml(wordType: string) {
  if (!wordType) return null;
  const desc = WORD_TYPE_MAP[wordType] || '';
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
  onBackToDashboard: () => void;
  onPrevWord: () => void;
  onNextWord: () => void;
}

/** View 3: flashcard học từ vựng với đếm ngược tự động chuyển từ kế tiếp. */
export function LearnView({
  active, currentWord, currentIndex, totalWords, countdown,
  onBackToDashboard, onPrevWord, onNextWord,
}: LearnViewProps) {
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

        {currentWord && (
          <div className="mt-16">
            <div className="word-card">
              {currentWord.topic && currentWord.topic !== 'Chung' && (
                <div className="word-topic">📂 {currentWord.topic}</div>
              )}
              {currentWord.imageUrl && (
                <img
                  className="word-image"
                  src={currentWord.imageUrl}
                  alt={currentWord.englishWord}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
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
              <button className="btn btn-primary" onClick={onNextWord}>
                Từ kế tiếp →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
