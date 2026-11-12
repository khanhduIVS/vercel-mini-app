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
  editWordType: string;
  setEditWordType: (value: string) => void;
  editMeaning: string;
  setEditMeaning: (value: string) => void;
  editTopic: string;
  setEditTopic: (value: string) => void;
  editImageUrl: string;
  setEditImageUrl: (value: string) => void;
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
    editIpa, setEditIpa, editWordType, setEditWordType,
    editMeaning, setEditMeaning, editTopic, setEditTopic,
    editImageUrl, setEditImageUrl,
    openWordEditor, closeWordEditor, saveWord, deleteCurrentWord,
  };
}
