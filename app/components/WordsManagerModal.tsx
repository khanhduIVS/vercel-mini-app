'use client';

import type { UseWordsManagerResult } from '@/app/hooks/useWordsManager';
import type { Topic } from '@/lib/types';

export interface WordsManagerModalProps {
  manager: UseWordsManagerResult;
  topics: Topic[];
  onHide: () => void;
  onEditWord: (wordId: string) => void;
}

/** Modal "Quản lý từ vựng": bảng danh sách có search/filter/phân trang, sửa/xóa, cập nhật ảnh tự động. */
export function WordsManagerModal({ manager, topics, onHide, onEditWord }: WordsManagerModalProps) {
  const {
    showWordsManager, managerWords, managerTotal,
    managerSearchInput, setManagerSearchInput, managerTopicFilter,
    managerStart, managerEnd, managerTotalPages, managerPage,
    onManagerSearch, onManagerTopicChange, managerPrevPage, managerNextPage,
    confirmDeleteWord, bulkAutoFindImages,
  } = manager;

  return (
    <div className={`overlay ${showWordsManager ? 'active' : ''}`}>
      <div className="modal" style={{ maxWidth: '800px' }}>
      <div className="modal-scroll">
        <div className="row-between">
          <h3 style={{ margin: 0 }}>📚 Quản lý từ vựng</h3>
          <button className="btn btn-secondary" onClick={onHide}>✕</button>
        </div>

        <div className="mt-16">
          <div className="row-between">
            <input
              className="input-field"
              type="text"
              placeholder="🔍 Tìm từ hoặc nghĩa..."
              style={{ width: '200px' }}
              value={managerSearchInput}
              onChange={(e) => setManagerSearchInput(e.target.value)}
              onKeyPress={onManagerSearch}
            />
            <select
              className="input-field"
              value={managerTopicFilter}
              onChange={(e) => onManagerTopicChange(e.target.value)}
            >
              <option value="">Tất cả chủ đề</option>
              {topics.map((t) => (
                <option key={t.topicId} value={t.topicId}>{t.name}</option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-secondary btn-block mt-8"
            onClick={bulkAutoFindImages}
          >
            🖼️ {managerTopicFilter
              ? `Cập nhật ảnh cho chủ đề "${topics.find((t) => t.topicId === managerTopicFilter)?.name || ''}"`
              : 'Cập nhật ảnh cho tất cả từ'}
          </button>
        </div>

        <div className="mt-16" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="word-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Từ</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Nghĩa</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Loại</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Chủ đề</th>
                <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>Hình</th>
                <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {managerWords.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    Không tìm thấy từ nào
                  </td>
                </tr>
              ) : (
                managerWords.map((w) => (
                  <tr key={w.wordId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}><strong>{w.englishWord}</strong></td>
                    <td style={{ padding: '8px' }}>{w.vietnameseMeaning}</td>
                    <td style={{ padding: '8px' }}>{w.wordType || ''}</td>
                    <td style={{ padding: '8px' }}>{w.topic || ''}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{w.imageUrl ? '✅' : '❌'}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEditWord(w.wordId)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ marginLeft: '4px' }}
                        onClick={() => confirmDeleteWord(w.wordId)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-16 row-between">
          <div className="text-muted">
            {managerTotal > 0
              ? `Hiển thị ${managerStart}–${managerEnd} / ${managerTotal} từ`
              : ''}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={managerPrevPage}
              disabled={managerPage <= 1}
            >
              ← Trước
            </button>
            <button
              className="btn btn-primary"
              onClick={managerNextPage}
              disabled={managerPage >= managerTotalPages || managerTotalPages === 0}
            >
              Sau →
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
