'use client';

import { useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

export interface UiFeedback {
  toast: ToastState | null;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  loading: boolean;
  loadingMessage: string;
  setLoading: (value: boolean) => void;
  setLoadingMessage: (message: string) => void;
}

/**
 * Hook dùng chung cho toast thông báo và overlay loading toàn cục.
 * Các hook nghiệp vụ khác nhận instance này qua tham số để gọi showToast/setLoading,
 * tránh phải khai báo lại state này ở nhiều nơi.
 */
export function useUiFeedback(): UiFeedback {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Đang tải...');

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 2800) => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), duration);
  }, []);

  return { toast, showToast, loading, loadingMessage, setLoading, setLoadingMessage };
}
