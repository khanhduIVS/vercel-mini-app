'use client';

import { useCallback } from 'react';
import { useUiFeedback } from '@/app/hooks/useUiFeedback';
import { useTopics } from '@/app/hooks/useTopics';
import { useUserFlow } from '@/app/hooks/useUserFlow';
import { useDashboard } from '@/app/hooks/useDashboard';
import { useLearnSession } from '@/app/hooks/useLearnSession';

import { UserSelectionView } from '@/app/components/UserSelectionView';
import { DashboardView } from '@/app/components/DashboardView';
import { LearnView } from '@/app/components/LearnView';
import { LoadingOverlay } from '@/app/components/LoadingOverlay';
import { Toast } from '@/app/components/Toast';

// ---------------------------------------------------------------------------
//  Page: lắp ráp các hook theo domain + component theo view/modal.
//  Toàn bộ state/logic nghiệp vụ nằm trong app/hooks/*, gọi API qua app/services/*.
//  File này chỉ chịu trách nhiệm nối các hook lại với nhau và render layout tổng.
//  Chức năng "Thêm từ mới" và "Quản lý từ vựng" đã di chuyển sang trang /admin.
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

  // Logout: dừng countdown + hủy phát âm đang chạy trước khi quay lại view chọn user
  const handleLogout = () => {
    learnSession.stopCountdown();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    userFlow.logout();
  };

  // Bắt đầu buổi học: lấy danh sách từ rồi chuyển view sang 'learn'
  const handleStartLearningSession = async () => {
    const ok = await learnSession.startLearningSession(userFlow.currentUser, dashboard.wordCount, dashboard.selectedTopic);
    if (ok) {
      userFlow.setCurrentView('learn');
      document.body.classList.add('learn-active');
    }
  };

  // Quay lại dashboard: dừng countdown + hủy phát âm, tải lại thống kê
  const handleBackToDashboard = () => {
    learnSession.stopCountdown();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    document.body.classList.remove('learn-active');
    userFlow.setCurrentView('dashboard');
    dashboard.loadDashboard(userFlow.currentUser);
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
        onRefreshDashboard={() => dashboard.refreshDashboard(userFlow.currentUser)}
      />

      <LearnView
        active={userFlow.currentView === 'learn'}
        currentWord={learnSession.currentWord}
        currentIndex={learnSession.currentIndex}
        totalWords={learnSession.wordList.length}
        countdown={learnSession.countdown}
        visitedIndices={learnSession.visitedIndices}
        isLastWord={learnSession.isLastWord}
        onBackToDashboard={handleBackToDashboard}
        onPrevWord={learnSession.prevWord}
        onNextWord={learnSession.nextWord}
        onGoToIndex={learnSession.goToIndex}
      />

      <LoadingOverlay loading={ui.loading} loadingMessage={ui.loadingMessage} />

      <Toast toast={ui.toast} />
    </div>
  );
}
