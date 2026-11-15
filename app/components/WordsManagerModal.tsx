'use client';

import { useState } from 'react';
import type { UseWordsManagerResult } from '@/app/hooks/useWordsManager';
import type { Topic } from '@/lib/types';

export interface WordsManagerModalProps {
  manager: UseWordsManagerResult;
  topics: Topic[];
  onHide: () => void;
  onEditWord: (wordId: string) => void;
}

export function WordsManagerModal({ manager, topics, onHide, onEditWord }: WordsManagerModalProps) {
  const {
    showWordsManager, managerWords, managerTotal,
    noImageCount,
    managerSearchInput, setManagerSearchInput, managerTopicFilter,
    managerStart, managerEnd, managerTotalPages, managerPage,
    onManagerSearch, onManagerTopicChange, managerPrevPage, managerNextPage,
    confirmDeleteWord, bulkAutoFindImages,
  } = manager;

  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const topicName = managerTopicFilter
    ? (topics.find((t) => t.topicId === managerTopicFilter)?.name || '')
    : '';

  const handleBulkConfirm = () => {
    setShowBulkConfirm(false);
    bulkAutoFindImages();
  };

  return (
    <>
      {/* Modal quản lý từ vựng */}
      <div className={`overlay ${showWordsManager ? 'active' : ''}`}>
        <div className="modal" style={{ maxWidth: '800px' }}>
          <div className="modal-scroll">
            <div className="row-between">
              <h3 style={{ margin: 0 }}>{'📚 Quản lý từ vựng'}</h3>
              <button className="btn btn-secondary" onClick={onHide}>{'✕'}</button>
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
                onClick={() => setShowBulkConfirm(true)}
              >
                {'🖼️ '}
                {topicName
                  ? `Cập nhật ảnh cho chủ đề "${topicName}"`
                  : 'Cập nhật ảnh cho tất cả từ'}
              </button>

              {noImageCount > 0 && (
                <div style={{
                  marginTop: '6px', fontSize: '0.8rem', color: '#c05621',
                  background: '#fffaf0', border: '1px solid #fbd38d',
                  borderRadius: '8px', padding: '6px 10px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {'⚠️ Có '}
                  <strong>{noImageCount.toLocaleString('en-US')}</strong>
                  {' từ chưa có hình ảnh'}
                  {managerTopicFilter ? ' trong chủ đề này' : ''}
                </div>
              )}
              {noImageCount === 0 && managerTotal > 0 && (
                <div style={{
                  marginTop: '6px', fontSize: '0.8rem', color: '#276749',
                  background: '#f0fff4', border: '1px solid #9ae6b4',
                  borderRadius: '8px', padding: '6px 10px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {'✅ Tất cả từ đã có hình ảnh'}
                </div>
              )}
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
                          <button className="btn btn-secondary btn-sm" onClick={() => onEditWord(w.wordId)}>✏️</button>
                          <button className="btn btn-danger btn-sm" style={{ marginLeft: '4px' }} onClick={() => confirmDeleteWord(w.wordId)}>🗑️</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-16 row-between">
              <div className="text-muted">
                {managerTotal > 0 ? `Hiển thị ${managerStart}–${managerEnd} / ${managerTotal} từ` : ''}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={managerPrevPage} disabled={managerPage <= 1}>
                  {'← Trước'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={managerNextPage}
                  disabled={managerPage >= managerTotalPages || managerTotalPages === 0}
                >
                  {'Sau →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup xác nhận cập nhật ảnh hàng loạt */}
      <div className={`overlay ${showBulkConfirm ? 'active' : ''}`} style={{ zIndex: 1050 }}>
        <div className="modal" style={{ maxWidth: '420px' }}>
          <div className="modal-scroll">
            <h3 style={{ margin: '0 0 12px' }}>{'🖼️ Cập nhật ảnh tự động'}</h3>

            <div style={{
              background: '#f7fafc', borderRadius: '10px', padding: '14px',
              fontSize: '0.9rem', color: '#4a5568', lineHeight: '1.7',
            }}>
              {topicName ? (
                <span>
                  Tìm và cập nhật ảnh cho các từ <strong>chưa có hình</strong> thuộc chủ đề{' '}
                  <strong>{`"${topicName}"`}</strong>.
                </span>
              ) : (
                <span>
                  Tìm và cập nhật ảnh cho <strong>tất cả từ chưa có hình</strong> trong kho từ vựng.
                </span>
              )}
            </div>

            {noImageCount > 0 && (
              <div style={{
                marginTop: '10px', padding: '10px 14px',
                background: '#fffaf0', border: '1px solid #fbd38d',
                borderRadius: '8px', fontSize: '0.85rem', color: '#c05621',
              }}>
                {'⚠️ Sẽ xử lý '}
                <strong>{noImageCount.toLocaleString('en-US')}</strong>
                {' từ chưa có ảnh.'}
              </div>
            )}

            {noImageCount === 0 && (
              <div style={{
                marginTop: '10px', padding: '10px 14px',
                background: '#f0fff4', border: '1px solid #9ae6b4',
                borderRadius: '8px', fontSize: '0.85rem', color: '#276749',
              }}>
                {'✅ Không có từ nào cần cập nhật ảnh.'}
              </div>
            )}

            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#718096' }}>
              {'🌐 Cần kết nối internet · ⏱ Mỗi từ ~1-2 giây'}
            </div>

            <div className="modal-actions mt-16">
              <button className="btn btn-secondary" onClick={() => setShowBulkConfirm(false)}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleBulkConfirm}
                disabled={noImageCount === 0}
              >
                {'✅ Bắt đầu'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
