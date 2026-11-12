'use client';

import type { ToastState } from '@/app/hooks/useUiFeedback';

export interface ToastProps {
  toast: ToastState | null;
}

/** Hiện thông báo toast ở góc màn hình, hỗ trợ message nhiều dòng (phân tách bởi \n). */
export function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`}>
      {toast.message.split('\n').map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
