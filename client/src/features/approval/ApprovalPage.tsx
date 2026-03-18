import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import {
  Plus,
  FileCheck,
  Loader2,
  FileX,
  User,
  CalendarDays,
} from 'lucide-react';
import ApprovalFormModal from './ApprovalFormModal';

/* ── Types ── */

interface ApprovalAuthor {
  id: string;
  name: string;
}

interface ApprovalDocument {
  id: string;
  title: string;
  content: string;
  category: string | null;
  status: string;
  currentStep: number;
  totalSteps: number;
  authorId: string;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  author: ApprovalAuthor | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ── Constants ── */

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '초안', color: 'bg-slate-50 text-slate-500 border-slate-200' },
  PENDING: { label: '대기중', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: '승인됨', color: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: '반려됨', color: 'bg-red-50 text-red-700 border-red-200' },
};

const TABS = [
  { key: 'my', label: '내 결재' },
  { key: 'pending', label: '결재할 문서' },
] as const;

/* ── Helpers ── */

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/* ── Component ── */

export default function ApprovalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my' | 'pending'>('my');
  const [docs, setDocs] = useState<ApprovalDocument[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ApprovalDocument | null>(null);

  const fetchDocs = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 20 };
        if (statusFilter) params.status = statusFilter;
        if (activeTab === 'pending') {
          params.approverId = user?.id ?? '';
          params.status = params.status || 'PENDING';
        } else {
          params.authorId = user?.id ?? '';
        }

        const res = await api.get<{
          success: boolean;
          data: ApprovalDocument[];
          pagination: Pagination;
        }>('/approvals', { params });

        setDocs(res.data.data);
        setPagination(res.data.pagination);
      } catch {
        setDocs([]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, statusFilter, user?.id],
  );

  useEffect(() => {
    fetchDocs(1);
  }, [fetchDocs]);

  const handleTabChange = (tab: 'my' | 'pending') => {
    setActiveTab(tab);
    setStatusFilter('');
  };

  const handleApprove = async (docId: string) => {
    try {
      await api.post(`/approvals/${docId}/approve`, { comment: '' });
      fetchDocs(pagination.page);
      setSelectedDoc(null);
    } catch {
      // handle error
    }
  };

  const handleReject = async (docId: string) => {
    try {
      await api.post(`/approvals/${docId}/reject`, { comment: '' });
      fetchDocs(pagination.page);
      setSelectedDoc(null);
    } catch {
      // handle error
    }
  };

  const handleSubmit = async (docId: string) => {
    try {
      await api.post(`/approvals/${docId}/submit`);
      fetchDocs(pagination.page);
      setSelectedDoc(null);
    } catch {
      // handle error
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Tab Bar ── */}
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
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] active:scale-[0.97] transition-all duration-200 shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          새 결재
        </button>
      </div>

      {/* ── Status filter (for "my" tab) ── */}
      {activeTab === 'my' && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: '', label: '전체' },
            { key: 'DRAFT', label: '초안' },
            { key: 'PENDING', label: '대기중' },
            { key: 'APPROVED', label: '승인됨' },
            { key: 'REJECTED', label: '반려됨' },
          ].map((sf) => (
            <button
              key={sf.key}
              onClick={() => setStatusFilter(sf.key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                statusFilter === sf.key
                  ? 'bg-[#078080] text-white shadow-sm'
                  : 'bg-white/70 text-slate-500 hover:bg-white hover:text-slate-700 border border-white/40'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Document Cards ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#078080] animate-spin" strokeWidth={1.75} />
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <FileX className="w-8 h-8 text-slate-300" strokeWidth={1.75} />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {activeTab === 'my' ? '작성한 결재 문서가 없습니다' : '결재 대기 문서가 없습니다'}
          </h3>
          <p className="text-sm text-slate-400">
            {activeTab === 'my'
              ? '새 결재 문서를 작성해보세요.'
              : '현재 결재 대기 중인 문서가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => {
            const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.DRAFT;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="w-full text-left bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Title */}
                    <h3 className="text-[15px] font-semibold text-slate-800 group-hover:text-[#078080] transition-colors mb-1.5 line-clamp-1">
                      {doc.title}
                    </h3>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-2">
                      {doc.category && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                          {doc.category}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>{doc.author?.name ?? '-'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>{doc.submittedAt ? formatDate(doc.submittedAt) : formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step progress */}
                  <div className="flex-shrink-0 text-right">
                    {doc.totalSteps > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {Array.from({ length: doc.totalSteps }, (_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < doc.currentStep
                                  ? 'bg-[#078080]'
                                  : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">
                          {doc.currentStep}/{doc.totalSteps}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchDocs(p)}
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

      {/* ── Detail Modal ── */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedDoc(null)}
          />
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50 shrink-0">
              <h2 className="text-lg font-semibold text-slate-800">결재 상세</h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <FileCheck className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="flex items-center gap-2">
                {selectedDoc.category && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                    {selectedDoc.category}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    (STATUS_CONFIG[selectedDoc.status] || STATUS_CONFIG.DRAFT).color
                  }`}
                >
                  {(STATUS_CONFIG[selectedDoc.status] || STATUS_CONFIG.DRAFT).label}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900">{selectedDoc.title}</h3>
              <p className="text-xs text-slate-500">
                {selectedDoc.author?.name} | {formatDate(selectedDoc.createdAt)}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/60 rounded-xl p-4">
                {selectedDoc.content}
              </p>
              {selectedDoc.totalSteps > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>결재 진행:</span>
                  <span className="font-medium text-slate-700">
                    {selectedDoc.currentStep} / {selectedDoc.totalSteps}
                  </span>
                </div>
              )}
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-slate-200/50 flex gap-2 justify-end">
              {selectedDoc.status === 'DRAFT' && selectedDoc.authorId === user?.id && (
                <button
                  onClick={() => handleSubmit(selectedDoc.id)}
                  className="px-4 py-2 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] transition-all shadow-sm"
                >
                  제출하기
                </button>
              )}
              {activeTab === 'pending' && selectedDoc.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleReject(selectedDoc.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all"
                  >
                    반려
                  </button>
                  <button
                    onClick={() => handleApprove(selectedDoc.id)}
                    className="px-4 py-2 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] transition-all shadow-sm"
                  >
                    승인
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Form Modal ── */}
      {showForm && (
        <ApprovalFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchDocs(1);
          }}
        />
      )}
    </div>
  );
}
