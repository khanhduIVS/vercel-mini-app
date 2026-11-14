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

/** View 2: thống kê + cấu hình buổi học. Full-screen, mobile-first. */
export function DashboardView({
  active, currentUser, stats, topics,
  selectedTopic, setSelectedTopic, wordCount, setWordCount,
  onLogout, onStartLearningSession, onRefreshDashboard,
}: DashboardViewProps) {
  const pct = stats?.progressPercentage ?? 0;
  const selectedTopicObj = topics.find((t) => t.topicId === selectedTopic);
  const topicWordCount = selectedTopicObj?.wordCount ?? null;

  return (
    <section className={`view-fullscreen ${active ? 'active' : ''}`}>
      <div className="fullscreen-card">

        {/* Header cố định */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 10px', flexShrink: 0, borderBottom: '1px solid #f0f0f0',
        }}>
          <h2 className="dash-username">📚 {currentUser}</h2>
          <button
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', minHeight: '44px' }}
            onClick={onLogout}
          >
            Đổi người
          </button>
        </div>

        {/* Vùng cuộn */}
        <div className="fullscreen-scroll">

          {/* Progress bar */}
          <div className="dash-progress-wrap" style={{ marginTop: '12px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
            <div className="dash-select-wrap">
              <label htmlFor="topicSelect">
                📂 Chủ đề
                {selectedTopic !== 'all' && topicWordCount !== null && (
                  <span style={{ fontWeight: 400, color: '#a0aec0', marginLeft: '6px' }}>
                    (có {topicWordCount.toLocaleString('en-US')} từ)
                  </span>
                )}
              </label>
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

        </div>

        {/* Footer cố định: nút HỌC NGAY */}
        <div className="fullscreen-footer">
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

      </div>
    </section>
  );
}
