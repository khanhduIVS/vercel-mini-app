'use client';

import { useState } from 'react';
import { searchUnsplashImages } from '@/app/services/unsplashService';
import type { UnsplashImage } from '@/lib/types';
import type { UiFeedback } from './useUiFeedback';

export interface UseUnsplashSearchResult {
  showFetchImage: boolean;
  fetchImageWord: string;
  setFetchImageWord: (word: string) => void;
  fetchImageResults: UnsplashImage[];
  fetchImageSelectedUrl: string;
  fetchImageStatus: string;
  fetchImageHasResults: boolean;
  openFetchImageModal: (initialWord: string) => void;
  hideFetchImageModal: () => void;
  doFetchImage: () => Promise<void>;
  selectImage: (img: UnsplashImage) => void;
  /** Gọi khi người dùng xác nhận dùng ảnh đã chọn; page.tsx dùng để set vào word editor. */
  useSelectedImage: (onSelected: (url: string) => void) => void;
  copyImageLink: () => void;
}

/** Hook quản lý modal tìm ảnh Unsplash thủ công (nhập từ khóa, xem kết quả, chọn 1 ảnh). */
export function useUnsplashSearch(ui: UiFeedback): UseUnsplashSearchResult {
  const [showFetchImage, setShowFetchImage] = useState(false);
  const [fetchImageWord, setFetchImageWord] = useState('');
  const [fetchImageResults, setFetchImageResults] = useState<UnsplashImage[]>([]);
  const [fetchImageSelectedUrl, setFetchImageSelectedUrl] = useState('');
  const [fetchImageStatus, setFetchImageStatus] = useState('');
  const [fetchImageHasResults, setFetchImageHasResults] = useState(false);

  const openFetchImageModal = (initialWord: string) => {
    if (!initialWord.trim()) {
      ui.showToast('Vui lòng nhập từ tiếng Anh trước', 'error');
      return;
    }
    setFetchImageWord(initialWord.trim());
    setFetchImageResults([]);
    setFetchImageSelectedUrl('');
    setFetchImageStatus('');
    setFetchImageHasResults(false);
    setShowFetchImage(true);
  };

  const hideFetchImageModal = () => setShowFetchImage(false);

  const doFetchImage = async () => {
    const word = fetchImageWord.trim();
    if (!word) { ui.showToast('Vui lòng nhập từ tiếng Anh', 'error'); return; }

    ui.setLoading(true);
    ui.setLoadingMessage('Đang tìm ảnh...');
    try {
      const result = await searchUnsplashImages(word);
      if (result.status === 'success') {
        setFetchImageResults(result.images);
        setFetchImageHasResults(true);
        setFetchImageStatus(`Tìm thấy ${result.images.length} ảnh. Nhấn để chọn ảnh phù hợp.`);
      } else if (result.status === 'rate_limited') {
        setFetchImageResults([]);
        setFetchImageHasResults(false);
        setFetchImageStatus('❌ Đã hết lượt gọi Unsplash API. Vui lòng thử lại sau.');
      } else {
        setFetchImageResults([]);
        setFetchImageHasResults(false);
        setFetchImageStatus('❌ Không tìm thấy ảnh cho từ này. Thử từ khác!');
      }
    } catch {
      setFetchImageStatus('❌ Lỗi khi tìm ảnh');
    } finally {
      ui.setLoading(false);
    }
  };

  const selectImage = (img: UnsplashImage) => {
    setFetchImageSelectedUrl(img.regular);
  };

  const useSelectedImage = (onSelected: (url: string) => void) => {
    if (fetchImageSelectedUrl) {
      onSelected(fetchImageSelectedUrl);
      setShowFetchImage(false);
      ui.showToast('Đã thêm link ảnh', 'success');
    }
  };

  const copyImageLink = () => {
    if (!fetchImageSelectedUrl) return;
    navigator.clipboard.writeText(fetchImageSelectedUrl).then(
      () => ui.showToast('Đã copy link ảnh vào clipboard', 'success'),
      () => ui.showToast('Không thể copy', 'error')
    );
  };

  return {
    showFetchImage, fetchImageWord, setFetchImageWord,
    fetchImageResults, fetchImageSelectedUrl, fetchImageStatus, fetchImageHasResults,
    openFetchImageModal, hideFetchImageModal, doFetchImage, selectImage, useSelectedImage, copyImageLink,
  };
}
