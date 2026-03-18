import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Building2,
  Truck,
  User,
  CalendarDays,
  StickyNote,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  CheckCircle2,
  Circle,
  FileText,
  BadgeCheck,
  GitBranch,
} from 'lucide-react';
import api from '@/services/api';
import ProjectFormModal from './ProjectFormModal';

/* ── Types ── */

interface CompanyRef {
  id: number;
  name: string;
  code?: string;
}

interface ManagerRef {
  id: number;
  name: string;
  position: string;
}

interface Quotation {
  id: number;
  quotationNo: string;
  type: string;
  counterpartName: string;
  totalAmount: number | null;
  revision: number;
  isConfirmed: boolean;
  status: string;
}

interface Memo {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; name: string } | null;
}

interface ProjectDetail {
  id: number;
  name: string;
  status: string;
  stage: string;
  ourCompany: CompanyRef;
  client: CompanyRef | null;
  supplier: CompanyRef | null;
  manager: ManagerRef | null;
  confirmedSalesAmount: number | null;
  confirmedSalesTax: number | null;
  confirmedPurchaseAmount: number | null;
  confirmedPurchaseTax: number | null;
  startDate: string | null;
  endDate: string | null;
  memo: string | null;
  quotations: Quotation[];
  memos: Memo[];
  _count: { attachments: number; invoices: number; purchaseOrders: number };
}

/* ── Constants ── */

const STAGES_ORDER = [
  'SETUP',
  'QUOTE_RECEIVED',
  'QUOTE_SENT',
  'ORDER_CONFIRMED',
  'DELIVERY',
  'INVOICE',
  'DONE',
] as const;

const STAGE_LABELS: Record<string, string> = {
  SETUP: '수립',
  QUOTE_RECEIVED: '견적 수령',
  QUOTE_SENT: '견적 발송',
  ORDER_CONFIRMED: '수주 확정',
  DELIVERY: '납품 진행',
  INVOICE: '계산서',
  DONE: '완료',
};

const STAGE_BADGE_COLORS: Record<string, string> = {
  SETUP: 'bg-blue-50 text-blue-600 border-blue-200',
  QUOTE_RECEIVED: 'bg-amber-50 text-amber-600 border-amber-200',
  QUOTE_SENT: 'bg-amber-50 text-amber-600 border-amber-200',
  ORDER_CONFIRMED: 'bg-teal-50 text-[#078080] border-teal-200',
  DELIVERY: 'bg-violet-50 text-violet-600 border-violet-200',
  INVOICE: 'bg-red-50 text-[#F45D48] border-red-200',
  DONE: 'bg-green-50 text-green-600 border-green-200',
};

const STAGE_DOT_COLORS: Record<string, string> = {
  SETUP: 'bg-blue-500',
  QUOTE_RECEIVED: 'bg-amber-500',
  QUOTE_SENT: 'bg-amber-500',
  ORDER_CONFIRMED: 'bg-[#078080]',
  DELIVERY: 'bg-violet-500',
  INVOICE: 'bg-[#F45D48]',
  DONE: 'bg-green-500',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '진행중',
  ON_HOLD: '보류',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-600 border-green-200',
  ON_HOLD: 'bg-amber-50 text-amber-600 border-amber-200',
  COMPLETED: 'bg-blue-50 text-blue-600 border-blue-200',
  CANCELLED: 'bg-red-50 text-red-500 border-red-200',
};

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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ── Component ── */

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [quotationTab, setQuotationTab] = useState<'PURCHASE' | 'SALES'>(
    'SALES',
  );

  const fetchProject = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: ProjectDetail }>(
        `/projects/${id}`,
      );
      setProject(res.data.data);
    } catch {
      // TODO: handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200/60 rounded-lg w-48" />
        <div className="h-6 bg-slate-200/40 rounded-lg w-96" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white/80 rounded-2xl border border-white/30"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center">
        <p className="text-slate-500">프로젝트를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 text-sm text-[#078080] hover:underline"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const salesTotal =
    (project.confirmedSalesAmount ?? 0) + (project.confirmedSalesTax ?? 0);
  const purchaseTotal =
    (project.confirmedPurchaseAmount ?? 0) + (project.confirmedPurchaseTax ?? 0);
  const profit = salesTotal - purchaseTotal;
  const profitRate = salesTotal > 0 ? (profit / salesTotal) * 100 : 0;

  const currentStageIdx = STAGES_ORDER.indexOf(
    project.stage as (typeof STAGES_ORDER)[number],
  );

  const filteredQuotations = (project.quotations || []).filter(
    (q) => q.type === quotationTab,
  );

  return (
    <div className="space-y-6">
      {/* ── Back + Header ── */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#078080] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          프로젝트 목록
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">
              {project.name}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${STAGE_BADGE_COLORS[project.stage] || 'bg-slate-50 text-slate-500 border-slate-200'}`}
            >
              {STAGE_LABELS[project.stage] || project.stage}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[project.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}
            >
              {STATUS_LABELS[project.status] || project.status}
            </span>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl border border-white/30 rounded-xl text-sm font-medium text-slate-600 hover:bg-white hover:text-[#078080] hover:border-[#078080]/20 transition-all shadow-sm"
          >
            <Pencil className="w-4 h-4" strokeWidth={1.75} />
            수정
          </button>
        </div>
      </div>

      {/* ── Info Grid ── */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <InfoItem
            icon={Building2}
            label="고객사"
            value={project.client?.name || '미지정'}
          />
          <InfoItem
            icon={Truck}
            label="매입처"
            value={project.supplier?.name || '미지정'}
          />
          <InfoItem
            icon={User}
            label="담당자"
            value={
              project.manager
                ? `${project.manager.name} (${project.manager.position})`
                : '미지정'
            }
          />
          <InfoItem
            icon={CalendarDays}
            label="기간"
            value={`${formatDate(project.startDate)} ~ ${formatDate(project.endDate)}`}
          />
        </div>
        {project.memo && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="flex items-start gap-2">
              <StickyNote
                className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0"
                strokeWidth={1.75}
              />
              <div>
                <p className="text-xs text-slate-400 mb-1">메모</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {project.memo}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Amount Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AmountCard
          icon={TrendingUp}
          label="확정 매출"
          amount={salesTotal}
          sub={
            project.confirmedSalesAmount != null
              ? `공급가 ${formatAmount(project.confirmedSalesAmount)} + 세액 ${formatAmount(project.confirmedSalesTax)}`
              : undefined
          }
          color="text-[#078080]"
        />
        <AmountCard
          icon={TrendingDown}
          label="확정 매입"
          amount={purchaseTotal}
          sub={
            project.confirmedPurchaseAmount != null
              ? `공급가 ${formatAmount(project.confirmedPurchaseAmount)} + 세액 ${formatAmount(project.confirmedPurchaseTax)}`
              : undefined
          }
          color="text-[#F45D48]"
        />
        <AmountCard
          icon={DollarSign}
          label="수익"
          amount={profit}
          color={profit >= 0 ? 'text-[#078080]' : 'text-[#F45D48]'}
        />
        <AmountCard
          icon={Percent}
          label="수익률"
          amountText={
            salesTotal > 0 ? `${profitRate.toFixed(1)}%` : '-'
          }
          color={profitRate >= 0 ? 'text-[#078080]' : 'text-[#F45D48]'}
        />
      </div>

      {/* ── Stage Timeline + Quotations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage timeline */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-5">
            프로젝트 단계
          </h2>
          <div className="space-y-0">
            {STAGES_ORDER.map((stage, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              const isLast = idx === STAGES_ORDER.length - 1;

              return (
                <div key={stage} className="flex gap-3">
                  {/* Line + dot */}
                  <div className="flex flex-col items-center">
                    {isPast || isCurrent ? (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCurrent
                            ? `${STAGE_DOT_COLORS[stage]} ring-4 ring-opacity-20 ${stage === 'ORDER_CONFIRMED' ? 'ring-[#078080]' : stage === 'INVOICE' ? 'ring-[#F45D48]' : ''}`
                            : 'bg-slate-300'
                        }`}
                      >
                        {isPast ? (
                          <CheckCircle2
                            className="w-4 h-4 text-white"
                            strokeWidth={2}
                          />
                        ) : (
                          <Circle
                            className="w-3 h-3 text-white fill-white"
                            strokeWidth={2}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-slate-200 flex items-center justify-center flex-shrink-0 bg-white">
                        <Circle
                          className="w-3 h-3 text-slate-300"
                          strokeWidth={2}
                        />
                      </div>
                    )}
                    {!isLast && (
                      <div
                        className={`w-0.5 h-8 ${isPast ? 'bg-slate-300' : 'bg-slate-200'}`}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className="pt-1">
                    <p
                      className={`text-sm font-medium ${
                        isCurrent
                          ? 'text-slate-900'
                          : isPast
                            ? 'text-slate-500'
                            : 'text-slate-400'
                      }`}
                    >
                      {STAGE_LABELS[stage]}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-[#078080] font-medium mt-0.5">
                        현재 단계
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quotation pool */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-slate-700">
              견적서 풀
            </h2>
            <div className="flex bg-slate-100/80 rounded-lg p-0.5">
              <button
                onClick={() => setQuotationTab('SALES')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  quotationTab === 'SALES'
                    ? 'bg-white text-[#078080] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                매출 견적서
              </button>
              <button
                onClick={() => setQuotationTab('PURCHASE')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  quotationTab === 'PURCHASE'
                    ? 'bg-white text-[#078080] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                매입 견적서
              </button>
            </div>
          </div>

          {filteredQuotations.length === 0 ? (
            <div className="text-center py-10">
              <FileText
                className="w-10 h-10 text-slate-200 mx-auto mb-3"
                strokeWidth={1.75}
              />
              <p className="text-sm text-slate-400">
                {quotationTab === 'SALES' ? '매출' : '매입'} 견적서가 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredQuotations.map((q) => (
                <div
                  key={q.id}
                  className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700 font-mono">
                      {q.quotationNo}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {q.revision > 1 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 text-[10px] font-medium">
                          <GitBranch className="w-3 h-3" strokeWidth={1.75} />
                          Rev.{q.revision}
                        </span>
                      )}
                      {q.isConfirmed && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-medium">
                          <BadgeCheck className="w-3 h-3" strokeWidth={1.75} />
                          확정
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    {q.counterpartName}
                  </p>
                  <p className="text-sm font-mono font-medium text-slate-800 text-right">
                    {q.totalAmount != null
                      ? `\u20A9${q.totalAmount.toLocaleString('ko-KR')}`
                      : '-'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Memos ── */}
      {project.memos && project.memos.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            최근 메모
          </h2>
          <div className="space-y-3">
            {project.memos.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-3 p-3 bg-slate-50/60 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-[#078080]">
                    {m.author?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {m.author?.name || '알 수 없음'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(m.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {m.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEdit && (
        <ProjectFormModal
          project={project}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            fetchProject();
          }}
        />
      )}
    </div>
  );
}

/* ── Sub-components ── */

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-100/80 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}

function AmountCard({
  icon: Icon,
  label,
  amount,
  amountText,
  sub,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  amount?: number;
  amountText?: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-slate-100/80 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.75} />
        </div>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
      <p className={`text-lg font-mono font-semibold ${color} text-right`}>
        {amountText ?? formatAmount(amount ?? null)}
      </p>
      {sub && (
        <p className="text-[11px] text-slate-400 text-right mt-1">{sub}</p>
      )}
    </div>
  );
}
