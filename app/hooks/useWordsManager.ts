'use client';

import { useCallback, useState } from 'react';
import { fetchVocabList, updateVocab, deleteVocab } from '@/app/services/vocabService';
import { searchUnsplashImages } from '@/app/services/unsplashService';
import type { Vocab, Topic } from '@/lib/types';
import type { UiFeedback } from './useUiFeedback';

const PAGE_SIZE = 20;
const BULK_IMAGE_BATCH_SIZE = 10;

type FetchImageResult = 'success' | 'not_found' | 'rate_limited' | 'error';

/** Gọi Unsplash lấy ảnh đầu tiên cho 1 từ và cập nhật imageUrl của từ đó. */
async function fetchAndApplyImage(word: Vocab): Promise<FetchImageResult> {
  if (!word.englishWord.trim()) return 'not_found';
  try {
    const result = await searchUnsplashImages(word.englishWord.trim(), 1, 1);
    if (result.status === 'rate_limited') return 'rate_limited';
    if (result.status !== 'success') return 'not_found';

    const imageUrl = result.images[0].regular;
    await updateVocab(word.wordId, {
      ipa: word.ipa || '',
      wordType: word.wordType || '',
      vietnameseMeaning: word.vietnameseMeaning || '',
      topic: word.topic || '',
      imageUrl,
    });
    return 'success';
  } catch {
    return 'error';
  }
}

export interface UseWordsManagerResult {
  showWordsManager: boolean;
  managerWords: Vocab[];
  managerTotal: number;
  managerPage: number;
  managerSearchInput: string;
  setManagerSearchInput: (value: string) => void;
  /** topicId đang lọc, hoặc '' nghĩa là tất cả chủ đề. */
  managerTopicFilter: string;
  managerStart: number;
  managerEnd: number;
  managerTotalPages: number;
  showWordsManagerModal: () => void;
  hideWordsManagerModal: () => void;
  renderWordsManager: (search: string, topicId: string, page: number) => Promise<void>;
  refreshCurrentPage: () => void;
  onManagerSearch: (e: React.KeyboardEvent) => void;
  onManagerTopicChange: (value: string) => void;
  managerPrevPage: () => void;
  managerNextPage: () => void;
  confirmDeleteWord: (wordId: string) => Promise<void>;
  autoFindImage: (word: Vocab) => Promise<void>;
  bulkAutoFindImages: () => Promise<void>;
}

/**
 * Hook quản lý modal "Quản lý từ vựng": bảng danh sách có search/filter/phân trang,
 * xóa từ, và cập nhật ảnh tự động (từng từ hoặc hàng loạt theo lô 10).
 * `topics` dùng để tra tên chủ đề hiển thị trong thông báo xác nhận (managerTopicFilter chỉ lưu topicId).
 */
export function useWordsManager(
  ui: UiFeedback,
  loadTopics: () => Promise<void>,
  topics: Topic[]
): UseWordsManagerResult {
  const [showWordsManager, setShowWordsManager] = useState(false);
  const [managerWords, setManagerWords] = useState<Vocab[]>([]);
  const [managerTotal, setManagerTotal] = useState(0);
  const [managerPage, setManagerPage] = useState(1);
  const [managerSearch, setManagerSearch] = useState('');
  const [managerSearchInput, setManagerSearchInput] = useState('');
  const [managerTopicFilter, setManagerTopicFilter] = useState('');

  const renderWordsManager = useCallback(async (search: string, topicId: string, page: number) => {
    ui.setLoading(true);
    try {
      const data = await fetchVocabList(search, topicId, page, PAGE_SIZE);
      setManagerWords(data.words);
      setManagerTotal(data.total);
    } catch {
      ui.showToast('Không thể tải danh sách từ', 'error');
    } finally {
      ui.setLoading(false);
    }
  }, [ui]);

  const refreshCurrentPage = useCallback(() => {
    renderWordsManager(managerSearch, managerTopicFilter, managerPage);
  }, [renderWordsManager, managerSearch, managerTopicFilter, managerPage]);

  const showWordsManagerModal = () => {
    setManagerPage(1);
    setManagerSearch('');
    setManagerSearchInput('');
    setManagerTopicFilter('');
    loadTopics();
    renderWordsManager('', '', 1);
    setShowWordsManager(true);
  };

  const hideWordsManagerModal = () => {
    setShowWordsManager(false);
  };

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

  const managerTotalPages = Math.ceil(managerTotal / PAGE_SIZE);

  const managerNextPage = () => {
    if (managerPage < managerTotalPages) {
      const p = managerPage + 1;
      setManagerPage(p);
      renderWordsManager(managerSearch, managerTopicFilter, p);
    }
  };

  const confirmDeleteWord = async (wordId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa từ này?')) return;
    ui.setLoading(true);
    ui.setLoadingMessage('Đang xóa...');
    try {
      await deleteVocab(wordId);
      ui.showToast('Xóa thành công', 'success');
      refreshCurrentPage();
    } catch {
      ui.showToast('Lỗi khi xóa', 'error');
    } finally {
      ui.setLoading(false);
    }
  };

  const autoFindImage = async (word: Vocab) => {
    if (!word.englishWord.trim()) {
      ui.showToast('Từ không có nội dung tiếng Anh', 'error');
      return;
    }
    ui.setLoading(true);
    ui.setLoadingMessage('Đang tự động tìm ảnh...');
    try {
      const result = await fetchAndApplyImage(word);
      if (result === 'rate_limited') {
        ui.showToast('Đã hết lượt gọi Unsplash API. Vui lòng thực hiện lại sau.', 'error', 4000);
        return;
      }
      if (result !== 'success') {
        ui.showToast(`Không tìm thấy ảnh cho từ "${word.englishWord}"`, 'error');
        return;
      }
      ui.showToast(`Đã tự động cập nhật ảnh cho "${word.englishWord}"`, 'success');
      refreshCurrentPage();
    } catch {
      ui.showToast('Lỗi khi tự động tìm ảnh', 'error');
    } finally {
      ui.setLoading(false);
    }
  };

  /**
   * Cập nhật ảnh cho nhiều từ cùng lúc, xử lý tuần tự theo từng lô (batch) 10 từ.
   * Không chọn chủ đề -> cập nhật tất cả từ. Có chọn chủ đề -> chỉ cập nhật từ thuộc chủ đề đó.
   * Gặp lỗi hết lượt gọi API (rate limit) -> dừng ngay và báo lỗi để thực hiện lại sau.
   */
  const bulkAutoFindImages = async () => {
    const topicId = managerTopicFilter;
    const topicName = topicId ? (topics.find((t) => t.topicId === topicId)?.name || '') : '';
    const confirmMsg = topicName
      ? `Tự động tìm và cập nhật ảnh cho TẤT CẢ từ thuộc chủ đề "${topicName}"?`
      : 'Tự động tìm và cập nhật ảnh cho TẤT CẢ từ vựng (mọi chủ đề)?';
    if (!confirm(confirmMsg)) return;

    ui.setLoading(true);
    ui.setLoadingMessage('Đang tải danh sách từ...');
    try {
      const data = await fetchVocabList('', topicId, 1, 10000);
      const words = data.words;

      if (words.length === 0) {
        ui.showToast('Không có từ nào để cập nhật ảnh', 'info');
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
          ui.setLoadingMessage(
            `Đang cập nhật ảnh ${processedCount}/${words.length} (lô ${Math.floor(batchStart / BULK_IMAGE_BATCH_SIZE) + 1}): ${w.englishWord}...`
          );
          const result = await fetchAndApplyImage(w);
          if (result === 'rate_limited') {
            wasRateLimited = true;
            break outer;
          }
          if (result === 'success') successCount++; else failCount++;
        }
      }

      if (wasRateLimited) {
        ui.showToast(
          `⚠️ Đã hết lượt gọi Unsplash API sau khi xử lý ${processedCount - 1}/${words.length} từ ` +
          `(✅ ${successCount} thành công, ❌ ${failCount} thất bại).\n` +
          `Vui lòng thực hiện lại sau để cập nhật các từ còn lại.`,
          'error',
          7000
        );
      } else {
        ui.showToast(
          `Hoàn tất cập nhật ảnh: ✅ ${successCount} thành công, ❌ ${failCount} thất bại`,
          failCount > 0 ? 'info' : 'success',
          5000
        );
      }
      refreshCurrentPage();
    } catch {
      ui.showToast('Lỗi khi cập nhật ảnh hàng loạt', 'error');
    } finally {
      ui.setLoading(false);
    }
  };

  const managerStart = managerTotal > 0 ? (managerPage - 1) * PAGE_SIZE + 1 : 0;
  const managerEnd = Math.min(managerStart + PAGE_SIZE - 1, managerTotal);

  return {
    showWordsManager, managerWords, managerTotal, managerPage,
    managerSearchInput, setManagerSearchInput, managerTopicFilter,
    managerStart, managerEnd, managerTotalPages,
    showWordsManagerModal, hideWordsManagerModal, renderWordsManager, refreshCurrentPage,
    onManagerSearch, onManagerTopicChange, managerPrevPage, managerNextPage,
    confirmDeleteWord, autoFindImage, bulkAutoFindImages,
  };
}
