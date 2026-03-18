import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import {
  FolderKanban,
  TrendingUp,
  TrendingDown,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from 'lucide-react';

/* ── Types ── */

interface RecentProject {
  id: number;
  name: string;
  status: string;
  ourCompany: { id: number; code: string; name: string };
  client: { id: number; name: string } | null;
  manager: { id: number; name: string } | null;
}

interface SummaryData {
  activeProjects: number;
  monthlySales: number;
  monthlySalesDelta: number;
  monthlyPurchase: number;
  monthlyPurchaseDelta: number;
  profit: number;
  profitRate: number;
  pendingQuotations: number;
  recentProjects: RecentProject[];
}

/* ── Helpers ── */

function formatKRW(value: number): string {
  return '\u20A9' + value.toLocaleString('ko-KR');
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

/* ── Skeleton ── */

function StatCardSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
      </div>
      <div className="h-7 w-28 bg-slate-200 rounded mb-2" />
      <div className="h-4 w-20 bg-slate-100 rounded mb-2" />
      <div className="h-3 w-16 bg-slate-100 rounded" />
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-xl p-4 animate-pulse">
      <div className="h-5 w-40 bg-slate-200 rounded mb-3" />
      <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
      <div className="h-3 w-32 bg-slate-100 rounded" />
    </div>
  );
}

/* ── Status badge ── */

const statusLabels: Record<string, string> = {
  PLANNING: '기획',
  IN_PROGRESS: '진행',
  COMPLETED: '완료',
  ON_HOLD: '보류',
  CANCELLED: '취소',
};

const statusColors: Record<string, string> = {
  PLANNING: 'bg-blue-50 text-blue-600',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-600',
  COMPLETED: 'bg-slate-100 text-slate-500',
  ON_HOLD: 'bg-amber-50 text-amber-600',
  CANCELLED: 'bg-red-50 text-red-500',
};

/* ── Component ── */

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: SummaryData }>('/reports/summary')
      .then((res) => setData(res.data.data))
      .catch(() => {
        // fail silently, show empty state
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = data
    ? [
        {
          label: '진행중 프로젝트',
          value: String(data.activeProjects),
          icon: FolderKanban,
          iconBg: 'bg-blue-50',
          iconColor: 'text-blue-600',
          delta: null as number | null,
        },
        {
          label: '이번달 매출',
          value: formatKRW(data.monthlySales),
          icon: TrendingUp,
          iconBg: 'bg-teal-50',
          iconColor: 'text-[#078080]',
          delta: data.monthlySalesDelta,
        },
        {
          label: '이번달 매입',
          value: formatKRW(data.monthlyPurchase),
          icon: TrendingDown,
          iconBg: 'bg-violet-50',
          iconColor: 'text-violet-600',
          delta: data.monthlyPurchaseDelta,
        },
        {
          label: '미처리 견적서',
          value: String(data.pendingQuotations),
          icon: FileText,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          delta: null as number | null,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          안녕하세요, {user?.name || 'User'}님
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          오늘의 업무 현황을 확인하세요.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
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
                </div>
              );
            })}
      </div>

      {/* Recent projects */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/60">
          <h3 className="text-base font-semibold text-slate-800">
            최근 프로젝트
          </h3>
          <Link
            to="/projects"
            className="text-sm text-[#078080] hover:text-[#078080]/80 flex items-center gap-0.5 transition-colors"
          >
            전체보기
            <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))
            : data?.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-[#078080] transition-colors line-clamp-1">
                      {project.name}
                    </h4>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[project.status] || 'bg-slate-100 text-slate-500'}`}
                    >
                      {statusLabels[project.status] || project.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">
                    {project.ourCompany.name}
                  </p>
                  {project.client && (
                    <p className="text-xs text-slate-500">
                      고객: {project.client.name}
                    </p>
                  )}
                  {project.manager && (
                    <p className="text-xs text-slate-400 mt-1">
                      담당: {project.manager.name}
                    </p>
                  )}
                </Link>
              ))}
          {!loading && (!data?.recentProjects || data.recentProjects.length === 0) && (
            <div className="col-span-full text-center py-8">
              <p className="text-sm text-slate-400">
                최근 프로젝트가 없습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
