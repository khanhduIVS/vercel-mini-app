'use client';

import { useAdminAuth } from '@/app/hooks/useAdminAuth';
import { useUiFeedback } from '@/app/hooks/useUiFeedback';
import { useTopics } from '@/app/hooks/useTopics';
import { useImportCsv } from '@/app/hooks/useImportCsv';
import { useWordsManager } from '@/app/hooks/useWordsManager';
import { useWordEditor } from '@/app/hooks/useWordEditor';
import { useUnsplashSearch } from '@/app/hooks/useUnsplashSearch';

import { AdminLoginForm } from '@/app/components/AdminLoginForm';
import { ImportCsvModal } from '@/app/components/ImportCsvModal';
import { WordsManagerModal } from '@/app/components/WordsManagerModal';
import { WordEditorModal } from '@/app/components/WordEditorModal';
import { UnsplashSearchModal } from '@/app/components/UnsplashSearchModal';
import { LoadingOverlay } from '@/app/components/LoadingOverlay';
import { Toast } from '@/app/components/Toast';

// ---------------------------------------------------------------------------
//  Trang /admin: đăng nhập tạm (client-side, user/pass = admin/admin) rồi
//  hiển thị khu vực quản trị với 2 chức năng đã di chuyển khỏi Dashboard:
//  "Thêm từ mới" (import CSV) và "Quản lý từ vựng".
//  Tái sử dụng toàn bộ hook/component đã tách sẵn ở app/hooks, app/components.
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const auth = useAdminAuth();
  const ui = useUiFeedback();
  const topics = useTopics();
  const importCsv = useImportCsv(ui);
  const wordsManager = useWordsManager(ui, topics.loadTopics, topics.topics);
  const wordEditor = useWordEditor(ui);
  const unsplashSearch = useUnsplashSearch(ui);

  const handleLoginFailed = () => {
    ui.showToast('Sai tên đăng nhập hoặc mật khẩu', 'error');
  };

  // Đóng Words Manager cũng đóng luôn Word Editor (giữ hành vi gốc như trang chính)
  const handleHideWordsManagerModal = () => {
    wordsManager.hideWordsManagerModal();
    wordEditor.closeWordEditor();
  };

  const handleFetchImageFromUnsplash = () => {
    unsplashSearch.openFetchImageModal(wordEditor.editEnglish);
  };

  const handleUseSelectedImage = () => {
    unsplashSearch.useSelectedImage((url) => {
      wordEditor.setEditImageUrl(url);
      wordEditor.setClearImage(false);  // reset xóa ảnh nếu trước đó đã đánh dấu
    });
  };

  if (!auth.isLoggedIn) {
    return (
      <div className="app-container">
        <AdminLoginForm onLogin={auth.login} onLoginFailed={handleLoginFailed} />
        <LoadingOverlay loading={ui.loading} loadingMessage={ui.loadingMessage} />
        <Toast toast={ui.toast} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="card">
        <div className="row-between">
          <h2 className="app-title" style={{ textAlign: 'left', margin: 0 }}>
            🔐 Khu vực quản trị
          </h2>
          <button className="btn btn-secondary" onClick={auth.logout}>Đăng xuất</button>
        </div>

        <div className="mt-16" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-block" onClick={importCsv.showImportModal}>
            📥 Thêm từ mới
          </button>
          <button className="btn btn-secondary btn-block" onClick={wordsManager.showWordsManagerModal}>
            📚 Quản lý từ vựng
          </button>
        </div>
      </div>

      <LoadingOverlay loading={ui.loading} loadingMessage={ui.loadingMessage} />

      <ImportCsvModal
        importCsv={importCsv}
        onImport={() => importCsv.doImport(() => { /* không có dashboard để refresh ở trang admin */ })}
      />

      <WordsManagerModal
        manager={wordsManager}
        topics={topics.topics}
        onHide={handleHideWordsManagerModal}
        onEditWord={wordEditor.openWordEditor}
      />

      <WordEditorModal
        editor={wordEditor}
        topics={topics.topics}
        onSave={() => wordEditor.saveWord(wordsManager.refreshCurrentPage)}
        onDelete={() => wordEditor.deleteCurrentWord(wordsManager.refreshCurrentPage)}
        onFetchImageFromUnsplash={handleFetchImageFromUnsplash}
      />

      <UnsplashSearchModal
        search={unsplashSearch}
        onUseSelectedImage={handleUseSelectedImage}
      />

      <Toast toast={ui.toast} />
    </div>
  );
}
