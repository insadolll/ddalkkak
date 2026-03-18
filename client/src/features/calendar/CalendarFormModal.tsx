import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';

type EventType = 'PERSONAL' | 'TEAM' | 'COMPANY';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  eventType: EventType;
  owner: { id: string; name: string };
  department: { id: string; name: string } | null;
}

interface Props {
  event: CalendarEvent | null;
  defaultDate?: string; // YYYY-MM-DD
  onClose: () => void;
  onSaved: () => void;
}

const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: 'PERSONAL', label: '개인' },
  { value: 'TEAM', label: '팀' },
  { value: 'COMPANY', label: '회사' },
];

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CalendarFormModal({
  event,
  defaultDate,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!event;

  const initStart = defaultDate ? `${defaultDate}T09:00` : '';
  const initEnd = defaultDate ? `${defaultDate}T18:00` : '';

  const [form, setForm] = useState({
    title: '',
    description: '',
    startTime: initStart,
    endTime: initEnd,
    allDay: false,
    eventType: 'PERSONAL' as EventType,
    departmentId: '',
  });
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get('/employees/departments')
      .then((r) => setDepartments(r.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title,
        description: event.description || '',
        startTime: toLocalDatetime(event.startTime),
        endTime: toLocalDatetime(event.endTime),
        allDay: event.allDay,
        eventType: event.eventType,
        departmentId: event.department?.id || '',
      });
    }
  }, [event]);

  const set = (key: string, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!form.title || !form.startTime || !form.endTime) {
      setErr('제목, 시작/종료 시간을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        allDay: form.allDay,
        eventType: form.eventType,
        departmentId: form.departmentId || undefined,
      };
      if (isEdit) {
        await api.put(`/calendar/${event.id}`, payload);
      } else {
        await api.post('/calendar', payload);
      }
      onSaved();
    } catch (error: unknown) {
      const msg =
        (
          error as {
            response?: { data?: { error?: { message?: string } } };
          }
        )?.response?.data?.error?.message || '저장에 실패했습니다.';
      setErr(msg);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white/95 backdrop-blur-2xl rounded-[20px] shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {isEdit ? '일정 수정' : '일정 추가'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5 text-slate-400" strokeWidth={1.75} />
          </button>
        </div>

        {err && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            {err}
          </p>
        )}

        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              제목 *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              설명
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
            />
          </div>

          {/* allDay */}
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => set('allDay', e.target.checked)}
              className="rounded"
            />
            종일 일정
          </label>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                시작 *
              </label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                종료 *
              </label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
            </div>
          </div>

          {/* Event type */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              유형
            </label>
            <select
              value={form.eventType}
              onChange={(e) => set('eventType', e.target.value)}
              className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
            >
              {eventTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Department (optional, for TEAM events) */}
          {form.eventType === 'TEAM' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                부서
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => set('departmentId', e.target.value)}
                className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              >
                <option value="">선택</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-light transition disabled:opacity-50"
          >
            {saving ? '저장 중...' : isEdit ? '수정' : '추가'}
          </button>
        </div>
      </form>
    </div>
  );
}
