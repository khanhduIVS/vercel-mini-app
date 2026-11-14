'use client';

import type { UseImportCsvResult } from '@/app/hooks/useImportCsv';

export interface ImportCsvModalProps {
  importCsv: UseImportCsvResult;
  onImport: () => void;
}

/** Modal "Thêm từ vựng": import CSV qua chọn file, kéo-thả, hoặc dán nội dung trực tiếp. */
export function ImportCsvModal({ importCsv, onImport }: ImportCsvModalProps) {
  const {
    showImport, csvInput, setCsvInput, fileName, fileInputRef,
    hideImportModal, onFilePicked, onDrop, onDragOver,
  } = importCsv;

  return (
    <div className={`overlay ${showImport ? 'active' : ''}`}>
      <div className="modal">
      <div className="modal-scroll">
        <div className="row-between">
          <h3 style={{ margin: 0 }}>Thêm từ vựng</h3>
          <button className="btn btn-secondary" onClick={hideImportModal}>✕</button>
        </div>
        <p className="text-muted mt-16">
          Định dạng mỗi dòng (6–7 cột, phân cách bằng dấu phẩy):
        </p>
        <div style={{ background: '#f7fafc', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', fontFamily: 'monospace', marginTop: '6px', lineHeight: '1.8' }}>
          <div><strong>từ_tiếng_anh</strong> , phiên_âm , loại_từ , <strong>nghĩa_tiếng_việt</strong> , chủ_đề , link_ảnh [, created_date]</div>
        </div>
        <ul className="text-muted" style={{ fontSize: '0.82rem', margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.8' }}>
          <li>Bắt buộc: cột 1 (từ tiếng Anh) và cột 4 (nghĩa tiếng Việt)</li>
          <li>
            <strong>Loại từ</strong> dùng mã:{' '}
            <code>n</code> · <code>v</code> · <code>adj</code> · <code>adv</code> · <code>pron</code> · <code>prep</code> · <code>conj</code> · <code>interj</code> · <code>det</code> · <code>art</code> · <code>num</code> · <code>aux</code> · <code>modal</code> · <code>phr</code> · <code>abbr</code>
            <br />Nhiều loại từ: bọc ngoặc kép, ngăn cách bằng dấu phẩy — ví dụ <code>&quot;adj, adv&quot;</code>
          </li>
          <li><strong>Chủ đề</strong>: nhập tên tự do (<code>Màu sắc</code>) hoặc UUID topic_id xuất từ DB — cả 2 đều được chấp nhận</li>
          <li>Nghĩa có dấu phẩy → bọc ngoặc kép <code>&quot;nghĩa 1, nghĩa 2&quot;</code></li>
          <li>Cột 7 (<code>created_date</code> khi export từ DB) được bỏ qua tự động</li>
          <li>Từ trùng <strong>(tiếng Anh + loại từ)</strong> → cập nhật, không tạo thêm bản ghi mới</li>
        </ul>

        <div
          className="drop-zone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            style={{ display: 'none' }}
            onChange={onFilePicked}
          />
          <div>📄 <strong>Chọn file CSV</strong> hoặc kéo thả vào đây</div>
          {fileName && <div className="text-muted" style={{ marginTop: '6px' }}>{fileName}</div>}
        </div>

        <div className="divider"><span>hoặc dán nội dung</span></div>

        <textarea
          placeholder={
            '# Nhập tên chủ đề\n' +
            'apple,/ˈæp.əl/,n,quả táo,Trái cây\n' +
            'forward,/ˈfɔː.wəd/,"adj, adv",về phía trước,Vị trí\n' +
            'cat,,n,"con mèo, mèo nhà",Con vật\n\n' +
            '# Hoặc dùng UUID topic_id xuất từ DB (cột 7 created_date bỏ qua tự động)\n' +
            'a,,"det, pron","nhỏ, một ít",6b487997-0ec6-44f1-ae46-c53e496b328b,,'
          }
          value={csvInput}
          onChange={(e) => setCsvInput(e.target.value)}
        />

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={hideImportModal}>Hủy</button>
          <button className="btn btn-primary" onClick={onImport}>Import</button>
        </div>
      </div>
      </div>
    </div>
  );
}
