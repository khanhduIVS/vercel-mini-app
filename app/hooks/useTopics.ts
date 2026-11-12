'use client';

import { useCallback, useState } from 'react';
import { fetchTopics } from '@/app/services/topicsService';

export interface UseTopicsResult {
  topics: string[];
  loadTopics: () => Promise<void>;
}

/**
 * Hook dùng chung để tải danh sách chủ đề từ vựng.
 * Dùng ở cả Dashboard (dropdown chọn chủ đề học) và Words Manager (filter bảng quản lý).
 * Lỗi được bỏ qua âm thầm (giữ nguyên hành vi gốc) vì đây là dữ liệu phụ trợ, không chặn luồng chính.
 */
export function useTopics(): UseTopicsResult {
  const [topics, setTopics] = useState<string[]>([]);

  const loadTopics = useCallback(async () => {
    try {
      const data = await fetchTopics();
      setTopics(data);
    } catch {
      /* silent */
    }
  }, []);

  return { topics, loadTopics };
}
