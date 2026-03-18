import { useAuth } from '@/hooks/useAuth';
import type { LucideIcon } from 'lucide-react';
import {
  FolderKanban,
  TrendingUp,
  TrendingDown,
  FileText,
} from 'lucide-react';

interface StatCard {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: string;
}

const stats: StatCard[] = [
  {
    label: '진행중 프로젝트',
    value: '12',
    change: '+2 this month',
    changeType: 'positive',
    icon: FolderKanban,
    color: 'bg-primary/10 text-primary',
  },
  {
    label: '이번달 매출',
    value: '248,500,000',
    change: '+12.5%',
    changeType: 'positive',
    icon: TrendingUp,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: '이번달 매입',
    value: '156,200,000',
    change: '-3.2%',
    changeType: 'negative',
    icon: TrendingDown,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    label: '미처리 견적서',
    value: '7',
    change: '3 urgent',
    changeType: 'neutral',
    icon: FileText,
    color: 'bg-accent/10 text-accent',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

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
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
              <p
                className={`text-xs mt-2 ${
                  stat.changeType === 'positive'
                    ? 'text-emerald-500'
                    : stat.changeType === 'negative'
                      ? 'text-red-400'
                      : 'text-slate-400'
                }`}
              >
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Placeholder content area */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-8 shadow-sm">
        <p className="text-sm text-slate-400 text-center">
          Additional dashboard widgets will appear here.
        </p>
      </div>
    </div>
  );
}
