'use client';

import { useCallback, useState } from 'react';
import { fetchUserStats } from '@/app/services/statsService';
import type { UserStats } from '@/lib/types';
import type { UiFeedback } from './useUiFeedback';

export interface UseDashboardResult {
  stats: UserStats | null;
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  wordCount: number;
  setWordCount: (count: number) => void;
  loadDashboard: (userName: string) => Promise<void>;
  refreshDashboard: (userName: string) => void;
}

/** Hook quản lý state Dashboard: thống kê học tập, chủ đề/số từ muốn học đã chọn. */
export function useDashboard(ui: UiFeedback): UseDashboardResult {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [wordCount, setWordCount] = useState(5);

  const loadDashboard = useCallback(async (userName: string) => {
    ui.setLoading(true);
    ui.setLoadingMessage('Đang tải thống kê...');
    try {
      const data = await fetchUserStats(userName);
      setStats(data);
    } catch {
      ui.showToast('Không thể tải thống kê', 'error');
    } finally {
      ui.setLoading(false);
    }
  }, [ui]);

  const refreshDashboard = (userName: string) => {
    loadDashboard(userName);
    ui.showToast('Đã làm mới dữ liệu', 'success');
  };

  return { stats, selectedTopic, setSelectedTopic, wordCount, setWordCount, loadDashboard, refreshDashboard };
}
