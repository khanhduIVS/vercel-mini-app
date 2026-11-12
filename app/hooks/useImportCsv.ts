'use client';

import { useRef, useState } from 'react';
import { importVocabCsv } from '@/app/services/vocabService';
import type { UiFeedback } from './useUiFeedback';

export interface UseImportCsvResult {
  showImport: boolean;
  csvInput: string;
  setCsvInput: (value: string) => void;
  fileName: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  showImportModal: () => void;
  hideImportModal: () => void;
  onFilePicked: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  doImport: (onDone: () => void) => Promise<void>;
}

/** Hook quản lý modal "Thêm từ vựng" (import CSV qua file/drag-drop/dán nội dung). */
export function useImportCsv(ui: UiFeedback): UseImportCsvResult {
  const [showImport, setShowImport] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [importFileContent, setImportFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const readImportFile = (file: File) => {
    const name = (file.name || '').toLowerCase();
    if (!/\.(csv|txt)$/.test(name)) {
      ui.showToast('Chỉ hỗ trợ file .csv hoặc .txt', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || '');
      setImportFileContent(content);
      const lines = content.split(/\r?\n/).filter((l) => l.trim());
      setFileName(`✓ ${file.name} (${lines.length} dòng)`);
    };
    reader.onerror = () => ui.showToast('Không đọc được file', 'error');
    reader.readAsText(file, 'UTF-8');
  };

  const onFilePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readImportFile(file);
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

  /** `onDone` được gọi sau khi import thành công (page.tsx dùng để refresh dashboard). */
  const doImport = async (onDone: () => void) => {
    const csv = (importFileContent || csvInput).trim();
    if (!csv) { ui.showToast('Vui lòng chọn file hoặc dán dữ liệu CSV', 'error'); return; }

    ui.setLoading(true);
    ui.setLoadingMessage('Đang import từ vựng...');
    try {
      const result = await importVocabCsv(csv);
      hideImportModal();
      let msg = 'Import hoàn tất!\n';
      msg += `➕ Thêm mới: ${result.imported} dòng\n`;
      msg += `🔄 Cập nhật: ${result.updated} dòng\n`;
      msg += `⏸️ Giữ nguyên: ${result.unchanged} dòng`;
      if (result.errors) msg += `\n⚠️ Lỗi: ${result.errors} dòng`;
      ui.showToast(msg, 'success', 6000);
      onDone();
    } catch {
      ui.showToast('Không thể import', 'error');
    } finally {
      ui.setLoading(false);
    }
  };

  return {
    showImport, csvInput, setCsvInput, fileName, fileInputRef,
    showImportModal, hideImportModal, onFilePicked, onDrop, onDragOver, doImport,
  };
}
