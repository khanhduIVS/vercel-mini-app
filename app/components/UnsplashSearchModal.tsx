'use client';

import type { UseUnsplashSearchResult } from '@/app/hooks/useUnsplashSearch';

export interface UnsplashSearchModalProps {
  search: UseUnsplashSearchResult;
  onUseSelectedImage: () => void;
}

/** Modal "Tìm ảnh từ Unsplash": nhập từ khóa, xem lưới kết quả, chọn 1 ảnh và áp dụng hoặc copy link. */
export function UnsplashSearchModal({ search, onUseSelectedImage }: UnsplashSearchModalProps) {
  const {
    showFetchImage, fetchImageWord, setFetchImageWord,
    fetchImageResults, fetchImageSelectedUrl, fetchImageStatus, fetchImageHasResults,
    hideFetchImageModal, doFetchImage, selectImage, copyImageLink,
  } = search;

  return (
    <div className={`overlay ${showFetchImage ? 'active' : ''}`} style={{ zIndex: 1100 }}>
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="row-between">
          <h3 style={{ margin: 0 }}>⚡ Tìm ảnh từ Unsplash</h3>
          <button className="btn btn-secondary" onClick={hideFetchImageModal}>✕</button>
        </div>
        <p className="text-muted mt-16">Nhập từ tiếng Anh để tìm ảnh minh họa</p>

        <div className="mt-16">
          <input
            className="input-field"
            type="text"
            placeholder="Ví dụ: apple, cat, beautiful..."
            value={fetchImageWord}
            onChange={(e) => setFetchImageWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && doFetchImage()}
          />
        </div>

        <div className="mt-16">
          <button className="btn btn-primary btn-block" onClick={doFetchImage}>Tìm ảnh</button>
        </div>

        {fetchImageHasResults && (
          <div className="mt-16">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {fetchImageResults.map((img, idx) => (
                <img
                  key={idx}
                  src={img.thumb}
                  className={`unsplash-thumb ${fetchImageSelectedUrl === img.regular ? 'selected' : ''}`}
                  alt={`Ảnh ${idx + 1}`}
                  onClick={() => selectImage(img)}
                />
              ))}
            </div>
            {fetchImageSelectedUrl && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={fetchImageSelectedUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div className="mt-16">
                  <label className="field-label">Link ảnh đã chọn</label>
                  <input
                    className="input-field"
                    type="text"
                    readOnly
                    value={fetchImageSelectedUrl}
                  />
                </div>
                <div className="modal-actions mt-16">
                  <button className="btn btn-secondary" onClick={copyImageLink}>📋 Copy link</button>
                  <button className="btn btn-primary" onClick={onUseSelectedImage}>✓ Chọn ảnh này</button>
                </div>
              </div>
            )}
          </div>
        )}

        {fetchImageStatus && (
          <div className="mt-16 text-muted" style={{ textAlign: 'center' }}>{fetchImageStatus}</div>
        )}
      </div>
    </div>
  );
}
