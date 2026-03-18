import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
} from 'lucide-react';
import api from '@/services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface QuotationListItem {
  id: number;
  quotationNo: string;
  direction: 'SALES' | 'PURCHASE';
  title: string;
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'VOID';
  isConfirmed: boolean;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  revision: number;
  quotationDate: string;
  counterpart: { id: number; name: string } | null;
  project: { id: number; name: string } | null;
  ourCompany: { id: number; code: string; name: string };
  author: { id: number; name: string };
  _count: { items: number; revisions: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const DIRECTION_LABELS: Record<string, string> = {
  ALL: '전체',
  SALES: '매출',
  PURCHASE: '매입',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '작성중',
  SENT: '발송',
  CONFIRMED: '확정',
  VOID: '폐기',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  VOID: 'bg-red-100 text-red-600',
};

const DIRECTION_BADGE: Record<string, string> = {
  SALES: 'bg-teal-100 text-teal-700',
  PURCHASE: 'bg-violet-100 text-violet-700',
};

function formatAmount(n: number): string {
  return `₩${n.toLocaleString('ko-KR')}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function QuotationListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCompanyId } = useAuth();

  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters from search params
  const direction = searchParams.get('direction') || 'ALL';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;

  const setFilter = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        // Reset to page 1 when filters change (unless changing page itself)
        if (key !== 'page') next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, string | number> = { page, limit: 12 };
    if (direction !== 'ALL') params.direction = direction;
    if (status) params.status = status;
    if (search) params.search = search;

    api
      .get('/quotations', { params })
      .then((res) => {
        if (cancelled) return;
        setQuotations(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => {
        if (!cancelled) setQuotations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [direction, status, search, page, selectedCompanyId]);

  /* ---- Search debounce ---- */
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) setFilter('search', searchInput);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, search, setFilter]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-5">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">견적서 관리</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            매출/매입 견적서를 관리합니다.
          </p>
        </div>
        <button
          onClick={() => navigate('/quotations?create=1')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium shadow-sm hover:shadow-md hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />새 견적서
        </button>
      </div>

      {/* ---- Filter bar ---- */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl p-4 space-y-3">
        {/* Direction tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(DIRECTION_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter('direction', key === 'ALL' ? '' : key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                direction === key ||
                (key === 'ALL' && direction === 'ALL')
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}

          {/* Status pills */}
          <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter('status', status === key ? '' : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                status === key
                  ? STATUS_COLORS[key]
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="견적번호, 제목, 거래처 검색..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>
      </div>

      {/* ---- Cards grid ---- */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-5 h-44 animate-pulse"
            />
          ))}
        </div>
      ) : quotations.length === 0 ? (
        /* Empty state */
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-16 text-center shadow-sm">
          <FileText
            className="w-12 h-12 mx-auto text-slate-200 mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-slate-500">
            견적서가 없습니다.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            새 견적서를 작성하여 시작하세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotations.map((q) => (
            <div
              key={q.id}
              onClick={() => navigate(`/quotations/${q.id}`)}
              className={`group cursor-pointer bg-white/80 backdrop-blur-xl border shadow-sm rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                q.isConfirmed
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border-white/30'
              }`}
            >
              {/* Top row: quotationNo + direction badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold font-mono text-slate-700 tracking-tight">
                  {q.quotationNo}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${DIRECTION_BADGE[q.direction]}`}
                >
                  {DIRECTION_LABELS[q.direction]}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-medium text-slate-800 truncate mb-1 group-hover:text-primary transition-colors">
                {q.title}
              </h3>

              {/* Counterpart */}
              <p className="text-xs text-slate-400 truncate mb-3">
                {q.counterpart?.name || '-'}
              </p>

              {/* Amount */}
              <p className="text-lg font-bold font-mono text-slate-800 mb-3">
                {formatAmount(q.totalAmount)}
              </p>

              {/* Bottom row: badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status]}`}
                >
                  {STATUS_LABELS[q.status]}
                </span>
                {q.revision > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                    Rev.{q.revision}
                  </span>
                )}
                {q.isConfirmed && (
                  <span className="flex items-center gap-0.5 text-[11px] font-medium text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                    확정
                  </span>
                )}
                {q.status === 'CONFIRMED' && !q.isConfirmed && (
                  <Star
                    className="w-3.5 h-3.5 text-amber-400"
                    strokeWidth={2}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Pagination ---- */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setFilter('page', String(page - 1))}
            className="p-2 rounded-xl border border-slate-200 bg-white/60 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <span className="text-sm text-slate-500 min-w-[80px] text-center">
            {page} / {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setFilter('page', String(page + 1))}
            className="p-2 rounded-xl border border-slate-200 bg-white/60 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}
