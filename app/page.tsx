'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Vocab, UserStats, UnsplashImage } from '@/lib/types';

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------
const COUNTDOWN_SECONDS = 30;

const WORD_TYPE_MAP: Record<string, string> = {
  'n': 'Danh từ', 'v': 'Động từ', 'adj': 'Tính từ', 'adv': 'Trạng từ',
  'pron': 'Đại từ', 'prep': 'Giới từ', 'conj': 'Liên từ', 'interj': 'Thán từ',
  'det': 'Từ hạn định', 'art': 'Mạo từ', 'num': 'Số từ',
  'aux': 'Trợ động từ', 'modal': 'Động từ khuyết thiếu',
  'phr': 'Cụm động từ', 'abbr': 'Từ viết tắt',
};

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------
export default function Home() {
  // --- Main state ---
  const [currentView, setCurrentView] = useState<'user' | 'dashboard' | 'learn'>('user');
  const [currentUser, setCurrentUser] = useState('');
  const [users, setUsers] = useState<string[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [wordCount, setWordCount] = useState(5);

  // --- Learning state ---
  const [wordList, setWordList] = useState<Vocab[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  // --- UI helpers state ---
  const [toast, setToast] = useState<{ id: number; message: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Đang tải...');

  // --- Import state ---
  const [showImport, setShowImport] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [importFileContent, setImportFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Words manager state ---
  const [showWordsManager, setShowWordsManager] = useState(false);
  const [managerWords, setManagerWords] = useState<Vocab[]>([]);
  const [managerTotal, setManagerTotal] = useState(0);
  const [managerPage, setManagerPage] = useState(1);
  const [managerSearch, setManagerSearch] = useState('');
  const [managerSearchInput, setManagerSearchInput] = useState('');
  const [managerTopicFilter, setManagerTopicFilter] = useState('');

  // --- Word editor state ---
  const [showWordEditor, setShowWordEditor] = useState(false);
  const [editWordId, setEditWordId] = useState<string | null>(null);
  const [editEnglish, setEditEnglish] = useState('');
  const [editIpa, setEditIpa] = useState('');
  const [editWordType, setEditWordType] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageError, setEditImageError] = useState(false);

  // --- Fetch image state ---
  const [showFetchImage, setShowFetchImage] = useState(false);
  const [fetchImageWord, setFetchImageWord] = useState('');
  const [fetchImageResults, setFetchImageResults] = useState<UnsplashImage[]>([]);
  const [fetchImageSelectedUrl, setFetchImageSelectedUrl] = useState('');
  const [fetchImageStatus, setFetchImageStatus] = useState('');
  const [fetchImageHasResults, setFetchImageHasResults] = useState(false);

  // ===================================================================
  //  TOAST
  // ===================================================================
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration = 2800) => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => setToast((prev) => (prev?.id === id ? null : prev)), duration);
  }, []);

  // ===================================================================
  //  USER FLOW
  // ===================================================================
  const loadUserList = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      showToast('Không thể tải danh sách người dùng', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadUserList();
  }, [loadUserList]);

  const createNewUser = async () => {
    const name = newUserName.trim();
    if (!name) { showToast('Vui lòng nhập tên người dùng', 'error'); return; }

    setLoading(true);
    setLoadingMessage('Đang tạo người dùng...');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi');
      }
      const data = await res.json();
      setNewUserName('');
      showToast(`Đã chọn người dùng "${data.userName}"`, 'success');
      enterApp(data.userName);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Không thể tạo người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startLearning = () => {
    if (!currentUser) return;
    enterApp(currentUser);
  };

  // Only called from the select dropdown; user is already set
  const onSelectUser = (name: string) => {
    setCurrentUser(name);
  };

  const enterApp = (userName: string) => {
    setCurrentUser(userName);
    setCurrentView('dashboard');
    loadDashboard(userName);
    loadTopicList();
  };

  // ===================================================================
  //  DASHBOARD
  // ===================================================================
  const loadDashboard = useCallback(async (userName: string) => {
    setLoading(true);
    setLoadingMessage('Đang tải thống kê...');
    try {
      const res = await fetch(`/api/stats?user=${encodeURIComponent(userName)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStats(data);
    } catch {
      showToast('Không thể tải thống kê', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const refreshDashboard = () => {
    loadDashboard(currentUser);
    showToast('Đã làm mới dữ liệu', 'success');
  };

  const logout = () => {
    stopCountdownRef.current();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setCurrentUser('');
    setCurrentView('user');
    loadUserList();
  };

  const loadTopicList = useCallback(async () => {
    try {
      const res = await fetch('/api/topics');
      if (!res.ok) return;
      const data = await res.json();
      setTopics(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  // ===================================================================
  //  LEARNING
  // ===================================================================
  const startLearningSession = async () => {
    const topic = selectedTopic === 'all' ? '' : selectedTopic;
    setLoading(true);
    setLoadingMessage('Đang chuẩn bị bài học...');
    try {
      const res = await fetch(`/api/learn?user=${encodeURIComponent(currentUser)}&count=${wordCount}&topic=${encodeURIComponent(topic)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.words || data.words.length === 0) {
        showToast('Chưa có từ nào trong kho. Vui lòng thêm từ vựng.', 'info');
        return;
      }
      setWordList(data.words);
      setCurrentIndex(0);
      setCurrentView('learn');
    } catch {
      showToast('Không thể bắt đầu học', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopCountdownRef = useRef(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  });

  useEffect(() => {
    stopCountdownRef.current();
    if (currentView !== 'learn' || wordList.length === 0) return;

    let remaining = COUNTDOWN_SECONDS;
    setCountdown(remaining);

    countdownTimerRef.current = setInterval(() => {
      remaining--;
      setCountdown(Math.max(0, remaining));
      if (remaining <= 0) {
        stopCountdownRef.current();
        setCurrentIndex((idx) => (idx + 1) % wordList.length);
      }
    }, 1000);

    return () => stopCountdownRef.current();
  }, [currentIndex, currentView, wordList.length]);

  // Speak word when it changes
  useEffect(() => {
    if (currentView === 'learn' && wordList[currentIndex]) {
      speak(wordList[currentIndex].englishWord);
    }
  }, [currentIndex, currentView, wordList]);

  const nextWord = () => {
    if (wordList.length === 0) return;
    setCurrentIndex((idx) => (idx + 1) % wordList.length);
  };

  const prevWord = () => {
    setCurrentIndex((idx) => (idx > 0 ? idx - 1 : 0));
  };

  const backToDashboard = () => {
    stopCountdownRef.current();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setCurrentView('dashboard');
    loadDashboard(currentUser);
  };

  // ===================================================================
  //  IMPORT CSV
  // ===================================================================
  const showImportModal = () => {
    setShowImport(true);
    setCsvInput('');
    setImportFileContent('');
    setFileName('');
  };

  const hideImportModal = () => {
    setShowImport(false);
    setCsvInput('');
    setImportFileContent('');
    setFileName('');
  };

  const onFilePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readImportFile(file);
  };

  const readImportFile = (file: File) => {
    const name = (file.name || '').toLowerCase();
    if (!/\.(csv|txt)$/.test(name)) {
      showToast('Chỉ hỗ trợ file .csv hoặc .txt', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || '');
      setImportFileContent(content);
      const lines = content.split(/\r?\n/).filter((l) => l.trim());
      setFileName(`✓ ${file.name} (${lines.length} dòng)`);
    };
    reader.onerror = () => showToast('Không đọc được file', 'error');
    reader.readAsText(file, 'UTF-8');
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) readImportFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const doImport = async () => {
    const csv = (importFileContent || csvInput).trim();
    if (!csv) { showToast('Vui lòng chọn file hoặc dán dữ liệu CSV', 'error'); return; }

    setLoading(true);
    setLoadingMessage('Đang import từ vựng...');
    try {
      const res = await fetch('/api/vocab/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      hideImportModal();
      let msg = 'Import hoàn tất!\n';
      msg += `➕ Thêm mới: ${result.imported} dòng\n`;
      msg += `🔄 Cập nhật: ${result.updated} dòng\n`;
      msg += `⏸️ Giữ nguyên: ${result.unchanged} dòng`;
      if (result.errors) msg += `\n⚠️ Lỗi: ${result.errors} dòng`;
      showToast(msg, 'success', 6000);
      loadDashboard(currentUser);
    } catch {
      showToast('Không thể import', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===================================================================
  //  WORDS MANAGER
  // ===================================================================
  const showWordsManagerModal = () => {
    setManagerPage(1);
    setManagerSearch('');
    setManagerSearchInput('');
    setManagerTopicFilter('');
    loadTopicsForManager();
    renderWordsManager('', '', 1);
    setShowWordsManager(true);
  };

  const hideWordsManagerModal = () => {
    setShowWordsManager(false);
    setShowWordEditor(false);
  };

  const loadTopicsForManager = async () => {
    try {
      const res = await fetch('/api/topics');
      if (!res.ok) return;
      const data = await res.json();
      setTopics(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const renderWordsManager = useCallback(async (search: string, topic: string, page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search, topic, page: String(page), pageSize: '20',
      });
      const res = await fetch(`/api/vocab?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setManagerWords(data.words || []);
      setManagerTotal(data.total || 0);
    } catch {
      showToast('Không thể tải danh sách từ', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const onManagerSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setManagerSearch(managerSearchInput);
      setManagerPage(1);
      renderWordsManager(managerSearchInput, managerTopicFilter, 1);
    }
  };

  const onManagerTopicChange = (value: string) => {
    setManagerTopicFilter(value);
    setManagerPage(1);
    renderWordsManager(managerSearch, value, 1);
  };

  const managerPrevPage = () => {
    if (managerPage > 1) {
      const p = managerPage - 1;
      setManagerPage(p);
      renderWordsManager(managerSearch, managerTopicFilter, p);
    }
  };

  const managerNextPage = () => {
    const totalPages = Math.ceil(managerTotal / 20);
    if (managerPage < totalPages) {
      const p = managerPage + 1;
      setManagerPage(p);
      renderWordsManager(managerSearch, managerTopicFilter, p);
    }
  };

  // ===================================================================
  //  WORD EDITOR
  // ===================================================================
  const openWordEditor = async (wordId: string) => {
    setLoading(true);
    setLoadingMessage('Đang tải thông tin từ...');
    try {
      const res = await fetch(`/api/vocab/${wordId}`);
      if (!res.ok) throw new Error();
      const word = await res.json();
      if (!word) { showToast('Không tìm thấy từ', 'error'); return; }
      setEditWordId(wordId);
      setEditEnglish(word.englishWord);
      setEditIpa(word.ipa || '');
      setEditWordType(word.wordType || '');
      setEditMeaning(word.vietnameseMeaning);
      setEditTopic(word.topic || '');
      setEditImageUrl(word.imageUrl || '');
      setEditImageError(false);
      setShowWordEditor(true);
    } catch {
      showToast('Không thể tải thông tin từ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const closeWordEditor = () => {
    setShowWordEditor(false);
    setEditWordId(null);
    setEditEnglish('');
    setEditIpa('');
    setEditWordType('');
    setEditMeaning('');
    setEditTopic('');
    setEditImageUrl('');
    setEditImageError(false);
  };

  const saveWord = async () => {
    if (!editWordId) return;
    setLoading(true);
    setLoadingMessage('Đang lưu...');
    try {
      const res = await fetch(`/api/vocab/${editWordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipa: editIpa,
          wordType: editWordType,
          vietnameseMeaning: editMeaning,
          topic: editTopic,
          imageUrl: editImageUrl,
        }),
      });
      if (!res.ok) throw new Error();
      showToast('Cập nhật thành công', 'success');
      closeWordEditor();
      renderWordsManager(managerSearch, managerTopicFilter, managerPage);
    } catch {
      showToast('Lỗi khi cập nhật', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteCurrentWord = async () => {
    if (!editWordId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa từ này?')) return;
    setLoading(true);
    setLoadingMessage('Đang xóa...');
    try {
      const res = await fetch(`/api/vocab/${editWordId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Xóa thành công', 'success');
      closeWordEditor();
      renderWordsManager(managerSearch, managerTopicFilter, managerPage);
    } catch {
      showToast('Lỗi khi xóa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteWord = async (wordId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa từ này?')) return;
    setLoading(true);
    setLoadingMessage('Đang xóa...');
    try {
      const res = await fetch(`/api/vocab/${wordId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Xóa thành công', 'success');
      renderWordsManager(managerSearch, managerTopicFilter, managerPage);
    } catch {
      showToast('Lỗi khi xóa', 'error');
    } finally {
      setLoading(false);
    }
  };

  /** Fetch the first Unsplash result for a word and PUT-update its imageUrl. Returns true on success. */
  const BULK_IMAGE_BATCH_SIZE = 10;

  type FetchImageResult = 'success' | 'not_found' | 'rate_limited' | 'error';

  /** Fetch the first Unsplash result for a word and PUT-update its imageUrl. */
  const fetchAndApplyImage = async (word: Vocab): Promise<FetchImageResult> => {
    if (!word.englishWord.trim()) return 'not_found';
    try {
      const params = new URLSearchParams({ word: word.englishWord.trim(), page: '1', pageSize: '1' });
      const res = await fetch(`/api/unsplash?${params}`);
      if (res.status === 429) return 'rate_limited';
      if (!res.ok) return 'error';

      const images: UnsplashImage[] = await res.json();
      if (!Array.isArray(images) || images.length === 0) return 'not_found';

      const imageUrl = images[0].regular;
      const putRes = await fetch(`/api/vocab/${word.wordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipa: word.ipa || '',
          wordType: word.wordType || '',
          vietnameseMeaning: word.vietnameseMeaning || '',
          topic: word.topic || '',
          imageUrl,
        }),
      });
      return putRes.ok ? 'success' : 'error';
    } catch {
      return 'error';
    }
  };

  const autoFindImage = async (word: Vocab) => {
    if (!word.englishWord.trim()) {
      showToast('Từ không có nội dung tiếng Anh', 'error');
      return;
    }
    setLoading(true);
    setLoadingMessage('Đang tự động tìm ảnh...');
    try {
      const result = await fetchAndApplyImage(word);
      if (result === 'rate_limited') {
        showToast('Đã hết lượt gọi Unsplash API. Vui lòng thực hiện lại sau.', 'error', 4000);
        return;
      }
      if (result !== 'success') {
        showToast(`Không tìm thấy ảnh cho từ "${word.englishWord}"`, 'error');
        return;
      }
      showToast(`Đã tự động cập nhật ảnh cho "${word.englishWord}"`, 'success');
      renderWordsManager(managerSearch, managerTopicFilter, managerPage);
    } catch {
      showToast('Lỗi khi tự động tìm ảnh', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cập nhật ảnh cho nhiều từ cùng lúc, xử lý tuần tự theo từng lô (batch) 10 từ.
   * Nếu không chọn chủ đề (managerTopicFilter rỗng) -> cập nhật tất cả từ.
   * Nếu có chọn chủ đề -> chỉ cập nhật các từ thuộc chủ đề đó.
   * Nếu gặp lỗi hết lượt gọi API (rate limit) -> dừng ngay và báo lỗi để thực hiện lại sau.
   */
  const bulkAutoFindImages = async () => {
    const topic = managerTopicFilter;
    const confirmMsg = topic
      ? `Tự động tìm và cập nhật ảnh cho TẤT CẢ từ thuộc chủ đề "${topic}"?`
      : 'Tự động tìm và cập nhật ảnh cho TẤT CẢ từ vựng (mọi chủ đề)?';
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setLoadingMessage('Đang tải danh sách từ...');
    try {
      const params = new URLSearchParams({ search: '', topic, page: '1', pageSize: '10000' });
      const res = await fetch(`/api/vocab?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const words: Vocab[] = data.words || [];

      if (words.length === 0) {
        showToast('Không có từ nào để cập nhật ảnh', 'info');
        return;
      }

      let successCount = 0;
      let failCount = 0;
      let wasRateLimited = false;
      let processedCount = 0;

      outer:
      for (let batchStart = 0; batchStart < words.length; batchStart += BULK_IMAGE_BATCH_SIZE) {
        const batch = words.slice(batchStart, batchStart + BULK_IMAGE_BATCH_SIZE);
        for (const w of batch) {
          processedCount++;
          setLoadingMessage(`Đang cập nhật ảnh ${processedCount}/${words.length} (lô ${Math.floor(batchStart / BULK_IMAGE_BATCH_SIZE) + 1}): ${w.englishWord}...`);
          const result = await fetchAndApplyImage(w);
          if (result === 'rate_limited') {
            wasRateLimited = true;
            break outer;
          }
          if (result === 'success') successCount++; else failCount++;
        }
      }

      if (wasRateLimited) {
        showToast(
          `⚠️ Đã hết lượt gọi Unsplash API sau khi xử lý ${processedCount - 1}/${words.length} từ ` +
          `(✅ ${successCount} thành công, ❌ ${failCount} thất bại).\n` +
          `Vui lòng thực hiện lại sau để cập nhật các từ còn lại.`,
          'error',
          7000
        );
      } else {
        showToast(
          `Hoàn tất cập nhật ảnh: ✅ ${successCount} thành công, ❌ ${failCount} thất bại`,
          failCount > 0 ? 'info' : 'success',
          5000
        );
      }
      renderWordsManager(managerSearch, managerTopicFilter, managerPage);
    } catch {
      showToast('Lỗi khi cập nhật ảnh hàng loạt', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ===================================================================
  //  UNSPLASH IMAGE SEARCH
  // ===================================================================
  const fetchImageUrlFromUnsplash = () => {
    if (!editEnglish.trim()) {
      showToast('Vui lòng nhập từ tiếng Anh trước', 'error');
      return;
    }
    setFetchImageWord(editEnglish.trim());
    setFetchImageResults([]);
    setFetchImageSelectedUrl('');
    setFetchImageStatus('');
    setFetchImageHasResults(false);
    setShowFetchImage(true);
  };

  const hideFetchImageModal = () => setShowFetchImage(false);

  const doFetchImage = async () => {
    const word = fetchImageWord.trim();
    if (!word) { showToast('Vui lòng nhập từ tiếng Anh', 'error'); return; }

    setLoading(true);
    setLoadingMessage('Đang tìm ảnh...');
    try {
      const res = await fetch(`/api/unsplash?word=${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error();
      const images = await res.json();
      if (Array.isArray(images) && images.length > 0) {
        setFetchImageResults(images);
        setFetchImageHasResults(true);
        setFetchImageStatus(`Tìm thấy ${images.length} ảnh. Nhấn để chọn ảnh phù hợp.`);
      } else {
        setFetchImageResults([]);
        setFetchImageHasResults(false);
        setFetchImageStatus('❌ Không tìm thấy ảnh cho từ này. Thử từ khác!');
      }
    } catch {
      setFetchImageStatus('❌ Lỗi khi tìm ảnh');
    } finally {
      setLoading(false);
    }
  };

  const selectImage = (img: UnsplashImage) => {
    setFetchImageSelectedUrl(img.regular);
  };

  const useSelectedImage = () => {
    if (fetchImageSelectedUrl) {
      setEditImageUrl(fetchImageSelectedUrl);
      setEditImageError(false);
      setShowFetchImage(false);
      showToast('Đã thêm link ảnh', 'success');
    }
  };

  const copyImageLink = () => {
    if (!fetchImageSelectedUrl) return;
    navigator.clipboard.writeText(fetchImageSelectedUrl).then(
      () => showToast('Đã copy link ảnh vào clipboard', 'success'),
      () => showToast('Không thể copy', 'error')
    );
  };

  // ===================================================================
  //  RENDER HELPERS
  // ===================================================================
  const getWordTypeHtml = (wordType: string) => {
    if (!wordType) return null;
    const desc = WORD_TYPE_MAP[wordType] || '';
    return (
      <>
        <span className="word-type">{wordType}</span>
        {desc && <span className="word-type-desc">({desc})</span>}
      </>
    );
  };

  const currentWord = wordList[currentIndex];

  // Manager pagination info
  const managerStart = managerTotal > 0 ? (managerPage - 1) * 20 + 1 : 0;
  const managerEnd = Math.min(managerStart + 19, managerTotal);
  const managerTotalPages = Math.ceil(managerTotal / 20);

  // ===================================================================
  //  RENDER
  // ===================================================================
  return (
    <div className="app-container">
      {/* ===== VIEW 1: USER SELECTION ===== */}
      <section className={`view ${currentView === 'user' ? 'active' : ''}`}>
        <div className="card">
          <div className="logo">📚</div>
          <h1 className="app-title">Ứng dụng học từ vựng</h1>
          <p className="app-subtitle">Học tiếng Anh vui vẻ và hiệu quả</p>

          <label className="field-label" htmlFor="userSelect">👤 Chọn người học</label>
          <select
            id="userSelect"
            className="input-field"
            value={currentUser}
            onChange={(e) => onSelectUser(e.target.value)}
          >
            <option value="">-- Chọn tên --</option>
            {users.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <div className="divider"><span>hoặc</span></div>

          <label className="field-label" htmlFor="newUserName">➕ Tạo người dùng mới</label>
          <input
            id="newUserName"
            className="input-field"
            type="text"
            maxLength={20}
            placeholder="Nhập tên mới..."
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createNewUser()}
          />
          <button className="btn btn-secondary btn-block mt-16" onClick={createNewUser}>
            Tạo &amp; vào học
          </button>

          <button
            className="btn btn-primary btn-block mt-24"
            onClick={startLearning}
            disabled={!currentUser}
          >
            ▶ Bắt đầu học
          </button>

          <div className="stats-grid">
            <div className="stat-box bg-green">
              <div className="num">{users.length}</div>
              <div className="lbl">Người học</div>
            </div>
            <div className="stat-box bg-blue">
              <div className="num">20+</div>
              <div className="lbl">Từ vựng mẫu</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VIEW 2: DASHBOARD ===== */}
      <section className={`view ${currentView === 'dashboard' ? 'active' : ''}`}>
        <div className="card">
          <div className="row-between">
            <h2 className="app-title" style={{ textAlign: 'left', margin: 0 }}>
              Xin chào, {currentUser}!
            </h2>
            <button className="btn btn-secondary" onClick={logout}>Đổi người</button>
          </div>

          <div className="stats-grid">
            <div className="stat-box bg-blue">
              <div className="num">{stats?.totalLearned ?? 0}</div>
              <div className="lbl">Từ đã học</div>
            </div>
            <div className="stat-box bg-yellow">
              <div className="num">{stats?.dueForReview ?? 0}</div>
              <div className="lbl">Cần ôn</div>
            </div>
            <div className="stat-box bg-green">
              <div className="num">{stats?.accuracy ?? 0}%</div>
              <div className="lbl">Tỷ lệ đúng</div>
            </div>
            <div className="stat-box bg-purple">
              <div className="num">{stats?.progressPercentage ?? 0}%</div>
              <div className="lbl">Tiến độ</div>
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${stats?.progressPercentage ?? 0}%` }}
            />
          </div>

          <div className="mt-24">
            <label className="field-label" htmlFor="topicSelect">📂 Chủ đề (để trống = tất cả)</label>
            <select
              id="topicSelect"
              className="input-field"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">✨ Tất cả chủ đề</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="mt-16">
            <label className="field-label" htmlFor="wordCount">📊 Số từ muốn học</label>
            <input
              id="wordCount"
              type="number"
              className="input-field"
              value={wordCount}
              min={1}
              onChange={(e) => setWordCount(Math.max(1, parseInt(e.target.value) || 5))}
            />
          </div>

          <button className="btn btn-primary btn-block mt-16" onClick={startLearningSession}>
            🎯 HỌC NGAY
          </button>

          <div className="mt-16" style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary btn-block" onClick={showImportModal}>📥 Thêm từ mới</button>
            <button className="btn btn-secondary btn-block" onClick={showWordsManagerModal}>📚 Quản lý từ vựng</button>
            <button className="btn btn-secondary btn-block" onClick={refreshDashboard}>🔄 Làm mới</button>
          </div>

          <div className="card mt-24" style={{ boxShadow: 'none', background: '#f7fafc', padding: '18px' }}>
            <div className="row-between">
              <span className="text-muted">Tổng từ vựng có sẵn</span>
              <strong>{stats?.totalAvailable ?? 0}</strong>
            </div>
            <div className="row-between mt-16">
              <span className="text-muted">Box 1 (mới/đang học)</span>
              <strong>{stats?.box1Count ?? 0}</strong>
            </div>
            <div className="row-between mt-16">
              <span className="text-muted">Box 2 (quen dần)</span>
              <strong>{stats?.box2Count ?? 0}</strong>
            </div>
            <div className="row-between mt-16">
              <span className="text-muted">Box 3 (đã thuộc)</span>
              <strong>{stats?.box3Count ?? 0}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VIEW 3: LEARN ===== */}
      <section className={`view ${currentView === 'learn' ? 'active' : ''}`}>
        <div className="card">
          <div className="row-between">
            <span className="badge">
              Từ {currentIndex + 1}/{wordList.length}
            </span>
            <span className="countdown-badge">⏱ {countdown}s</span>
            <button className="btn btn-secondary" onClick={backToDashboard}>← Quay lại</button>
          </div>

          {currentWord && (
            <div className="mt-16">
              <div className="word-card">
                {currentWord.topic && currentWord.topic !== 'Chung' && (
                  <div className="word-topic">📂 {currentWord.topic}</div>
                )}
                {currentWord.imageUrl && (
                  <img
                    className="word-image"
                    src={currentWord.imageUrl}
                    alt={currentWord.englishWord}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="word-en">{currentWord.englishWord}</div>
                <div className="word-type-row">{getWordTypeHtml(currentWord.wordType)}</div>
                {currentWord.ipa && <div className="word-ipa">{currentWord.ipa}</div>}
                <button
                  className="speak-btn"
                  onClick={() => speak(currentWord.englishWord)}
                  title="Nghe phát âm"
                >
                  🔊
                </button>
                <div className="word-divider" />
                <div className="word-vi">{currentWord.vietnameseMeaning}</div>
              </div>

              <div className="nav-buttons">
                <button className="btn btn-secondary" onClick={prevWord} disabled={currentIndex === 0}>
                  ← Từ trước đó
                </button>
                <button className="btn btn-primary" onClick={nextWord}>
                  Từ kế tiếp →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== OVERLAY: LOADING ===== */}
      <div className={`overlay ${loading ? 'active' : ''}`}>
        <div className="card" style={{ textAlign: 'center', minWidth: '260px' }}>
          <div className="spinner dark" />
          <p className="mt-16">{loadingMessage}</p>
        </div>
      </div>

      {/* ===== OVERLAY: IMPORT CSV ===== */}
      <div className={`overlay ${showImport ? 'active' : ''}`}>
        <div className="modal">
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
            <button className="btn btn-primary" onClick={doImport}>Import</button>
          </div>
        </div>
      </div>

      {/* ===== OVERLAY: WORDS MANAGER ===== */}
      <div className={`overlay ${showWordsManager ? 'active' : ''}`}>
        <div className="modal" style={{ maxWidth: '800px' }}>
          <div className="row-between">
            <h3 style={{ margin: 0 }}>📚 Quản lý từ vựng</h3>
            <button className="btn btn-secondary" onClick={hideWordsManagerModal}>✕</button>
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
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-secondary btn-block mt-8"
              onClick={bulkAutoFindImages}
              title={managerTopicFilter ? `Cập nhật ảnh cho chủ đề "${managerTopicFilter}"` : 'Cập nhật ảnh cho tất cả từ'}
            >
              🖼️ {managerTopicFilter ? `Cập nhật ảnh cho chủ đề "${managerTopicFilter}"` : 'Cập nhật ảnh cho tất cả từ'}
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
                          onClick={() => openWordEditor(w.wordId)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ marginLeft: '4px' }}
                          title="Tự động tìm ảnh"
                          onClick={() => autoFindImage(w)}
                        >
                          🖼️
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

      {/* ===== OVERLAY: WORD EDITOR ===== */}
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
            <button className="btn btn-secondary mt-8" onClick={fetchImageUrlFromUnsplash}>
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
            <button className="btn btn-primary" onClick={saveWord}>Lưu thay đổi</button>
            <button className="btn btn-danger" onClick={deleteCurrentWord}>🗑️ Xóa từ</button>
          </div>
        </div>
      </div>

      {/* ===== OVERLAY: FETCH IMAGE (UNSPLASH) ===== */}
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
                    <button className="btn btn-primary" onClick={useSelectedImage}>✓ Chọn ảnh này</button>
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

      {/* ===== TOAST ===== */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
