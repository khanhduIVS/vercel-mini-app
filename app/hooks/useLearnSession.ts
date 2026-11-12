'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLearnSession } from '@/app/services/learnService';
import type { Vocab } from '@/lib/types';
import type { UiFeedback } from './useUiFeedback';
import type { AppView } from './useUserFlow';

const COUNTDOWN_SECONDS = 30;

export function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export interface UseLearnSessionResult {
  wordList: Vocab[];
  currentIndex: number;
  currentWord: Vocab | undefined;
  countdown: number;
  /** Trả về true nếu lấy được danh sách từ và sẵn sàng chuyển sang view học. `selectedTopicId` là topicId hoặc 'all'. */
  startLearningSession: (userName: string, wordCount: number, selectedTopicId: string) => Promise<boolean>;
  nextWord: () => void;
  prevWord: () => void;
  stopCountdown: () => void;
}

/**
 * Hook quản lý phiên học flashcard: danh sách từ, chỉ số hiện tại, đếm ngược tự động next,
 * và phát âm từ khi hiển thị.
 * `currentView` được truyền vào để timer chỉ chạy khi đang ở view 'learn'.
 */
export function useLearnSession(ui: UiFeedback, currentView: AppView): UseLearnSessionResult {
  const [wordList, setWordList] = useState<Vocab[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopCountdownRef = useRef(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  });

  const startLearningSession = async (userName: string, wordCount: number, selectedTopicId: string): Promise<boolean> => {
    const topicId = selectedTopicId === 'all' ? '' : selectedTopicId;
    ui.setLoading(true);
    ui.setLoadingMessage('Đang chuẩn bị bài học...');
    try {
      const data = await fetchLearnSession(userName, wordCount, topicId);
      if (!data.words || data.words.length === 0) {
        ui.showToast('Chưa có từ nào trong kho. Vui lòng thêm từ vựng.', 'info');
        return false;
      }
      setWordList(data.words);
      setCurrentIndex(0);
      return true;
    } catch {
      ui.showToast('Không thể bắt đầu học', 'error');
      return false;
    } finally {
      ui.setLoading(false);
    }
  };

  // Countdown timer: tự động sang từ kế tiếp khi hết giờ
  useEffect(() => {
    stopCountdownRef.current();
    if (currentView !== 'learn' || wordList.length === 0) return;

    let remaining = COUNTDOWN_SECONDS;
    setCountdown(remaining);

    countdownTimerRef.current = setInterval(() => {
      remaining--;
      setCountdown(Math.max(0, remaining));
      if (remaining <= 0) {
        stopCountdownRef.current();
        setCurrentIndex((idx) => (idx + 1) % wordList.length);
      }
    }, 1000);

    return () => stopCountdownRef.current();
  }, [currentIndex, currentView, wordList.length]);

  // Phát âm từ khi từ hiện tại thay đổi
  useEffect(() => {
    if (currentView === 'learn' && wordList[currentIndex]) {
      speak(wordList[currentIndex].englishWord);
    }
  }, [currentIndex, currentView, wordList]);

  const nextWord = useCallback(() => {
    if (wordList.length === 0) return;
    setCurrentIndex((idx) => (idx + 1) % wordList.length);
  }, [wordList.length]);

  const prevWord = useCallback(() => {
    setCurrentIndex((idx) => (idx > 0 ? idx - 1 : 0));
  }, []);

  const stopCountdown = useCallback(() => stopCountdownRef.current(), []);

  return {
    wordList,
    currentIndex,
    currentWord: wordList[currentIndex],
    countdown,
    startLearningSession,
    nextWord,
    prevWord,
    stopCountdown,
  };
}
