'use client';

import type { UserStats, Topic } from '@/lib/types';

/** Format số có dấu phẩy ngăn cách hàng nghìn: 3498 → 3,498 */
const fmt = (n: number) => n.toLocaleString('en-US');

export interface DashboardViewProps {
  active: boolean;
  currentUser: string;
  stats: UserStats | null;
  topics: Topic[];
  selectedTopic: string;
  setSelectedTopic: (topicId: string) => void;
  wordCount: number;
  setWordCount: (count: number) => void;
  onLogout: () => void;
  onStartLearningSession: () => void;
  onRefreshDashboard: () => void;
}

export function DashboardView({
  active, currentUser, stats, topics,
  selectedTopic, setSelectedTopic, wordCount, setWordCount,
  onLogout, onStartLearningSession, onRefreshDashboard,
}: DashboardViewProps) {
  const pct = stats?.progressPercentage ?? 0;

  return (
    <section className={`view ${active ? 'active' : ''}`}>
      <div className="card">

        {/* Header */}
        <div className="dash-header">
          <h2 className="dash-username">📚 Xin chào, {currentUser}!</h2>
          <button
            className="btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.85rem' }}
            onClick={onLogout}
          >
            Đổi người
          </button>
        </div>

        {/* Progress bar */}
        <div className="dash-progress-wrap">
          <div className="dash-progress-label">
            <span>Tiến độ học</span>
            <strong>{pct}% · {fmt(stats?.totalLearned ?? 0)}/{fmt(stats?.totalAvailable ?? 0)} từ</strong>
          </div>
          <div className="dash-progress-bar">
            <div className="dash-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* 4 stat */}
        <div className="dash-stats">
          <div className="dash-stat">
            <div className="num">{fmt(stats?.totalLearned ?? 0)}</div>
            <div className="lbl">Đã học</div>
          </div>
          <div className="dash-stat">
            <div className="num">{fmt(stats?.dueForReview ?? 0)}</div>
            <div className="lbl">Cần ôn</div>
          </div>
          <div className="dash-stat">
            <div className="num">{stats?.accuracy ?? 0}%</div>
            <div className="lbl">Tỷ lệ đúng</div>
          </div>
          <div className="dash-stat">
            <div className="num">{fmt(stats?.totalAvailable ?? 0)}</div>
            <div className="lbl">Tổng kho</div>
          </div>
        </div>

        {/* Box distribution */}
        <div className="dash-boxes">
          <div className="dash-box-item">
            <span className="dash-box-dot b1" />
            <span>Box 1 · <strong>{fmt(stats?.box1Count ?? 0)}</strong></span>
          </div>
          <span className="dash-box-sep">|</span>
          <div className="dash-box-item">
            <span className="dash-box-dot b2" />
            <span>Box 2 · <strong>{fmt(stats?.box2Count ?? 0)}</strong></span>
          </div>
          <span className="dash-box-sep">|</span>
          <div className="dash-box-item">
            <span className="dash-box-dot b3" />
            <span>Box 3 · <strong>{fmt(stats?.box3Count ?? 0)}</strong></span>
          </div>
        </div>

        {/* 2 select riêng dòng */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
          <div className="dash-select-wrap">
            <label htmlFor="topicSelect">📂 Chủ đề</label>
            <select
              id="topicSelect"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">Tất cả</option>
              {topics.map((t) => (
                <option key={t.topicId} value={t.topicId}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="dash-select-wrap">
            <label htmlFor="wordCount">📊 Số từ</label>
            <select
              id="wordCount"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
            >
              {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((n) => (
                <option key={n} value={n}>{n} từ</option>
              ))}
            </select>
          </div>
        </div>

        {/* Nút học + refresh */}
        <div className="dash-footer">
          <button className="btn btn-primary btn-block" onClick={onStartLearningSession}>
            🎯 HỌC NGAY
          </button>
          {/* Nút refresh tạm ẩn
          <button
            className="dash-refresh-btn"
            onClick={onRefreshDashboard}
            title="Làm mới thống kê"
          >
            🔄
          </button>
          */}
        </div>

      </div>
    </section>
  );
}
