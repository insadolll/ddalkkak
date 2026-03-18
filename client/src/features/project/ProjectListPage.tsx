import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Plus,
  FolderKanban,
  Building2,
  Truck,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import api from '@/services/api';
import ProjectFormModal from './ProjectFormModal';

/* ── Types ── */

interface ProjectCompany {
  id: number;
  name: string;
  code?: string;
}

interface ProjectManager {
  id: number;
  name: string;
  position: string;
}

interface Project {
  id: number;
  name: string;
  status: string;
  stage: string;
  ourCompany: ProjectCompany;
  client: ProjectCompany | null;
  supplier: ProjectCompany | null;
  manager: ProjectManager | null;
  confirmedSalesAmount: number | null;
  confirmedSalesTax: number | null;
  confirmedPurchaseAmount: number | null;
  confirmedPurchaseTax: number | null;
  startDate: string | null;
  endDate: string | null;
  memo: string | null;
  _count: { quotations: number; invoices: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ── Stage / Status maps ── */

const STAGE_LABELS: Record<string, string> = {
  SETUP: '수립',
  QUOTE_RECEIVED: '견적 수령',
  QUOTE_SENT: '견적 발송',
  ORDER_CONFIRMED: '수주 확정',
  DELIVERY: '납품 진행',
  INVOICE: '계산서',
  DONE: '완료',
};

const STAGE_COLORS: Record<string, string> = {
  SETUP: 'bg-blue-50 text-blue-600 border-blue-200',
  QUOTE_RECEIVED: 'bg-amber-50 text-amber-600 border-amber-200',
  QUOTE_SENT: 'bg-amber-50 text-amber-600 border-amber-200',
  ORDER_CONFIRMED: 'bg-teal-50 text-[#078080] border-teal-200',
  DELIVERY: 'bg-violet-50 text-violet-600 border-violet-200',
  INVOICE: 'bg-red-50 text-[#F45D48] border-red-200',
  DONE: 'bg-green-50 text-green-600 border-green-200',
};

const STATUS_FILTERS = [
  { key: '', label: '전체' },
  { key: 'ACTIVE', label: '진행중' },
  { key: 'ON_HOLD', label: '보류' },
  { key: 'COMPLETED', label: '완료' },
  { key: 'CANCELLED', label: '취소' },
] as const;

/* ── Helpers ── */

function formatAmount(value: number | null): string {
  if (value == null) return '-';
  return `\u20A9${value.toLocaleString('ko-KR')}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/* ── Component ── */

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { selectedCompanyId } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchProjects = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {
          page,
          limit: 12,
        };
        if (statusFilter) params.status = statusFilter;
        if (search) params.search = search;

        const res = await api.get<{
          success: boolean;
          data: Project[];
          pagination: Pagination;
        }>('/projects', { params });

        setProjects(res.data.data);
        setPagination(res.data.pagination);
      } catch {
        // TODO: toast error
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, search],
  );

  useEffect(() => {
    fetchProjects(1);
  }, [fetchProjects, selectedCompanyId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchProjects(newPage);
  };

  return (
    <div className="space-y-6">
      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((sf) => (
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

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              strokeWidth={1.75}
            />
            <input
              type="text"
              placeholder="프로젝트 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/80 backdrop-blur-xl border border-white/30 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/40 transition-all"
            />
          </div>

          {/* New project button */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] active:scale-[0.97] transition-all duration-200 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            새 프로젝트
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 animate-pulse"
            >
              <div className="h-5 bg-slate-200/60 rounded-lg w-3/4 mb-3" />
              <div className="h-4 bg-slate-200/40 rounded-lg w-1/2 mb-2" />
              <div className="h-4 bg-slate-200/40 rounded-lg w-2/3 mb-4" />
              <div className="h-8 bg-slate-200/30 rounded-lg w-full" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty state */
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <FolderKanban
              className="w-8 h-8 text-slate-300"
              strokeWidth={1.75}
            />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            아직 프로젝트가 없습니다
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            새 프로젝트를 생성하여 매입매출 관리를 시작하세요.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            프로젝트 만들기
          </button>
        </div>
      ) : (
        /* Card grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="text-left bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl p-5 hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 group"
            >
              {/* Header: name + stage */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-[15px] font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#078080] transition-colors">
                  {p.name}
                </h3>
                <span
                  className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STAGE_COLORS[p.stage] || 'bg-slate-50 text-slate-500 border-slate-200'}`}
                >
                  {STAGE_LABELS[p.stage] || p.stage}
                </span>
              </div>

              {/* Client / Supplier / Manager */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Building2
                    className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                    strokeWidth={1.75}
                  />
                  <span className="truncate">
                    {p.client?.name || '고객사 미지정'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Truck
                    className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                    strokeWidth={1.75}
                  />
                  <span className="truncate">
                    {p.supplier?.name || '매입처 미지정'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User
                    className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"
                    strokeWidth={1.75}
                  />
                  <span className="truncate">
                    {p.manager?.name || '담당자 미지정'}
                  </span>
                </div>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-slate-50/60 rounded-xl">
                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5">확정 매출</p>
                  <p className="text-sm font-mono font-medium text-slate-700">
                    {formatAmount(p.confirmedSalesAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5">확정 매입</p>
                  <p className="text-sm font-mono font-medium text-slate-700">
                    {formatAmount(p.confirmedPurchaseAmount)}
                  </p>
                </div>
              </div>

              {/* Footer: date range + quotation count */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>
                    {formatDate(p.startDate)} ~ {formatDate(p.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>견적 {p._count.quotations}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 border border-white/30 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter((p) => {
              const current = pagination.page;
              return (
                p === 1 ||
                p === pagination.totalPages ||
                Math.abs(p - current) <= 2
              );
            })
            .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                acc.push('ellipsis');
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === 'ellipsis' ? (
                <span
                  key={`e-${idx}`}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => handlePageChange(item)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                    pagination.page === item
                      ? 'bg-[#078080] text-white shadow-sm'
                      : 'bg-white/80 border border-white/30 text-slate-500 hover:bg-white'
                  }`}
                >
                  {item}
                </button>
              ),
            )}

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 border border-white/30 text-slate-500 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      )}

      {/* ── Form Modal ── */}
      {showForm && (
        <ProjectFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchProjects(1);
          }}
        />
      )}
    </div>
  );
}
