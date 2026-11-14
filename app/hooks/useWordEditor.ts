'use client';

import { useState } from 'react';
import { fetchVocabById, updateVocab, deleteVocab } from '@/app/services/vocabService';
import type { UiFeedback } from './useUiFeedback';

export interface UseWordEditorResult {
  showWordEditor: boolean;
  editWordId: string | null;
  editEnglish: string;
  editIpa: string;
  setEditIpa: (value: string) => void;
  ipaLoading: boolean;
  fetchIpa: () => Promise<void>;
  editWordType: string;
  setEditWordType: (value: string) => void;
  editMeaning: string;
  setEditMeaning: (value: string) => void;
  editTopic: string;
  setEditTopic: (value: string) => void;
  editImageUrl: string;
  setEditImageUrl: (value: string) => void;
  clearImage: boolean;
  setClearImage: (value: boolean) => void;
  openWordEditor: (wordId: string) => Promise<void>;
  closeWordEditor: () => void;
  saveWord: (onSaved: () => void) => Promise<void>;
  deleteCurrentWord: (onDeleted: () => void) => Promise<void>;
}

/** Hook quản lý modal "Chỉnh sửa từ" (xem/sửa/xóa 1 từ vựng). */
export function useWordEditor(ui: UiFeedback): UseWordEditorResult {
  const [showWordEditor, setShowWordEditor] = useState(false);
  const [editWordId, setEditWordId] = useState<string | null>(null);
  const [editEnglish, setEditEnglish] = useState('');
  const [editIpa, setEditIpa] = useState('');
  const [editWordType, setEditWordType] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [clearImage, setClearImage] = useState(false);
  const [ipaLoading, setIpaLoading] = useState(false);

  const openWordEditor = async (wordId: string) => {
    ui.setLoading(true);
    ui.setLoadingMessage('Đang tải thông tin từ...');
    try {
      const word = await fetchVocabById(wordId);
      if (!word) { ui.showToast('Không tìm thấy từ', 'error'); return; }
      setEditWordId(wordId);
      setEditEnglish(word.englishWord);
      setEditIpa(word.ipa || '');
      setEditWordType(word.wordType || '');
      setEditMeaning(word.vietnameseMeaning);
      setEditTopic(word.topic || '');
      setEditImageUrl(word.imageUrl || '');
      setClearImage(false);
      setShowWordEditor(true);
    } catch {
      ui.showToast('Không thể tải thông tin từ', 'error');
    } finally {
      ui.setLoading(false);
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
    setClearImage(false);
  };

  /** Gọi Free Dictionary API để lấy phiên âm (IPA) cho từ hiện tại. */
  const fetchIpa = async () => {
    if (!editEnglish.trim()) return;
    setIpaLoading(true);
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(editEnglish.trim())}`
      );
      if (!res.ok) {
        ui.showToast('Không tìm thấy phiên âm cho từ này', 'info');
        return;
      }
      const data = await res.json();
      // Lấy phonetic đầu tiên có text (ưu tiên phonetics[], fallback về phonetic field)
      const phonetics: { text?: string }[] = data?.[0]?.phonetics || [];
      const found = phonetics.find((p: { text?: string }) => p.text?.trim());
      const ipa = found?.text?.trim() || data?.[0]?.phonetic?.trim() || '';
      if (ipa) {
        setEditIpa(ipa);
        ui.showToast(`Đã cập nhật phiên âm: ${ipa}`, 'success');
      } else {
        ui.showToast('Không tìm thấy phiên âm cho từ này', 'info');
      }
    } catch {
      ui.showToast('Lỗi khi lấy phiên âm', 'error');
    } finally {
      setIpaLoading(false);
    }
  };

  /** `onSaved` dùng để page.tsx refresh lại bảng quản lý từ sau khi lưu. */
  const saveWord = async (onSaved: () => void) => {
    if (!editWordId) return;
    ui.setLoading(true);
    ui.setLoadingMessage('Đang lưu...');
    try {
      await updateVocab(editWordId, {
        ipa: editIpa,
        wordType: editWordType,
        vietnameseMeaning: editMeaning,
        topic: editTopic,
        imageUrl: editImageUrl,
        clearImage,
      });
      ui.showToast('Cập nhật thành công', 'success');
      closeWordEditor();
      onSaved();
    } catch {
      ui.showToast('Lỗi khi cập nhật', 'error');
    } finally {
      ui.setLoading(false);
    }
  };

  /** `onDeleted` dùng để page.tsx refresh lại bảng quản lý từ sau khi xóa. */
  const deleteCurrentWord = async (onDeleted: () => void) => {
    if (!editWordId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa từ này?')) return;
    ui.setLoading(true);
    ui.setLoadingMessage('Đang xóa...');
    try {
      await deleteVocab(editWordId);
      ui.showToast('Xóa thành công', 'success');
      closeWordEditor();
      onDeleted();
    } catch {
      ui.showToast('Lỗi khi xóa', 'error');
    } finally {
      ui.setLoading(false);
    }
  };

  return {
    showWordEditor, editWordId, editEnglish,
    editIpa, setEditIpa, ipaLoading, fetchIpa,
    editWordType, setEditWordType,
    editMeaning, setEditMeaning, editTopic, setEditTopic,
    editImageUrl, setEditImageUrl,
    clearImage, setClearImage,
    openWordEditor, closeWordEditor, saveWord, deleteCurrentWord,
  };
}
