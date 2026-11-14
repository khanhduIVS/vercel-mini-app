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

/** View 1: chọn người học có sẵn hoặc tạo người dùng mới. */
export function UserSelectionView({
  active, users, currentUser, onSelectUser,
  newUserName, setNewUserName, createNewUser, startLearning,
}: UserSelectionViewProps) {
  return (
    <section className={`view ${active ? 'active' : ''}`}>
      <div className="card">
        <div className="logo">📚</div>
        <h1 className="app-title">Ứng dụng học từ vựng</h1>
        <p className="app-subtitle">Học tiếng Anh vui vẻ và hiệu quả</p>

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

        <div className="divider"><span>hoặc</span></div>

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
        <button className="btn btn-secondary btn-block mt-16" onClick={createNewUser}>
          Tạo &amp; vào học
        </button>

        <button
          className="btn btn-primary btn-block mt-24"
          onClick={startLearning}
          disabled={!currentUser}
        >
          ▶ Bắt đầu học
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
    </section>
  );
}
