import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '@/services/api';

/* ── Types ── */

interface Company {
  id: number;
  name: string;
  code?: string;
}

interface ProjectData {
  id: number;
  name: string;
  client: { id: number; name: string } | null;
  supplier: { id: number; name: string } | null;
  manager: { id: number; name: string } | null;
  startDate: string | null;
  endDate: string | null;
  memo: string | null;
}

interface Props {
  project?: ProjectData | null;
  onClose: () => void;
  onSaved: () => void;
}

/* ── Component ── */

export default function ProjectFormModal({ project, onClose, onSaved }: Props) {
  const isEdit = !!project;

  const [name, setName] = useState(project?.name || '');
  const [clientId, setClientId] = useState<number | ''>(
    project?.client?.id ?? '',
  );
  const [supplierId, setSupplierId] = useState<number | ''>(
    project?.supplier?.id ?? '',
  );
  const [managerName, setManagerName] = useState(
    project?.manager?.name || '',
  );
  const [startDate, setStartDate] = useState(
    project?.startDate?.slice(0, 10) || '',
  );
  const [endDate, setEndDate] = useState(
    project?.endDate?.slice(0, 10) || '',
  );
  const [memo, setMemo] = useState(project?.memo || '');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ data: Company[]; pagination: unknown }>('/companies', {
        params: { limit: 200 },
      })
      .then((res) => setCompanies(res.data.data))
      .catch(() => {
        /* ignore */
      });
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('프로젝트명을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        clientId: clientId || undefined,
        supplierId: supplierId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        memo: memo.trim() || undefined,
      };

      if (isEdit) {
        await api.put(`/projects/${project.id}`, body);
      } else {
        await api.post('/projects', body);
      }
      onSaved();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : '저장에 실패했습니다.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[20px] shadow-2xl border border-white/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? '프로젝트 수정' : '새 프로젝트'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Project name */}
          <FieldWrapper label="프로젝트명" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="프로젝트명을 입력하세요"
              className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
              autoFocus
            />
          </FieldWrapper>

          {/* Client / Supplier in row */}
          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="고객사">
              <select
                value={clientId}
                onChange={(e) =>
                  setClientId(e.target.value ? Number(e.target.value) : '')
                }
                className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all appearance-none"
              >
                <option value="">선택하세요</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FieldWrapper>

            <FieldWrapper label="매입처">
              <select
                value={supplierId}
                onChange={(e) =>
                  setSupplierId(e.target.value ? Number(e.target.value) : '')
                }
                className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all appearance-none"
              >
                <option value="">선택하세요</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FieldWrapper>
          </div>

          {/* Manager (placeholder text input) */}
          <FieldWrapper label="담당자">
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="담당자명 (추후 선택으로 변경 예정)"
              className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
              disabled
            />
          </FieldWrapper>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="시작일">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
              />
            </FieldWrapper>

            <FieldWrapper label="종료일">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
              />
            </FieldWrapper>
          </div>

          {/* Memo */}
          <FieldWrapper label="메모">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="프로젝트 관련 메모"
              rows={3}
              className="w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all resize-none"
            />
          </FieldWrapper>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isSaving && (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              )}
              {isEdit ? '저장' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Field wrapper ── */

function FieldWrapper({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">
        {label}
        {required && <span className="text-[#F45D48] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
