'use client';

import { useState, useEffect, useCallback } from 'react';

interface Vocab {
  id: number;
  word: string;
  meaning: string;
  example: string | null;
}

export default function Home() {
  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchVocabs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vocab');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVocabs(data);
      setError('');
    } catch {
      setError('Không thể tải danh sách từ vựng. Vui lòng kiểm tra kết nối database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVocabs();
  }, [fetchVocabs]);

  const resetForm = () => {
    setWord('');
    setMeaning('');
    setExample('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) return;

    setSubmitting(true);
    try {
      if (editingId !== null) {
        const res = await fetch(`/api/vocab/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, meaning, example }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setVocabs(vocabs.map((v) => (v.id === editingId ? updated : v)));
      } else {
        const res = await fetch('/api/vocab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, meaning, example }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setVocabs([created, ...vocabs]);
      }
      resetForm();
      setError('');
    } catch {
      setError('Thao tác thất bại. Vui lòng kiểm tra kết nối database.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (vocab: Vocab) => {
    setEditingId(vocab.id);
    setWord(vocab.word);
    setMeaning(vocab.meaning);
    setExample(vocab.example || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/vocab/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setVocabs(vocabs.filter((v) => v.id !== id));
      if (editingId === id) resetForm();
    } catch {
      setError('Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            📖 Học Từ Vựng Tiếng Anh
          </h1>
          <p className="text-gray-500">Thêm, sửa và quản lý danh sách từ vựng của bạn</p>
        </header>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600 shrink-0"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              {editingId !== null ? '✏️ Sửa từ vựng' : '➕ Thêm từ vựng mới'}
            </h2>
            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Hủy
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Từ tiếng Anh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="VD: accommodate"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nghĩa tiếng Việt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="VD: cho trú ngụ, cung cấp chỗ ở"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Ví dụ (tùy chọn)
              </label>
              <textarea
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="VD: The hotel can accommodate up to 500 guests."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Đang xử lý...'
                : editingId !== null
                ? 'Lưu thay đổi'
                : 'Thêm từ vựng'}
            </button>
          </div>
        </form>

        {/* Vocab List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Danh sách từ vựng
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({vocabs.length} từ)
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Đang tải...</div>
          ) : vocabs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-5xl mb-3">📚</p>
              <p className="text-gray-400">Chưa có từ vựng nào. Hãy thêm từ đầu tiên!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vocabs.map((vocab) => (
                <div
                  key={vocab.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  {deleteId === vocab.id ? (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        Xác nhận xóa &ldquo;{vocab.word}&rdquo;?
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(vocab.id)}
                          className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition"
                        >
                          Xóa
                        </button>
                        <button
                          onClick={() => setDeleteId(null)}
                          className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-indigo-600 mb-1">
                            {vocab.word}
                          </h3>
                          <p className="text-gray-700">{vocab.meaning}</p>
                          {vocab.example && (
                            <p className="text-sm text-gray-400 italic mt-2">
                              💬 {vocab.example}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(vocab)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Sửa"
                            aria-label="Sửa từ vựng"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteId(vocab.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Xóa"
                            aria-label="Xóa từ vựng"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
