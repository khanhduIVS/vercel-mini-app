'use client';

import type { UseWordEditorResult } from '@/app/hooks/useWordEditor';

export interface WordEditorModalProps {
  editor: UseWordEditorResult;
  onSave: () => void;
  onDelete: () => void;
  onFetchImageFromUnsplash: () => void;
}

/** Modal "Chỉnh sửa từ": sửa phiên âm/loại từ/nghĩa/chủ đề/ảnh của 1 từ vựng, hoặc xóa từ. */
export function WordEditorModal({ editor, onSave, onDelete, onFetchImageFromUnsplash }: WordEditorModalProps) {
  const {
    showWordEditor, editEnglish,
    editIpa, setEditIpa, editWordType, setEditWordType,
    editMeaning, setEditMeaning, editTopic, setEditTopic,
    editImageUrl, setEditImageUrl, closeWordEditor,
  } = editor;

  return (
    <div className={`overlay ${showWordEditor ? 'active' : ''}`} style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
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
          <select
            className="input-field"
            value={editWordType}
            onChange={(e) => setEditWordType(e.target.value)}
          >
            <option value="">(trống)</option>
            <option value="n">Danh từ (n)</option>
            <option value="v">Động từ (v)</option>
            <option value="adj">Tính từ (adj)</option>
            <option value="adv">Trạng từ (adv)</option>
            <option value="pron">Đại từ (pron)</option>
            <option value="prep">Giới từ (prep)</option>
            <option value="conj">Liên từ (conj)</option>
            <option value="interj">Thán từ (interj)</option>
          </select>
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
          <input
            className="input-field"
            type="text"
            value={editTopic}
            onChange={(e) => setEditTopic(e.target.value)}
          />
        </div>
        <div className="mt-16">
          <label className="field-label">Link ảnh</label>
          <input
            className="input-field"
            type="text"
            value={editImageUrl}
            onChange={(e) => setEditImageUrl(e.target.value)}
          />
          <button className="btn btn-secondary mt-8" onClick={onFetchImageFromUnsplash}>
            ⚡ Tìm ảnh từ Unsplash
          </button>
        </div>

        {editImageUrl && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <img
              src={editImageUrl}
              alt="Preview"
              style={{
                display: 'block',
                margin: '0 auto',
                maxWidth: '100%',
                maxHeight: '200px',
                borderRadius: '8px',
                border: '1px solid #eee',
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        <div className="modal-actions mt-16">
          <button className="btn btn-secondary" onClick={closeWordEditor}>Hủy</button>
          <button className="btn btn-primary" onClick={onSave}>Lưu thay đổi</button>
          <button className="btn btn-danger" onClick={onDelete}>🗑️ Xóa từ</button>
        </div>
      </div>
    </div>
  );
}
