'use client';

export interface UserSelectionViewProps {
  active: boolean;
  users: string[];
  currentUser: string;
  onSelectUser: (name: string) => void;
  newUserName: string;
  setNewUserName: (name: string) => void;
  createNewUser: () => void;
  startLearning: () => void;
}

/** View 1: chọn người học có sẵn hoặc tạo người dùng mới. Full-screen, mobile-first. */
export function UserSelectionView({
  active, users, currentUser, onSelectUser,
  newUserName, setNewUserName, createNewUser, startLearning,
}: UserSelectionViewProps) {
  return (
    <section className={`view-fullscreen ${active ? 'active' : ''}`}>
      <div className="fullscreen-card">

        {/* Vùng cuộn: logo + form */}
        <div className="fullscreen-scroll">
          <div style={{ textAlign: 'center', paddingTop: '12px', paddingBottom: '8px' }}>
            <div className="logo">📚</div>
            <h1 className="app-title">Ứng dụng học từ vựng</h1>
            <p className="app-subtitle">Học tiếng Anh vui vẻ và hiệu quả</p>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label className="field-label" htmlFor="userSelect">👤 Chọn người học</label>
            <select
              id="userSelect"
              className="input-field"
              value={currentUser}
              onChange={(e) => onSelectUser(e.target.value)}
            >
              <option value="">-- Chọn tên --</option>
              {users.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className="divider"><span>hoặc</span></div>

          <div style={{ marginBottom: '8px' }}>
            <label className="field-label" htmlFor="newUserName">➕ Tạo người dùng mới</label>
            <input
              id="newUserName"
              className="input-field"
              type="text"
              maxLength={20}
              placeholder="Nhập tên mới..."
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createNewUser()}
            />
          </div>

          <button
            className="btn btn-secondary btn-block"
            style={{ marginBottom: '16px' }}
            onClick={createNewUser}
          >
            Tạo &amp; vào học
          </button>

          {/* stats-grid tạm ẩn
          <div className="stats-grid">
            <div className="stat-box bg-green">
              <div className="num">{users.length}</div>
              <div className="lbl">Người học</div>
            </div>
            <div className="stat-box bg-blue">
              <div className="num">20+</div>
              <div className="lbl">Từ vựng mẫu</div>
            </div>
          </div>
          */}
        </div>

        {/* Footer cố định: nút bắt đầu học */}
        <div className="fullscreen-footer">
          <button
            className="btn btn-primary btn-block"
            onClick={startLearning}
            disabled={!currentUser}
          >
            ▶ Bắt đầu học
          </button>
        </div>

      </div>
    </section>
  );
}
