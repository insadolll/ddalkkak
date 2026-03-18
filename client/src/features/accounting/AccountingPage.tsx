import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
} from 'lucide-react';
import api from '@/services/api';
import SingleTransactionFormModal from './SingleTransactionFormModal';

/* ── Types ── */

interface SummaryData {
  activeProjects: number;
  monthlySales: number;
  monthlySalesDelta: number;
  monthlyPurchase: number;
  monthlyPurchaseDelta: number;
  profit: number;
  profitRate: number;
  pendingQuotations: number;
}

interface Counterpart {
  id: number;
  name: string;
}

interface OurCompany {
  id: number;
  code: string;
  name: string;
}

interface SingleTransaction {
  id: number;
  direction: 'SALES' | 'PURCHASE';
  itemDesc: string;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  tradeDate: string;
  counterpart: Counterpart | null;
  ourCompany: OurCompany;
  memo: string | null;
}

interface PurchaseOrder {
  id: number;
  poNo: string;
  supplier: { id: number; name: string } | null;
  totalAmount: number;
  status: string;
  project: { id: number; name: string } | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* ── Helpers ── */

function formatKRW(value: number): string {
  return '\u20A9' + value.toLocaleString('ko-KR');
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/* ── Skeleton ── */

function StatCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-slate-200 mb-3" />
      <div className="h-7 w-28 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-20 bg-slate-100 rounded" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-xl p-4 animate-pulse">
      <div className="h-5 w-40 bg-slate-200 rounded mb-3" />
      <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
      <div className="h-3 w-32 bg-slate-100 rounded" />
    </div>
  );
}

/* ── PO status ── */

const poStatusLabels: Record<string, string> = {
  DRAFT: '임시',
  SENT: '발송',
  CONFIRMED: '확정',
  CANCELLED: '취소',
};

const poStatusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-500',
  SENT: 'bg-blue-50 text-blue-600',
  CONFIRMED: 'bg-emerald-50 text-emerald-600',
  CANCELLED: 'bg-red-50 text-red-500',
};

/* ── Component ── */

type DirectionFilter = 'ALL' | 'SALES' | 'PURCHASE';
type ActiveTab = 'transactions' | 'orders';

export default function AccountingPage() {
  // Summary
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('transactions');

  // Transactions
  const [transactions, setTransactions] = useState<SingleTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [directionFilter, setDirectionFilter] =
    useState<DirectionFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Purchase orders
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poPage, setPoPage] = useState(1);
  const [poTotalPages, setPoTotalPages] = useState(1);

  // Fetch summary
  useEffect(() => {
    api
      .get<{ data: SummaryData }>('/reports/summary')
      .then((res) => setSummary(res.data.data))
      .catch(() => {
        /* ignore */
      })
      .finally(() => setSummaryLoading(false));
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(() => {
    setTxLoading(true);
    const params: Record<string, string | number> = { page: txPage, limit: 12 };
    if (directionFilter !== 'ALL') params.direction = directionFilter;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    api
      .get<PaginatedResponse<SingleTransaction>>('/single-transactions', {
        params,
      })
      .then((res) => {
        setTransactions(res.data.data);
        setTxTotalPages(res.data.pagination.totalPages);
      })
      .catch(() => {
        setTransactions([]);
      })
      .finally(() => setTxLoading(false));
  }, [txPage, directionFilter, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab, fetchTransactions]);

  // Fetch purchase orders
  const fetchOrders = useCallback(() => {
    setPoLoading(true);
    api
      .get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', {
        params: { page: poPage, limit: 12 },
      })
      .then((res) => {
        setOrders(res.data.data);
        setPoTotalPages(res.data.pagination.totalPages);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => setPoLoading(false));
  }, [poPage]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab, fetchOrders]);

  // Reset page on filter change
  useEffect(() => {
    setTxPage(1);
  }, [directionFilter, searchTerm, dateFrom, dateTo]);

  // Summary cards
  const statCards = summary
    ? [
        {
          label: '이번달 매출',
          value: formatKRW(summary.monthlySales),
          icon: TrendingUp,
          iconBg: 'bg-teal-50',
          iconColor: 'text-[#078080]',
          delta: summary.monthlySalesDelta,
        },
        {
          label: '이번달 매입',
          value: formatKRW(summary.monthlyPurchase),
          icon: TrendingDown,
          iconBg: 'bg-violet-50',
          iconColor: 'text-violet-600',
          delta: summary.monthlyPurchaseDelta,
        },
        {
          label: '순이익',
          value: formatKRW(summary.profit),
          icon: Receipt,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
          delta: null as number | null,
          sub: `이익률 ${summary.profitRate.toFixed(1)}%`,
        },
        {
          label: '미처리 견적서',
          value: String(summary.pendingQuotations),
          icon: FileText,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          delta: null as number | null,
          sub: null as string | null,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">매입매출</h2>
        <p className="text-sm text-slate-400 mt-1">
          단건 거래와 발주서를 관리합니다.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-800 font-mono">
                    {card.value}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
                  {card.delta !== null && (
                    <p
                      className={`text-xs mt-2 flex items-center gap-0.5 ${
                        card.delta >= 0 ? 'text-emerald-500' : 'text-red-400'
                      }`}
                    >
                      {card.delta >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" strokeWidth={2} />
                      )}
                      {formatDelta(card.delta)} vs 전월
                    </p>
                  )}
                  {card.sub && (
                    <p className="text-xs mt-2 text-slate-400">{card.sub}</p>
                  )}
                </div>
              );
            })}
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100/60">
          {(
            [
              { key: 'transactions', label: '단건 거래', icon: Receipt },
              { key: 'orders', label: '발주서', icon: ClipboardList },
            ] as const
          ).map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeTab === tab.key
                    ? 'border-[#078080] text-[#078080]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <TabIcon className="w-4 h-4" strokeWidth={1.75} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === 'transactions' && (
            <>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Direction tabs */}
                <div className="flex bg-slate-100/80 rounded-xl p-0.5">
                  {(
                    [
                      { key: 'ALL', label: '전체' },
                      { key: 'SALES', label: '매출' },
                      { key: 'PURCHASE', label: '매입' },
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setDirectionFilter(d.key)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        directionFilter === d.key
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {/* Date range */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/50 transition-all"
                  />
                  <span className="text-slate-300 text-sm">~</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/50 transition-all"
                  />
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"
                    strokeWidth={1.75}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="품목 / 거래처 검색"
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/50 transition-all"
                  />
                </div>

                {/* Add button */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#078080] text-white text-sm font-medium hover:bg-[#078080]/90 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  새 거래
                </button>
              </div>

              {/* Transaction cards */}
              {txLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt
                    className="w-10 h-10 text-slate-200 mx-auto mb-3"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm text-slate-400">
                    거래 내역이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            tx.direction === 'SALES'
                              ? 'bg-teal-50 text-[#078080]'
                              : 'bg-violet-50 text-violet-600'
                          }`}
                        >
                          {tx.direction === 'SALES' ? '매출' : '매입'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(tx.tradeDate)}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 line-clamp-1 mb-1">
                        {tx.itemDesc}
                      </h4>
                      {tx.counterpart && (
                        <p className="text-xs text-slate-400 mb-2">
                          {tx.counterpart.name}
                        </p>
                      )}
                      <p className="text-lg font-bold text-slate-800 font-mono">
                        {formatKRW(tx.totalAmount)}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        공급 {formatKRW(tx.supplyAmount)} + 세액{' '}
                        {formatKRW(tx.taxAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {txTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-100/60">
                  <button
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage <= 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                  <span className="text-sm text-slate-500 tabular-nums">
                    {txPage} / {txTotalPages}
                  </span>
                  <button
                    onClick={() =>
                      setTxPage((p) => Math.min(txTotalPages, p + 1))
                    }
                    disabled={txPage >= txTotalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <>
              {/* Purchase order cards */}
              {poLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList
                    className="w-10 h-10 text-slate-200 mx-auto mb-3"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm text-slate-400">
                    발주서가 없습니다.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {orders.map((po) => (
                    <div
                      key={po.id}
                      className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-mono font-semibold text-slate-700">
                          {po.poNo}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${poStatusColors[po.status] || 'bg-slate-100 text-slate-500'}`}
                        >
                          {poStatusLabels[po.status] || po.status}
                        </span>
                      </div>
                      {po.supplier && (
                        <p className="text-xs text-slate-500 mb-1">
                          공급: {po.supplier.name}
                        </p>
                      )}
                      {po.project && (
                        <p className="text-xs text-slate-400 mb-2">
                          프로젝트: {po.project.name}
                        </p>
                      )}
                      <p className="text-lg font-bold text-slate-800 font-mono">
                        {formatKRW(po.totalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {poTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-100/60">
                  <button
                    onClick={() => setPoPage((p) => Math.max(1, p - 1))}
                    disabled={poPage <= 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                  <span className="text-sm text-slate-500 tabular-nums">
                    {poPage} / {poTotalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPoPage((p) => Math.min(poTotalPages, p + 1))
                    }
                    disabled={poPage >= poTotalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create modal */}
      <SingleTransactionFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchTransactions}
      />
    </div>
  );
}
