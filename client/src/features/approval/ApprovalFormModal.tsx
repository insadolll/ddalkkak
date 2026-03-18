import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import api from '@/services/api';

/* ── Types ── */

interface ApprovalFormModalProps {
  onClose: () => void;
  onSaved: () => void;
}

interface UserOption {
  id: string;
  name: string;
  position: string;
}

interface ApprovalStep {
  stepOrder: number;
  approverId: string;
}

const CATEGORY_OPTIONS = [
  { value: '', label: '분류 없음' },
  { value: '업무보고', label: '업무보고' },
  { value: '경비지출', label: '경비지출' },
  { value: '출장신청', label: '출장신청' },
  { value: '기타', label: '기타' },
];

/* ── Component ── */

export default function ApprovalFormModal({ onClose, onSaved }: ApprovalFormModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [steps, setSteps] = useState<ApprovalStep[]>([{ stepOrder: 1, approverId: '' }]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitAndSend, setSubmitAndSend] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ success: boolean; data: UserOption[] }>('/employees', {
        params: { limit: 100 },
      })
      .then((res) => {
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        setUsers(list);
      })
      .catch(() => {});
  }, []);

  const addStep = () => {
    setSteps((prev) => [...prev, { stepOrder: prev.length + 1, approverId: '' }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 })),
    );
  };

  const updateStep = (index: number, approverId: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, approverId } : s)),
    );
  };

  const handleSubmit = async (e: React.FormEvent, submitAfter = false) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }
    if (steps.some((s) => !s.approverId)) {
      setError('모든 결재자를 선택해주세요.');
      return;
    }

    setError('');
    const setLoading = submitAfter ? setSubmitAndSend : setSubmitting;
    setLoading(true);

    try {
      const res = await api.post<{ success: boolean; data: { id: string } }>('/approvals', {
        title,
        content,
        category: category || undefined,
        approvalLine: steps,
      });

      if (submitAfter) {
        await api.post(`/approvals/${res.data.data.id}/submit`);
      }

      onSaved();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError((msg as string) || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">새 결재 문서</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={(e) => handleSubmit(e, false)}
          className="overflow-y-auto flex-1 px-6 py-5 space-y-5"
        >
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
              placeholder="문서 제목을 입력하세요"
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
              placeholder="문서 내용을 작성하세요"
              rows={6}
              className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all resize-none"
            />
          </div>

          {/* Approval Line */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">결재선</label>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#078080]/10 text-[#078080] text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {step.stepOrder}
                  </span>
                  <select
                    value={step.approverId}
                    onChange={(e) => updateStep(i, e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
                  >
                    <option value="">결재자 선택</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.position})
                      </option>
                    ))}
                  </select>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="mt-2 flex items-center gap-1 text-sm text-[#078080] hover:text-[#06706f] font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              결재자 추가
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200/50 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={submitting || submitAndSend}
            className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            초안 저장
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting || submitAndSend}
            className="px-4 py-2.5 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
          >
            {submitAndSend && <Loader2 className="w-4 h-4 animate-spin" />}
            제출하기
          </button>
        </div>
      </div>
    </div>
  );
}
