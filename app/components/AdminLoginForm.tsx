'use client';

import { useState } from 'react';

export interface AdminLoginFormProps {
  onLogin: (username: string, password: string) => boolean;
  onLoginFailed: () => void;
}

/** Form đăng nhập trang quản trị /admin (xác thực tạm phía client). */
export function AdminLoginForm({ onLogin, onLoginFailed }: AdminLoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    const ok = onLogin(username.trim(), password);
    if (!ok) onLoginFailed();
  };

  return (
    <div className="card">
      <div className="logo">🔐</div>
      <h1 className="app-title">Đăng nhập quản trị</h1>
      <p className="app-subtitle">Khu vực quản lý từ vựng</p>

      <label className="field-label" htmlFor="adminUsername">Tên đăng nhập</label>
      <input
        id="adminUsername"
        className="input-field"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
      />

      <label className="field-label mt-16" htmlFor="adminPassword">Mật khẩu</label>
      <input
        id="adminPassword"
        className="input-field"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
      />

      <button className="btn btn-primary btn-block mt-24" onClick={handleSubmit}>
        Đăng nhập
      </button>
    </div>
  );
}
