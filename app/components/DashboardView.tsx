'use client';

import type { UserStats } from '@/lib/types';

export interface DashboardViewProps {
  active: boolean;
  currentUser: string;
  stats: UserStats | null;
  topics: string[];
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  wordCount: number;
  setWordCount: (count: number) => void;
  onLogout: () => void;
  onStartLearningSession: () => void;
  onRefreshDashboard: () => void;
}

/**
 * View 2: thống kê học tập + cấu hình & bắt đầu buổi học.
 * Chức năng "Thêm từ mới" và "Quản lý từ vựng" đã di chuyển sang trang /admin.
 */
export function DashboardView({
  active, currentUser, stats, topics,
  selectedTopic, setSelectedTopic, wordCount, setWordCount,
  onLogout, onStartLearningSession, onRefreshDashboard,
}: DashboardViewProps) {
  return (
    <section className={`view ${active ? 'active' : ''}`}>
      <div className="card">
        <div className="row-between">
          <h2 className="app-title" style={{ textAlign: 'left', margin: 0 }}>
            Xin chào, {currentUser}!
          </h2>
          <button className="btn btn-secondary" onClick={onLogout}>Đổi người</button>
        </div>

        <div className="stats-grid">
          <div className="stat-box bg-blue">
            <div className="num">{stats?.totalLearned ?? 0}</div>
            <div className="lbl">Từ đã học</div>
          </div>
          <div className="stat-box bg-yellow">
            <div className="num">{stats?.dueForReview ?? 0}</div>
            <div className="lbl">Cần ôn</div>
          </div>
          <div className="stat-box bg-green">
            <div className="num">{stats?.accuracy ?? 0}%</div>
            <div className="lbl">Tỷ lệ đúng</div>
          </div>
          <div className="stat-box bg-purple">
            <div className="num">{stats?.progressPercentage ?? 0}%</div>
            <div className="lbl">Tiến độ</div>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${stats?.progressPercentage ?? 0}%` }}
          />
        </div>

        <div className="mt-24">
          <label className="field-label" htmlFor="topicSelect">📂 Chủ đề (để trống = tất cả)</label>
          <select
            id="topicSelect"
            className="input-field"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            <option value="all">✨ Tất cả chủ đề</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="mt-16">
          <label className="field-label" htmlFor="wordCount">📊 Số từ muốn học</label>
          <input
            id="wordCount"
            type="number"
            className="input-field"
            value={wordCount}
            min={1}
            onChange={(e) => setWordCount(Math.max(1, parseInt(e.target.value) || 5))}
          />
        </div>

        <button className="btn btn-primary btn-block mt-16" onClick={onStartLearningSession}>
          🎯 HỌC NGAY
        </button>

        <div className="mt-16">
          <button className="btn btn-secondary btn-block" onClick={onRefreshDashboard}>🔄 Làm mới</button>
        </div>

        <div className="card mt-24" style={{ boxShadow: 'none', background: '#f7fafc', padding: '18px' }}>
          <div className="row-between">
            <span className="text-muted">Tổng từ vựng có sẵn</span>
            <strong>{stats?.totalAvailable ?? 0}</strong>
          </div>
          <div className="row-between mt-16">
            <span className="text-muted">Box 1 (mới/đang học)</span>
            <strong>{stats?.box1Count ?? 0}</strong>
          </div>
          <div className="row-between mt-16">
            <span className="text-muted">Box 2 (quen dần)</span>
            <strong>{stats?.box2Count ?? 0}</strong>
          </div>
          <div className="row-between mt-16">
            <span className="text-muted">Box 3 (đã thuộc)</span>
            <strong>{stats?.box3Count ?? 0}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
