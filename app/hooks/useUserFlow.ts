'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchUsers, createOrGetUser } from '@/app/services/usersService';
import type { UiFeedback } from './useUiFeedback';

export type AppView = 'user' | 'dashboard' | 'learn';

export interface UseUserFlowResult {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentUser: string;
  users: string[];
  newUserName: string;
  setNewUserName: (name: string) => void;
  loadUserList: () => Promise<void>;
  createNewUser: () => Promise<void>;
  startLearning: () => void;
  onSelectUser: (name: string) => void;
  logout: () => void;
}

/**
 * Hook quản lý luồng chọn/tạo người dùng và điều hướng view tổng (user/dashboard/learn).
 * `onEnterApp` được gọi khi vào app (chọn user có sẵn hoặc tạo mới) để page.tsx
 * kích hoạt side-effect ở hook khác (load dashboard, load topics).
 * Lưu ý: việc dừng side-effect khác (countdown, speech) trước khi logout do page.tsx
 * tự bọc thêm quanh `logout` trả về từ hook này, để tránh phụ thuộc vòng giữa các hook.
 */
export function useUserFlow(
  ui: UiFeedback,
  onEnterApp: (userName: string) => void
) {
  const [currentView, setCurrentView] = useState<AppView>('user');
  const [currentUser, setCurrentUser] = useState('');
  const [users, setUsers] = useState<string[]>([]);
  const [newUserName, setNewUserName] = useState('');

  const loadUserList = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      ui.showToast('Không thể tải danh sách người dùng', 'error');
    }
  }, [ui]);

  useEffect(() => {
    loadUserList();
  }, [loadUserList]);

  const enterApp = useCallback((userName: string) => {
    setCurrentUser(userName);
    setCurrentView('dashboard');
    onEnterApp(userName);
  }, [onEnterApp]);

  const createNewUser = async () => {
    const name = newUserName.trim();
    if (!name) { ui.showToast('Vui lòng nhập tên người dùng', 'error'); return; }

    ui.setLoading(true);
    ui.setLoadingMessage('Đang tạo người dùng...');
    try {
      const data = await createOrGetUser(name);
      setNewUserName('');
      ui.showToast(`Đã chọn người dùng "${data.userName}"`, 'success');
      enterApp(data.userName);
    } catch (e) {
      ui.showToast(e instanceof Error ? e.message : 'Không thể tạo người dùng', 'error');
    } finally {
      ui.setLoading(false);
    }
  };

  const startLearning = () => {
    if (!currentUser) return;
    enterApp(currentUser);
  };

  // Chỉ gọi từ dropdown chọn user; không enter app ngay (giữ hành vi gốc)
  const onSelectUser = (name: string) => {
    setCurrentUser(name);
  };

  const logout = () => {
    setCurrentUser('');
    setCurrentView('user');
    loadUserList();
  };

  return {
    currentView, setCurrentView,
    currentUser, users,
    newUserName, setNewUserName,
    loadUserList, createNewUser, startLearning, onSelectUser, logout,
  };
}
