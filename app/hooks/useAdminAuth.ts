'use client';

import { useEffect, useState } from 'react';

const SESSION_KEY = 'admin_logged_in';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

export interface UseAdminAuthResult {
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

/**
 * Hook xác thực đơn giản phía client cho trang /admin.
 * User/pass tạm thời là admin/admin, kiểm tra cứng trong code (không gọi API, không mã hóa).
 * Trạng thái đăng nhập lưu trong sessionStorage — mất khi đóng tab/trình duyệt.
 * Đây CHỈ là rào chắn tạm ở giao diện, không phải cơ chế bảo mật thật sự
 * (ai gọi trực tiếp API quản lý từ vựng vẫn không bị chặn).
 */
export function useAdminAuth(): UseAdminAuthResult {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(sessionStorage.getItem(SESSION_KEY) === 'true');
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const ok = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsLoggedIn(true);
    }
    return ok;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  };

  return { isLoggedIn, login, logout };
}
