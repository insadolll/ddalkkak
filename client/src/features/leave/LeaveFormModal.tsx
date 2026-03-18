import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '@/services/api';

/* ── Types ── */

interface LeaveFormModalProps {
  onClose: () => void;
  onSaved: () => void;
}

const LEAVE_TYPE_OPTIONS = [
  { value: 'ANNUAL', label: '연차' },
  { value: 'SICK', label: '병가' },
  { value: 'HALF', label: '반차' },
  { value: 'OTHER', label: '기타' },
];

/* ── Component ── */

export default function LeaveFormModal({ onClose, onSaved }: LeaveFormModalProps) {
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      setError('시작일과 종료일을 선택해주세요.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('종료일은 시작일 이후여야 합니다.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await api.post('/leaves', {
        leaveType,
        startDate,
        endDate,
        reason: reason || undefined,
      });
      onSaved();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError((msg as string) || '휴가 신청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-800">휴가 신청</h2>
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

          {/* Leave type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              휴가 유형
            </label>
            <div className="flex gap-2">
              {LEAVE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLeaveType(opt.value)}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                    leaveType === opt.value
                      ? 'bg-[#078080] text-white border-[#078080] shadow-sm'
                      : 'bg-white/80 text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              사유 (선택)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="휴가 사유를 입력해주세요."
              rows={3}
              className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all resize-none"
            />
          </div>

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
              신청하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
