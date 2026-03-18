import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import {
  Plus,
  Loader2,
  CalendarDays,
  MapPin,
  User,
  Briefcase,
  Target,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Trash2,
  ClipboardList,
} from 'lucide-react';

/* ── Types ── */

interface MeetingAuthor {
  id: string;
  name: string;
  employeeNo: string;
  position: string;
  department: { name: string } | null;
}

interface MeetingListItem {
  id: string;
  title: string;
  meetingType: string;
  meetingDate: string;
  meetingTime: string | null;
  location: string | null;
  createdBy: MeetingAuthor | null;
  _count: {
    workItems: number;
    planItems: number;
    monthlyReports: number;
  };
}

interface MeetingWorkItem {
  id: string;
  category: string | null;
  client: string | null;
  content: string;
  progress: string | null;
  status: string | null;
  assignee: string | null;
  remarks: string | null;
  author: MeetingAuthor | null;
}

interface MeetingPlanItem {
  id: string;
  category: string | null;
  client: string | null;
  content: string;
  targetDate: string | null;
  priority: string | null;
  assignee: string | null;
  remarks: string | null;
  author: MeetingAuthor | null;
}

interface MeetingIssue {
  id: string;
  category: string | null;
  client: string | null;
  content: string;
  urgency: string | null;
  actionStatus: string | null;
  assignee: string | null;
  remarks: string | null;
  author: MeetingAuthor | null;
}

interface MeetingDecision {
  id: string;
  category: string | null;
  content: string;
  deadline: string | null;
  assignee: string | null;
  remarks: string | null;
  author: MeetingAuthor | null;
}

interface MeetingDetail {
  id: string;
  title: string;
  meetingType: string;
  meetingDate: string;
  meetingTime: string | null;
  location: string | null;
  memo: string | null;
  announcement: string | null;
  createdBy: MeetingAuthor | null;
  createdById: string;
  workItems: MeetingWorkItem[];
  planItems: MeetingPlanItem[];
  issues: MeetingIssue[];
  decisions: MeetingDecision[];
  monthlyReports: { id: string; prevMonth: string | null; currentMonth: string | null; author: MeetingAuthor | null }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ── Constants ── */

const TABS = [
  { key: 'WEEKLY', label: '주간회의록' },
  { key: 'MONTHLY', label: '월간회의록' },
] as const;

/* ── Helpers ── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/* ── Component ── */

export default function MeetingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Detail view
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    workItems: true,
    planItems: true,
    issues: false,
    decisions: false,
  });

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [createTime, setCreateTime] = useState('');
  const [createLocation, setCreateLocation] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchMeetings = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const res = await api.get<{
          success: boolean;
          data: MeetingListItem[];
          pagination: Pagination;
        }>('/meetings', { params: { page, limit: 20, meetingType: activeTab } });

        setMeetings(res.data.data);
        setPagination(res.data.pagination);
      } catch {
        setMeetings([]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab],
  );

  useEffect(() => {
    fetchMeetings(1);
  }, [fetchMeetings]);

  const handleTabChange = (tab: 'WEEKLY' | 'MONTHLY') => {
    setActiveTab(tab);
    setDetail(null);
  };

  const openDetail = async (meetingId: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: MeetingDetail }>(
        `/meetings/${meetingId}`,
      );
      setDetail(res.data.data);
    } catch {
      // handle error
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm('이 회의록을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/meetings/${meetingId}`);
      setDetail(null);
      fetchMeetings(1);
    } catch {
      // handle error
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createDate) return;

    setCreating(true);
    try {
      await api.post('/meetings', {
        title: createTitle,
        meetingType: activeTab,
        meetingDate: createDate,
        meetingTime: createTime || undefined,
        location: createLocation || undefined,
      });
      setShowCreateForm(false);
      setCreateTitle('');
      setCreateDate('');
      setCreateTime('');
      setCreateLocation('');
      fetchMeetings(1);
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  };

  const canDelete =
    detail &&
    (detail.createdById === user?.id || user?.role === 'ADMIN');

  // ── Detail View ──
  if (detail) {
    const isWeekly = detail.meetingType === 'WEEKLY';

    return (
      <div className="space-y-5 max-w-5xl">
        {/* Back button + header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setDetail(null)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            목록으로
          </button>
          {canDelete && (
            <button
              onClick={() => handleDelete(detail.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              삭제
            </button>
          )}
        </div>

        {/* Meeting info */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{detail.title}</h2>
            <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#078080]/10 text-[#078080] border border-[#078080]/20">
              {isWeekly ? '주간' : '월간'}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <span>{formatDate(detail.meetingDate)}</span>
            </div>
            {detail.meetingTime && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">|</span>
                <span>{detail.meetingTime}</span>
              </div>
            )}
            {detail.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                <span>{detail.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              <span>{detail.createdBy?.name ?? '-'}</span>
            </div>
          </div>
        </div>

        {/* ── Weekly sections ── */}
        {isWeekly && (
          <>
            <CollapsibleSection
              title="업무 현황"
              icon={<Briefcase className="w-4 h-4" strokeWidth={1.75} />}
              count={detail.workItems.length}
              expanded={expandedSections.workItems}
              onToggle={() => toggleSection('workItems')}
            >
              {detail.workItems.length === 0 ? (
                <p className="text-sm text-slate-400 py-3">등록된 업무가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {detail.workItems.map((item) => (
                    <div key={item.id} className="bg-slate-50/60 rounded-xl p-3">
                      <p className="text-sm text-slate-700">{item.content}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                        {item.category && <span>분류: {item.category}</span>}
                        {item.client && <span>고객: {item.client}</span>}
                        {item.progress && <span>진행: {item.progress}</span>}
                        {item.status && <span>상태: {item.status}</span>}
                        {item.assignee && <span>담당: {item.assignee}</span>}
                      </div>
                      {item.remarks && (
                        <p className="text-xs text-slate-400 mt-1">* {item.remarks}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="업무 계획"
              icon={<Target className="w-4 h-4" strokeWidth={1.75} />}
              count={detail.planItems.length}
              expanded={expandedSections.planItems}
              onToggle={() => toggleSection('planItems')}
            >
              {detail.planItems.length === 0 ? (
                <p className="text-sm text-slate-400 py-3">등록된 계획이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {detail.planItems.map((item) => (
                    <div key={item.id} className="bg-slate-50/60 rounded-xl p-3">
                      <p className="text-sm text-slate-700">{item.content}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                        {item.category && <span>분류: {item.category}</span>}
                        {item.targetDate && (
                          <span>목표일: {formatDate(item.targetDate)}</span>
                        )}
                        {item.priority && <span>우선순위: {item.priority}</span>}
                        {item.assignee && <span>담당: {item.assignee}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="이슈 / 문제점"
              icon={<AlertTriangle className="w-4 h-4" strokeWidth={1.75} />}
              count={detail.issues.length}
              expanded={expandedSections.issues}
              onToggle={() => toggleSection('issues')}
            >
              {detail.issues.length === 0 ? (
                <p className="text-sm text-slate-400 py-3">등록된 이슈가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {detail.issues.map((item) => (
                    <div key={item.id} className="bg-slate-50/60 rounded-xl p-3">
                      <p className="text-sm text-slate-700">{item.content}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                        {item.urgency && <span>긴급도: {item.urgency}</span>}
                        {item.actionStatus && <span>조치: {item.actionStatus}</span>}
                        {item.assignee && <span>담당: {item.assignee}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="결정 사항"
              icon={<CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />}
              count={detail.decisions.length}
              expanded={expandedSections.decisions}
              onToggle={() => toggleSection('decisions')}
            >
              {detail.decisions.length === 0 ? (
                <p className="text-sm text-slate-400 py-3">등록된 결정 사항이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {detail.decisions.map((item) => (
                    <div key={item.id} className="bg-slate-50/60 rounded-xl p-3">
                      <p className="text-sm text-slate-700">{item.content}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                        {item.deadline && <span>기한: {item.deadline}</span>}
                        {item.assignee && <span>담당: {item.assignee}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>
          </>
        )}

        {/* ── Monthly sections ── */}
        {!isWeekly && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">월간 보고</h3>
            {detail.monthlyReports.length === 0 ? (
              <p className="text-sm text-slate-400">등록된 보고가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {detail.monthlyReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-slate-50/60 rounded-xl p-4"
                  >
                    <p className="text-xs text-slate-400 mb-2">
                      {report.author?.name ?? '알 수 없음'} ({report.author?.department?.name ?? ''})
                    </p>
                    {report.prevMonth && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-slate-500 mb-1">전월 실적</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {report.prevMonth}
                        </p>
                      </div>
                    )}
                    {report.currentMonth && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">금월 계획</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {report.currentMonth}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Memo / Announcement */}
        {detail.memo && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              {isWeekly ? '특이사항 / 메모' : '업무 특이사항'}
            </h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{detail.memo}</p>
          </div>
        )}
        {!isWeekly && detail.announcement && (
          <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">공지사항</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{detail.announcement}</p>
          </div>
        )}
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="space-y-6">
      {/* ── Tabs + Action ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-white/60 backdrop-blur-xl border border-white/30 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] active:scale-[0.97] transition-all duration-200 shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          회의록 생성
        </button>
      </div>

      {/* ── Meeting Cards ── */}
      {isLoading || detailLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#078080] animate-spin" strokeWidth={1.75} />
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <ClipboardList className="w-8 h-8 text-slate-300" strokeWidth={1.75} />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {activeTab === 'WEEKLY' ? '주간회의록이 없습니다' : '월간회의록이 없습니다'}
          </h3>
          <p className="text-sm text-slate-400">새 회의록을 생성하세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((m) => (
            <button
              key={m.id}
              onClick={() => openDetail(m.id)}
              className="text-left bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-[15px] font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#078080] transition-colors">
                  {m.title}
                </h3>
                <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#078080]/10 text-[#078080] border border-[#078080]/20">
                  {m.meetingType === 'WEEKLY' ? '주간' : '월간'}
                </span>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.75} />
                  <span>{formatDate(m.meetingDate)}</span>
                  {m.meetingTime && (
                    <span className="text-slate-400">| {m.meetingTime}</span>
                  )}
                </div>
                {m.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{m.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.75} />
                  <span>{m.createdBy?.name ?? '-'}</span>
                </div>
              </div>

              {/* Item counts */}
              <div className="flex items-center gap-3 text-xs text-slate-400 pt-3 border-t border-slate-100">
                {m.meetingType === 'WEEKLY' ? (
                  <>
                    <span>업무 {m._count.workItems}건</span>
                    <span>계획 {m._count.planItems}건</span>
                  </>
                ) : (
                  <span>보고 {m._count.monthlyReports}명</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchMeetings(p)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                pagination.page === p
                  ? 'bg-[#078080] text-white shadow-sm'
                  : 'bg-white/80 border border-white/30 text-slate-500 hover:bg-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateForm(false)}
          />
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-800">
                {activeTab === 'WEEKLY' ? '주간' : '월간'} 회의록 생성
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <Plus className="w-4 h-4 rotate-45" strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">제목</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="회의록 제목"
                  className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">회의일</label>
                  <input
                    type="date"
                    value={createDate}
                    onChange={(e) => setCreateDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">시간</label>
                  <input
                    type="time"
                    value={createTime}
                    onChange={(e) => setCreateTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">장소</label>
                <input
                  type="text"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  placeholder="회의 장소 (선택)"
                  className="w-full px-3 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Collapsible Section ── */

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  count,
  expanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[#078080]">{icon}</span>
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <span className="text-xs text-slate-400">{count}건</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
        )}
      </button>
      {expanded && <div className="px-6 pb-5">{children}</div>}
    </div>
  );
}
