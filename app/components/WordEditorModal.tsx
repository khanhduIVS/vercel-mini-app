'use client';

import type { UseWordEditorResult } from '@/app/hooks/useWordEditor';
import { WORD_TYPE_OPTIONS, parseWordTypeCodes, filterKnownWordTypeCodes, buildWordTypeString } from '@/app/lib/wordTypes';
import type { Topic } from '@/lib/types';

export interface WordEditorModalProps {
  editor: UseWordEditorResult;
  topics: Topic[];
  onSave: () => void;
  onDelete: () => void;
}

/**
 * Modal "Chỉnh sửa từ": sửa phiên âm/loại từ/nghĩa/chủ đề của 1 từ vựng, hoặc xóa từ.
 * Ô "Link ảnh" (và nút tìm ảnh Unsplash) đang bị ẩn khỏi giao diện theo yêu cầu —
 * dữ liệu imageUrl hiện có của từ vẫn được giữ nguyên trong DB, không bị xóa.
 */
export function WordEditorModal({ editor, topics, onSave, onDelete }: WordEditorModalProps) {
  const {
    showWordEditor, editEnglish,
    editIpa, setEditIpa, editWordType, setEditWordType,
    editMeaning, setEditMeaning, editTopic, setEditTopic,
    closeWordEditor,
  } = editor;

  // wordType trong DB có thể là 1 mã đơn ("adj") hoặc nhiều mã ghép bởi dấu phẩy ("n, v").
  // Chỉ các mã khớp danh sách chuẩn mới được tick; mã lạ (ví dụ "to", lỗi chính tả) bị bỏ qua
  // khi hiển thị — và sẽ bị loại khỏi dữ liệu nếu người dùng bấm Lưu sau khi sửa checkbox này.
  const selectedWordTypeCodes = new Set(filterKnownWordTypeCodes(parseWordTypeCodes(editWordType)));

  const toggleWordType = (code: string) => {
    const next = new Set(selectedWordTypeCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setEditWordType(buildWordTypeString(next));
  };

  return (
    <div className={`overlay ${showWordEditor ? 'active' : ''}`} style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: '480px' }}>
      <div className="modal-scroll">
        <div className="row-between">
          <h3 style={{ margin: 0 }}>✏️ Chỉnh sửa từ</h3>
          <button className="btn btn-secondary" onClick={closeWordEditor}>✕</button>
        </div>

        <div className="mt-16">
          <label className="field-label">Từ tiếng Anh</label>
          <input className="input-field" type="text" value={editEnglish} readOnly />
        </div>
        <div className="mt-16">
          <label className="field-label">Phiên âm</label>
          <input
            className="input-field"
            type="text"
            value={editIpa}
            onChange={(e) => setEditIpa(e.target.value)}
          />
        </div>
        <div className="mt-16">
          <label className="field-label">Loại từ</label>
          <div className="word-type-checkbox-grid">
            {WORD_TYPE_OPTIONS.map((opt) => (
              <label key={opt.code} className="word-type-checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedWordTypeCodes.has(opt.code)}
                  onChange={() => toggleWordType(opt.code)}
                />
                <span>{opt.label} ({opt.code})</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-16">
          <label className="field-label">Nghĩa tiếng Việt</label>
          <textarea
            className="input-field"
            rows={1}
            placeholder="Nhập nghĩa tiếng Việt"
            value={editMeaning}
            onChange={(e) => setEditMeaning(e.target.value)}
            style={{ minHeight: 'auto', padding: '13px 16px', fontFamily: 'inherit', fontSize: '16px' }}
          />
        </div>
        <div className="mt-16">
          <label className="field-label">Chủ đề</label>
          <select
            className="input-field"
            value={editTopic}
            onChange={(e) => setEditTopic(e.target.value)}
          >
            <option value="">(chưa phân loại)</option>
            {topics.map((t) => (
              <option key={t.topicId} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Link ảnh: ẩn khỏi giao diện chỉnh sửa theo yêu cầu — dữ liệu imageUrl hiện có vẫn được
            giữ nguyên, không bị xóa, chỉ không hiển thị/sửa được ở đây nữa. */}

        <div className="modal-actions mt-16">
          <button className="btn btn-secondary" onClick={closeWordEditor}>Hủy</button>
          <button className="btn btn-primary" onClick={onSave}>Lưu thay đổi</button>
          <button className="btn btn-danger" onClick={onDelete}>🗑️ Xóa từ</button>
        </div>
      </div>
      </div>
    </div>
  );
}
