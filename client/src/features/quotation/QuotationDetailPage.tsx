import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Copy,
  GitBranch,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  Trash2,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SendMailModal from './SendMailModal';
import api from '@/services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface QuotationItem {
  id: number;
  name: string;
  spec: string | null;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  remark: string | null;
}

interface RevisionRecord {
  id: number;
  revision: number;
  changeNote: string | null;
  createdAt: string;
  author: { id: number; name: string };
}

interface LinkedQuotation {
  id: number;
  quotationNo: string;
  title: string;
  direction: 'SALES' | 'PURCHASE';
  status: string;
}

interface QuotationDetail {
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
  validUntil: string | null;
  paymentTerms: string | null;
  defaultTaxRate: number;
  counterpart: { id: number; name: string } | null;
  project: { id: number; name: string } | null;
  ourCompany: { id: number; code: string; name: string };
  author: { id: number; name: string };
  items: QuotationItem[];
  revisions: RevisionRecord[];
  sourceQuotation: LinkedQuotation | null;
  derivedQuotations: LinkedQuotation[];
  purchaseOrder: { id: number } | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const DIR_LABEL: Record<string, string> = { SALES: '매출', PURCHASE: '매입' };
const DIR_COLOR: Record<string, string> = {
  SALES: 'bg-teal-100 text-teal-700',
  PURCHASE: 'bg-violet-100 text-violet-700',
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성중',
  SENT: '발송',
  CONFIRMED: '확정',
  VOID: '폐기',
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  VOID: 'bg-red-100 text-red-600',
};

function fmt(n: number): string {
  return `₩${n.toLocaleString('ko-KR')}`;
}

function fmtDate(d: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR');
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showMailModal, setShowMailModal] = useState(false);
  const [data, setData] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revOpen, setRevOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/quotations/${id}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError('견적서를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /* ---- Actions ---- */
  async function handleConfirm() {
    if (!data || actionLoading) return;
    if (!window.confirm('이 견적서를 확정하시겠습니까?')) return;
    setActionLoading(true);
    try {
      await api.post(`/quotations/${data.id}/confirm`);
      fetchDetail();
    } catch {
      alert('확정에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVoid() {
    if (!data || actionLoading) return;
    if (!window.confirm('이 견적서를 폐기하시겠습니까? 되돌릴 수 없습니다.'))
      return;
    setActionLoading(true);
    try {
      await api.post(`/quotations/${data.id}/void`);
      fetchDetail();
    } catch {
      alert('폐기에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!data || actionLoading) return;
    if (!window.confirm('이 견적서를 삭제하시겠습니까? 되돌릴 수 없습니다.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/quotations/${data.id}`);
      navigate('/quotations');
    } catch {
      alert('삭제에 실패했습니다. 확정된 견적서는 삭제할 수 없습니다.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDuplicate() {
    if (!data || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/quotations/${data.id}/duplicate`);
      navigate(`/quotations/${res.data.data.id}`);
    } catch {
      alert('복제에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGenerateSales() {
    if (!data || actionLoading) return;
    const marginStr = window.prompt('마진율(%)을 입력하세요:', '10');
    if (marginStr === null) return;
    const marginValue = Number(marginStr);
    if (isNaN(marginValue)) {
      alert('유효한 숫자를 입력하세요.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/quotations/${data.id}/generate-sales`, {
        marginType: 'rate',
        marginValue,
      });
      navigate(`/quotations/${res.data.data.id}`);
    } catch {
      alert('매출 견적서 생성에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  }

  /* ---- Loading / Error ---- */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-slate-100 rounded-xl animate-pulse" />
        <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl h-64 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center shadow-sm">
        <p className="text-sm text-red-500">{error || '데이터 없음'}</p>
        <button
          onClick={() => navigate('/quotations')}
          className="mt-4 text-sm text-primary hover:underline"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const canConfirm = !data.isConfirmed && data.status !== 'VOID';
  const canVoid = data.status !== 'VOID';
  const canRevision = !data.isConfirmed && data.status !== 'VOID';
  const canGenerateSales = data.direction === 'PURCHASE';

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ---- Back ---- */}
      <button
        onClick={() => navigate('/quotations')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        견적서 목록
      </button>

      {/* ---- Header card ---- */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold font-mono text-slate-800">
                {data.quotationNo}
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${DIR_COLOR[data.direction]}`}
              >
                {DIR_LABEL[data.direction]}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLOR[data.status]}`}
              >
                {STATUS_LABEL[data.status]}
              </span>
              {data.revision > 0 && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  Rev.{data.revision}
                </span>
              )}
              {data.isConfirmed && (
                <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                  확정
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl bg-primary text-white hover:brightness-110 shadow-sm transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                확정
              </button>
            )}
            {canVoid && (
              <button
                onClick={handleVoid}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" strokeWidth={1.75} />
                폐기
              </button>
            )}
            {canRevision && (
              <button
                onClick={() =>
                  navigate(`/quotations?revision=${data.id}`)
                }
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition disabled:opacity-50"
              >
                <GitBranch className="w-4 h-4" strokeWidth={1.75} />
                리비전
              </button>
            )}
            <button
              onClick={handleDuplicate}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition disabled:opacity-50"
            >
              <Copy className="w-4 h-4" strokeWidth={1.75} />
              복제
            </button>
            {canGenerateSales && (
              <button
                onClick={handleGenerateSales}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" strokeWidth={1.75} />
                매출 견적서 생성
              </button>
            )}
            <button
              onClick={async () => {
                try {
                  const res = await api.get(`/quotations/${id}/excel`, { responseType: 'blob' });
                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const a = document.createElement('a');
                  a.href = url;
                  a.setAttribute('download', `견적서_${data.quotationNo}.xlsx`);
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                } catch { alert('다운로드에 실패했습니다.'); }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl bg-white/60 text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4" strokeWidth={1.75} />
              엑셀 다운로드
            </button>
            <button
              onClick={() => setShowMailModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
            >
              <Mail className="w-4 h-4" strokeWidth={1.75} />
              메일 발송
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                삭제
              </button>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          <InfoCell label="제목" value={data.title} />
          <InfoCell label="견적일" value={fmtDate(data.quotationDate)} />
          <InfoCell label="유효기한" value={fmtDate(data.validUntil)} />
          <InfoCell label="결제조건" value={data.paymentTerms || '-'} />
          <InfoCell label="거래처" value={data.counterpart?.name || '-'} />
          <InfoCell label="프로젝트" value={data.project?.name || '-'} />
          <InfoCell label="작성자" value={data.author.name} />
          <InfoCell label="회사" value={data.ourCompany.name} />
        </div>
      </div>

      {/* ---- Source / Derived links ---- */}
      {(data.sourceQuotation || data.derivedQuotations.length > 0) && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            연결된 견적서
          </h3>
          <div className="space-y-2">
            {data.sourceQuotation && (
              <LinkedRow
                label="원본"
                q={data.sourceQuotation}
              />
            )}
            {data.derivedQuotations.map((dq) => (
              <LinkedRow key={dq.id} label="파생" q={dq} />
            ))}
          </div>
        </div>
      )}

      {/* ---- Items table ---- */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">
            품목 ({data.items.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">품명</th>
                <th className="px-4 py-3 font-medium">규격</th>
                <th className="px-4 py-3 font-medium">단위</th>
                <th className="px-4 py-3 font-medium text-right">수량</th>
                <th className="px-4 py-3 font-medium text-right">단가</th>
                <th className="px-4 py-3 font-medium text-right">금액</th>
                <th className="px-4 py-3 font-medium text-right">세율</th>
                <th className="px-4 py-3 font-medium">비고</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition"
                >
                  <td className="px-6 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.spec || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.unit || '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {item.quantity.toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {item.unitPrice.toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">
                    {item.amount.toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {item.taxRate}%
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {item.remark || ''}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80">
                <td
                  colSpan={6}
                  className="px-6 py-3 text-right text-sm font-medium text-slate-500"
                >
                  공급가액
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                  {fmt(data.supplyAmount)}
                </td>
                <td colSpan={2} />
              </tr>
              <tr className="bg-slate-50/80">
                <td
                  colSpan={6}
                  className="px-6 py-2 text-right text-sm font-medium text-slate-500"
                >
                  세액
                </td>
                <td className="px-4 py-2 text-right font-mono font-bold text-slate-800">
                  {fmt(data.taxAmount)}
                </td>
                <td colSpan={2} />
              </tr>
              <tr className="bg-primary/5">
                <td
                  colSpan={6}
                  className="px-6 py-3 text-right text-sm font-bold text-slate-700"
                >
                  합계
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-lg text-primary">
                  {fmt(data.totalAmount)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ---- Revision history ---- */}
      {data.revisions.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm rounded-2xl overflow-hidden">
          <button
            onClick={() => setRevOpen(!revOpen)}
            className="w-full px-6 py-4 flex items-center justify-between text-sm font-semibold text-slate-700 hover:bg-slate-50/50 transition"
          >
            <span>리비전 이력 ({data.revisions.length})</span>
            {revOpen ? (
              <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
          {revOpen && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {data.revisions.map((rev) => (
                <div key={rev.id} className="px-6 py-3 flex items-start gap-3">
                  <span className="shrink-0 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-0.5">
                    Rev.{rev.revision}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      {rev.changeNote || '(메모 없음)'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {rev.author.name} &middot; {fmtDate(rev.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showMailModal && data && (
        <SendMailModal
          quotationId={data.id as unknown as string}
          quotationNo={data.quotationNo}
          contactEmail={data.contactEmail}
          onClose={() => setShowMailModal(false)}
          onSent={() => { setShowMailModal(false); alert('메일이 발송되었습니다.'); fetchData(); }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-slate-700 font-medium">{value}</p>
    </div>
  );
}

function LinkedRow({
  label,
  q,
}: {
  label: string;
  q: LinkedQuotation;
}) {
  return (
    <Link
      to={`/quotations/${q.id}`}
      className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition p-2 -mx-2 rounded-lg hover:bg-primary/5"
    >
      <span className="text-xs text-slate-400">{label}</span>
      <span className="font-mono font-medium">{q.quotationNo}</span>
      <span className="truncate text-slate-500">{q.title}</span>
      <span
        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${DIR_COLOR[q.direction]}`}
      >
        {DIR_LABEL[q.direction]}
      </span>
      <ExternalLink className="w-3.5 h-3.5 ml-auto shrink-0 text-slate-300" strokeWidth={1.75} />
    </Link>
  );
}
