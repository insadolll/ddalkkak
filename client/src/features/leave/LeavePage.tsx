import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import {
  Plus,
  CalendarDays,
  Palmtree,
  Thermometer,
  Clock,
  MoreHorizontal,
  Loader2,
  CalendarOff,
} from 'lucide-react';
import LeaveFormModal from './LeaveFormModal';

/* ── Types ── */

interface LeaveEmployee {
  id: string;
  name: string;
  employeeNo: string;
}

interface Leave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  createdAt: string;
  employee: LeaveEmployee | null;
  reviewer: { id: string; name: string } | null;
}

interface LeaveBalance {
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ── Constants ── */

const LEAVE_TYPE_CONFIG: Record<string, { label: string; icon: typeof Palmtree; color: string }> = {
  ANNUAL: { label: '연차', icon: Palmtree, color: 'bg-teal-50 text-[#078080] border-teal-200' },
  SICK: { label: '병가', icon: Thermometer, color: 'bg-red-50 text-red-600 border-red-200' },
  HALF: { label: '반차', icon: Clock, color: 'bg-violet-50 text-violet-600 border-violet-200' },
  OTHER: { label: '기타', icon: MoreHorizontal, color: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기중', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: '승인됨', color: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: '반려됨', color: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED: { label: '취소됨', color: 'bg-slate-50 text-slate-500 border-slate-200' },
};

const STATUS_FILTERS = [
  { key: '', label: '전체' },
  { key: 'PENDING', label: '대기중' },
  { key: 'APPROVED', label: '승인됨' },
  { key: 'REJECTED', label: '반려됨' },
  { key: 'CANCELLED', label: '취소됨' },
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

export default function LeavePage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: LeaveBalance }>('/leaves/balance');
      setBalance(res.data.data);
    } catch {
      // balance may not exist
    }
  }, []);

  const fetchLeaves = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 20 };
        if (statusFilter) params.status = statusFilter;

        const res = await api.get<{
          success: boolean;
          data: Leave[];
          pagination: Pagination;
        }>('/leaves', { params });

        setLeaves(res.data.data);
        setPagination(res.data.pagination);
      } catch {
        setLeaves([]);
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    fetchBalance();
    fetchLeaves(1);
  }, [fetchBalance, fetchLeaves]);

  const handleRefresh = () => {
    fetchBalance();
    fetchLeaves(1);
  };

  return (
    <div className="space-y-6">
      {/* ── Balance Card ── */}
      {balance && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-4">내 연차 현황</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#078080]">{balance.remainingDays}일</p>
              <p className="text-xs text-slate-400 mt-1">잔여 연차</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-700">{balance.usedDays}일</p>
              <p className="text-xs text-slate-400 mt-1">사용 연차</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-700">{balance.totalDays}일</p>
              <p className="text-xs text-slate-400 mt-1">총 연차</p>
            </div>
          </div>
          <div className="mt-4 bg-slate-100/60 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-[#078080] rounded-full transition-all duration-500"
              style={{
                width: `${balance.totalDays > 0 ? (balance.remainingDays / balance.totalDays) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Filter + Action Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.key}
              onClick={() => {
                setStatusFilter(sf.key);
                fetchLeaves(1);
              }}
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

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] active:scale-[0.97] transition-all duration-200 shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          휴가 신청
        </button>
      </div>

      {/* ── Leave Cards ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#078080] animate-spin" strokeWidth={1.75} />
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <CalendarOff className="w-8 h-8 text-slate-300" strokeWidth={1.75} />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            휴가 신청 내역이 없습니다
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            새 휴가를 신청하여 연차를 관리하세요.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#078080] text-white rounded-xl text-sm font-medium hover:bg-[#06706f] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            휴가 신청
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => {
            const typeConfig = LEAVE_TYPE_CONFIG[leave.leaveType] || LEAVE_TYPE_CONFIG.OTHER;
            const statusConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.PENDING;
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={leave.id}
                className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Type icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeConfig.color}`}>
                      <TypeIcon className="w-5 h-5" strokeWidth={1.75} />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Type + Status badges */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        {user?.role !== 'EMPLOYEE' && leave.employee && (
                          <span className="text-xs text-slate-400">
                            {leave.employee.name}
                          </span>
                        )}
                      </div>

                      {/* Date range */}
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                        <span>
                          {formatDate(leave.startDate)} ~ {formatDate(leave.endDate)}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          ({leave.totalDays}일)
                        </span>
                      </div>

                      {/* Reason */}
                      {leave.reason && (
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">
                          {leave.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Created date */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{formatDate(leave.createdAt)}</p>
                  </div>
                </div>
              </div>
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
              onClick={() => fetchLeaves(p)}
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

      {/* ── Form Modal ── */}
      {showForm && (
        <LeaveFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
