import { useState } from 'react';
import { X, Loader2, EyeOff } from 'lucide-react';
import api from '@/services/api';

/* ── Types ── */

interface SuggestionFormModalProps {
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORY_OPTIONS = [
  { value: '업무개선', label: '업무개선' },
  { value: '시스템', label: '시스템' },
  { value: '복지', label: '복지' },
  { value: '기타', label: '기타' },
];

/* ── Component ── */

export default function SuggestionFormModal({ onClose, onSaved }: SuggestionFormModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('기타');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await api.post('/suggestions', {
        title,
        content,
        category,
        isAnonymous,
      });
      onSaved();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError((msg as string) || '건의사항 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-800">새 건의사항</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="건의 제목"
              className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">분류</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="건의 내용을 작성해주세요"
              rows={5}
              className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all resize-none"
            />
          </div>

          {/* Anonymous checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-lg border-2 border-slate-300 bg-white peer-checked:bg-[#078080] peer-checked:border-[#078080] transition-all flex items-center justify-center">
                {isAnonymous && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <span className="text-sm text-slate-600 group-hover:text-slate-700">
                익명으로 제출
              </span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
