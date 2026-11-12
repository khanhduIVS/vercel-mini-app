'use client';

import { useCallback } from 'react';
import { useUiFeedback } from '@/app/hooks/useUiFeedback';
import { useTopics } from '@/app/hooks/useTopics';
import { useUserFlow } from '@/app/hooks/useUserFlow';
import { useDashboard } from '@/app/hooks/useDashboard';
import { useLearnSession } from '@/app/hooks/useLearnSession';
import { useImportCsv } from '@/app/hooks/useImportCsv';
import { useWordsManager } from '@/app/hooks/useWordsManager';
import { useWordEditor } from '@/app/hooks/useWordEditor';
import { useUnsplashSearch } from '@/app/hooks/useUnsplashSearch';

import { UserSelectionView } from '@/app/components/UserSelectionView';
import { DashboardView } from '@/app/components/DashboardView';
import { LearnView } from '@/app/components/LearnView';
import { ImportCsvModal } from '@/app/components/ImportCsvModal';
import { WordsManagerModal } from '@/app/components/WordsManagerModal';
import { WordEditorModal } from '@/app/components/WordEditorModal';
import { UnsplashSearchModal } from '@/app/components/UnsplashSearchModal';
import { LoadingOverlay } from '@/app/components/LoadingOverlay';
import { Toast } from '@/app/components/Toast';

// ---------------------------------------------------------------------------
//  Page: lắp ráp các hook theo domain + component theo view/modal.
//  Toàn bộ state/logic nghiệp vụ nằm trong app/hooks/*, gọi API qua app/services/*.
//  File này chỉ chịu trách nhiệm nối các hook lại với nhau và render layout tổng.
// ---------------------------------------------------------------------------
export default function Home() {
  const ui = useUiFeedback();
  const topics = useTopics();
  const dashboard = useDashboard(ui);

  // Khi vào app (chọn user có sẵn hoặc tạo mới): tải thống kê + danh sách chủ đề
  const handleEnterApp = useCallback((userName: string) => {
    dashboard.loadDashboard(userName);
    topics.loadTopics();
  }, [dashboard, topics]);

  const userFlow = useUserFlow(ui, handleEnterApp);
  const learnSession = useLearnSession(ui, userFlow.currentView);
  const importCsv = useImportCsv(ui);
  const wordsManager = useWordsManager(ui, topics.loadTopics);
  const wordEditor = useWordEditor(ui);
  const unsplashSearch = useUnsplashSearch(ui);

  // Logout: dừng countdown + hủy phát âm đang chạy trước khi quay lại view chọn user
  const handleLogout = () => {
    learnSession.stopCountdown();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    userFlow.logout();
  };

  // Bắt đầu buổi học: lấy danh sách từ rồi chuyển view sang 'learn'
  const handleStartLearningSession = async () => {
    const ok = await learnSession.startLearningSession(userFlow.currentUser, dashboard.wordCount, dashboard.selectedTopic);
    if (ok) userFlow.setCurrentView('learn');
  };

  // Quay lại dashboard: dừng countdown + hủy phát âm, tải lại thống kê
  const handleBackToDashboard = () => {
    learnSession.stopCountdown();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    userFlow.setCurrentView('dashboard');
    dashboard.loadDashboard(userFlow.currentUser);
  };

  // Đóng Words Manager cũng đóng luôn Word Editor (giữ hành vi gốc)
  const handleHideWordsManagerModal = () => {
    wordsManager.hideWordsManagerModal();
    wordEditor.closeWordEditor();
  };

  // Mở modal tìm ảnh Unsplash từ trong Word Editor, dùng từ tiếng Anh đang sửa làm từ khóa
  const handleFetchImageFromUnsplash = () => {
    unsplashSearch.openFetchImageModal(wordEditor.editEnglish);
  };

  // Áp dụng ảnh đã chọn từ modal Unsplash vào ô link ảnh của Word Editor
  const handleUseSelectedImage = () => {
    unsplashSearch.useSelectedImage((url) => wordEditor.setEditImageUrl(url));
  };

  return (
    <div className="app-container">
      <UserSelectionView
        active={userFlow.currentView === 'user'}
        users={userFlow.users}
        currentUser={userFlow.currentUser}
        onSelectUser={userFlow.onSelectUser}
        newUserName={userFlow.newUserName}
        setNewUserName={userFlow.setNewUserName}
        createNewUser={userFlow.createNewUser}
        startLearning={userFlow.startLearning}
      />

      <DashboardView
        active={userFlow.currentView === 'dashboard'}
        currentUser={userFlow.currentUser}
        stats={dashboard.stats}
        topics={topics.topics}
        selectedTopic={dashboard.selectedTopic}
        setSelectedTopic={dashboard.setSelectedTopic}
        wordCount={dashboard.wordCount}
        setWordCount={dashboard.setWordCount}
        onLogout={handleLogout}
        onStartLearningSession={handleStartLearningSession}
        onShowImportModal={importCsv.showImportModal}
        onShowWordsManagerModal={wordsManager.showWordsManagerModal}
        onRefreshDashboard={() => dashboard.refreshDashboard(userFlow.currentUser)}
      />

      <LearnView
        active={userFlow.currentView === 'learn'}
        currentWord={learnSession.currentWord}
        currentIndex={learnSession.currentIndex}
        totalWords={learnSession.wordList.length}
        countdown={learnSession.countdown}
        onBackToDashboard={handleBackToDashboard}
        onPrevWord={learnSession.prevWord}
        onNextWord={learnSession.nextWord}
      />

      <LoadingOverlay loading={ui.loading} loadingMessage={ui.loadingMessage} />

      <ImportCsvModal
        importCsv={importCsv}
        onImport={() => importCsv.doImport(() => dashboard.loadDashboard(userFlow.currentUser))}
      />

      <WordsManagerModal
        manager={wordsManager}
        topics={topics.topics}
        onHide={handleHideWordsManagerModal}
        onEditWord={wordEditor.openWordEditor}
      />

      <WordEditorModal
        editor={wordEditor}
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
