'use client';

export interface LoadingOverlayProps {
  loading: boolean;
  loadingMessage: string;
}

/** Overlay toàn màn hình hiện spinner + message khi đang xử lý tác vụ bất đồng bộ. */
export function LoadingOverlay({ loading, loadingMessage }: LoadingOverlayProps) {
  return (
    <div className={`overlay loading-overlay ${loading ? 'active' : ''}`}>
      <div className="card" style={{ textAlign: 'center', minWidth: '260px' }}>
        <div className="spinner dark" />
        <p className="mt-16">{loadingMessage}</p>
      </div>
    </div>
  );
}
