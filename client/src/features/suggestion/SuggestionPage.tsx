import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import {
  Plus,
  Loader2,
  MessageSquarePlus,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import SuggestionFormModal from './SuggestionFormModal';

/* ── Types ── */

interface SuggestionAuthor {
  id: string;
  name: string;
  department: { name: string } | null;
}

interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: string;
  isAnonymous: boolean;
  status: string;
  adminNote: string | null;
  createdAt: string;
  author: SuggestionAuthor | null;
  authorId: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ── Constants ── */

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: '접수', color: 'bg-teal-50 text-[#078080] border-teal-200' },
  REVIEWED: { label: '검토중', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  CLOSED: { label: '완료', color: 'bg-slate-50 text-slate-500 border-slate-200' },
};

const CATEGORY_COLORS: Record<string, string> = {
  '업무개선': 'bg-blue-50 text-blue-600 border-blue-200',
  '시스템': 'bg-violet-50 text-violet-600 border-violet-200',
  '복지': 'bg-green-50 text-green-600 border-green-200',
  '기타': 'bg-slate-50 text-slate-500 border-slate-200',
};

/* ── Helpers ── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/* ── Component ── */

export default function SuggestionPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [tab, setTab] = useState<'mine' | 'all'>(isAdmin ? 'all' : 'mine');
  const [mySuggestions, setMySuggestions] = useState<Suggestion[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([]);
  const [allPagination, setAllPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Admin detail
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [adminStatus, setAdminStatus] = useState('OPEN');
  const [saving, setSaving] = useState(false);

  const fetchMine = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Suggestion[] }>('/suggestions/mine');
      setMySuggestions(res.data.data);
    } catch {
      setMySuggestions([]);
    }
  }, []);

  const fetchAll = useCallback(
    async (page: number) => {
      try {
        const res = await api.get<{
          success: boolean;
          data: Suggestion[];
          pagination: Pagination;
        }>('/suggestions', { params: { page, limit: 20 } });
        setAllSuggestions(res.data.data);
        setAllPagination(res.data.pagination);
      } catch {
        setAllSuggestions([]);
      }
    },
    [],
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await fetchMine();
    if (isAdmin) {
      await fetchAll(1);
    }
    setIsLoading(false);
  }, [fetchMine, fetchAll, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDetail = async (id: string) => {
    try {
      const res = await api.get<{ success: boolean; data: Suggestion }>(
        `/suggestions/${id}`,
      );
      const s = res.data.data;
      setSelectedSuggestion(s);
      setAdminNote(s.adminNote ?? '');
      setAdminStatus(s.status);
    } catch {
      // handle error
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedSuggestion) return;
    setSaving(true);
    try {
      await api.patch(`/suggestions/${selectedSuggestion.id}/status`, {
        status: adminStatus,
        adminNote,
      });
      setSelectedSuggestion(null);
      fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const displayList = tab === 'all' ? allSuggestions : mySuggestions;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">익명으로도 건의할 수 있습니다</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] active:scale-[0.97] transition-all duration-200 shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          새 건의
        </button>
      </div>

      {/* ── Admin Tabs ── */}
      {isAdmin && (
        <div className="flex items-center gap-1 p-1 bg-white/60 backdrop-blur-xl border border-white/30 rounded-xl w-fit">
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === 'all'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            전체 건의 ({allPagination.total})
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === 'mine'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            내 건의 ({mySuggestions.length})
          </button>
        </div>
      )}

      {/* ── Suggestion Cards ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#078080] animate-spin" strokeWidth={1.75} />
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <MessageSquarePlus className="w-8 h-8 text-slate-300" strokeWidth={1.75} />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            등록된 건의사항이 없습니다
          </h3>
          <p className="text-sm text-slate-400">새 건의를 등록해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map((s) => {
            const statusConfig = STATUS_CONFIG[s.status] || STATUS_CONFIG.OPEN;
            const categoryColor =
              CATEGORY_COLORS[s.category] || CATEGORY_COLORS['기타'];

            return (
              <div
                key={s.id}
                onClick={isAdmin && tab === 'all' ? () => openDetail(s.id) : undefined}
                className={`bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm transition-all duration-300 ${
                  isAdmin && tab === 'all'
                    ? 'cursor-pointer hover:shadow-md hover:translate-y-[-1px]'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryColor}`}>
                        {s.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      {s.isAnonymous && (
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-[15px] font-semibold text-slate-800 mb-1 line-clamp-1">
                      {s.title}
                    </h3>

                    {/* Content preview */}
                    <p className="text-xs text-slate-400 line-clamp-2">{s.content}</p>
                  </div>

                  {/* Meta */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{formatDate(s.createdAt)}</p>
                    {tab === 'all' && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 justify-end">
                        {s.isAnonymous ? (
                          <>
                            <EyeOff className="w-3 h-3" strokeWidth={1.75} />
                            <span>익명</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3" strokeWidth={1.75} />
                            <span>{s.author?.name ?? '-'}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin note (for "mine" tab) */}
                {s.adminNote && tab === 'mine' && (
                  <div className="mt-3 bg-[#078080]/5 border border-[#078080]/10 rounded-xl px-4 py-3">
                    <p className="text-xs font-medium text-[#078080] mb-0.5">관리자 답변</p>
                    <p className="text-xs text-slate-700">{s.adminNote}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination (all tab) ── */}
      {tab === 'all' && allPagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: allPagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchAll(p)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                allPagination.page === p
                  ? 'bg-[#078080] text-white shadow-sm'
                  : 'bg-white/80 border border-white/30 text-slate-500 hover:bg-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── Admin Detail Modal ── */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedSuggestion(null)}
          />
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50 shrink-0">
              <h2 className="text-lg font-semibold text-slate-800">건의 상세</h2>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <Eye className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    CATEGORY_COLORS[selectedSuggestion.category] || CATEGORY_COLORS['기타']
                  }`}
                >
                  {selectedSuggestion.category}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    (STATUS_CONFIG[selectedSuggestion.status] || STATUS_CONFIG.OPEN).color
                  }`}
                >
                  {(STATUS_CONFIG[selectedSuggestion.status] || STATUS_CONFIG.OPEN).label}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {selectedSuggestion.title}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedSuggestion.isAnonymous
                  ? '익명'
                  : `${selectedSuggestion.author?.name ?? '-'} | ${selectedSuggestion.author?.department?.name ?? ''}`}{' '}
                | {formatDate(selectedSuggestion.createdAt)}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/60 rounded-xl p-4">
                {selectedSuggestion.content}
              </p>

              {/* Admin controls */}
              <div className="border-t border-slate-200/50 pt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    상태 변경
                  </label>
                  <select
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
                  >
                    <option value="OPEN">접수</option>
                    <option value="REVIEWED">검토중</option>
                    <option value="CLOSED">완료</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    관리자 메모
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="답변 또는 메모를 남겨주세요"
                    rows={3}
                    className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-slate-200/50 flex gap-2 justify-end">
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={saving}
                className="px-4 py-2 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Form Modal ── */}
      {showForm && (
        <SuggestionFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
