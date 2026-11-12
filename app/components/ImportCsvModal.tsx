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
          Định dạng mỗi dòng: <code>english,phiên_âm,loại_từ,nghĩa,chủ_đề,link_ảnh</code>
          <br />
          (phiên âm, loại từ, chủ đề, link ảnh có thể để trống; nghĩa chứa dấu phẩy thì bọc trong dấu &quot;...&quot;)
        </p>

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
          placeholder={'apple,/æpl/,n,quả táo,Trái cây\nred,/red/,adj,màu đỏ,Màu sắc\ncat,,n,"con mèo, mèo nhà",Con vật'}
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
