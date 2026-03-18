import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import api from '@/services/api';
import CalendarFormModal from './CalendarFormModal';
import type { CalendarEvent } from './CalendarFormModal';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const EVENT_TYPE_COLORS: Record<string, string> = {
  PERSONAL: 'bg-blue-500',
  TEAM: 'bg-violet-500',
  COMPANY: 'bg-teal-500',
};

const EVENT_TYPE_PILL: Record<string, string> = {
  PERSONAL: 'bg-blue-100 text-blue-700',
  TEAM: 'bg-violet-100 text-violet-700',
  COMPANY: 'bg-teal-100 text-teal-700',
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  PERSONAL: '개인',
  TEAM: '팀',
  COMPANY: '회사',
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Side panel
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Modal
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const start = `${year}-${pad(month + 1)}-01`;
    const lastDay = getDaysInMonth(year, month);
    const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
    try {
      const res = await api.get('/calendar', { params: { start, end } });
      setEvents(res.data.data);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const day = i - firstDay + 1;
    cells.push(day >= 1 && day <= daysInMonth ? day : null);
  }

  // Group events by date string
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    const dateKey = fmtDate(new Date(ev.startTime));
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(ev);
  }

  const todayStr = fmtDate(today);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  const handleFormSaved = () => {
    setShowForm(false);
    setEditEvent(null);
    fetchEvents();
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/calendar/${id}`);
      fetchEvents();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon
            className="w-6 h-6 text-primary"
            strokeWidth={1.75}
          />
          <h2 className="text-xl font-bold text-slate-800">일정공유</h2>
        </div>
        <button
          onClick={() => {
            setEditEvent(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-light shadow-sm transition"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          일정 추가
        </button>
      </div>

      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className="flex-1">
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition"
              >
                <ChevronLeft
                  className="w-5 h-5 text-slate-500"
                  strokeWidth={1.75}
                />
              </button>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-800">
                  {year}년 {month + 1}월
                </h3>
                <button
                  onClick={goToday}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition"
                >
                  오늘
                </button>
              </div>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition"
              >
                <ChevronRight
                  className="w-5 h-5 text-slate-500"
                  strokeWidth={1.75}
                />
              </button>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`py-2.5 text-center text-xs font-medium ${
                    i === 0
                      ? 'text-red-400'
                      : i === 6
                        ? 'text-blue-400'
                        : 'text-slate-400'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day cells */}
            {loading ? (
              <div className="h-[480px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  const dateStr = day
                    ? `${year}-${pad(month + 1)}-${pad(day)}`
                    : '';
                  const dayEvents = dateStr ? (eventsByDate[dateStr] || []) : [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const colIdx = i % 7;
                  const isWeekend = colIdx === 0 || colIdx === 6;

                  return (
                    <button
                      key={i}
                      disabled={!day}
                      onClick={() => day && setSelectedDate(dateStr)}
                      className={`relative min-h-[80px] p-1.5 border-b border-r border-slate-50 text-left transition-colors ${
                        day
                          ? 'hover:bg-primary/5 cursor-pointer'
                          : 'bg-slate-50/30'
                      } ${isSelected ? 'bg-primary/10' : ''}`}
                    >
                      {day && (
                        <>
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm ${
                              isToday
                                ? 'bg-primary text-white font-semibold'
                                : isWeekend && colIdx === 0
                                  ? 'text-red-400'
                                  : isWeekend
                                    ? 'text-blue-400'
                                    : 'text-slate-600'
                            }`}
                          >
                            {day}
                          </span>
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {dayEvents.slice(0, 3).map((ev) => (
                              <span
                                key={ev.id}
                                className={`w-1.5 h-1.5 rounded-full ${EVENT_TYPE_COLORS[ev.eventType] || 'bg-slate-400'}`}
                                title={ev.title}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-[10px] text-slate-400 leading-none">
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 px-2">
            {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-slate-400">
                  {EVENT_TYPE_LABEL[type]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel — events for selected date */}
        <div className="w-[320px] flex-shrink-0">
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm p-5 sticky top-24">
            {selectedDate ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-800">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString(
                      'ko-KR',
                      {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                      },
                    )}
                  </h4>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 transition"
                  >
                    <X
                      className="w-4 h-4 text-slate-400"
                      strokeWidth={1.75}
                    />
                  </button>
                </div>

                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">
                    등록된 일정이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="group bg-white/60 border border-slate-100 rounded-xl p-3 hover:border-primary/30 transition cursor-pointer"
                        onClick={() => {
                          setEditEvent(ev);
                          setShowForm(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-slate-800 truncate">
                              {ev.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {ev.allDay
                                ? '종일'
                                : `${fmtTime(ev.startTime)} - ${fmtTime(ev.endTime)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${EVENT_TYPE_PILL[ev.eventType]}`}
                            >
                              {EVENT_TYPE_LABEL[ev.eventType]}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(ev.id);
                              }}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>
                        {ev.description && (
                          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                            {ev.description}
                          </p>
                        )}
                        {ev.department && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500">
                            {ev.department.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    setEditEvent(null);
                    setShowForm(true);
                  }}
                  className="w-full mt-4 py-2 rounded-xl text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 transition"
                >
                  + 일정 추가
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon
                  className="w-8 h-8 text-slate-300 mx-auto mb-2"
                  strokeWidth={1.75}
                />
                <p className="text-sm text-slate-400">
                  날짜를 선택하면
                  <br />
                  일정을 확인할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <CalendarFormModal
          event={editEvent}
          defaultDate={selectedDate || undefined}
          onClose={() => {
            setShowForm(false);
            setEditEvent(null);
          }}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
