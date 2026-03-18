import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';

/* ── Types ── */

interface Company {
  id: number;
  name: string;
}

interface SingleTransactionFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Component ── */

export default function SingleTransactionFormModal({
  open,
  onClose,
  onCreated,
}: SingleTransactionFormModalProps) {
  const [direction, setDirection] = useState<'SALES' | 'PURCHASE'>('SALES');
  const [itemDesc, setItemDesc] = useState('');
  const [supplyAmount, setSupplyAmount] = useState('');
  const [taxRate, setTaxRate] = useState('10');
  const [tradeDate, setTradeDate] = useState('');
  const [counterpartId, setCounterpartId] = useState('');
  const [memo, setMemo] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      api
        .get<{ data: Company[] }>('/companies')
        .then((res) => setCompanies(res.data.data))
        .catch(() => {
          /* ignore */
        });
    }
  }, [open]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setDirection('SALES');
      setItemDesc('');
      setSupplyAmount('');
      setTaxRate('10');
      setTradeDate('');
      setCounterpartId('');
      setMemo('');
      setError('');
    }
  }, [open]);

  const supply = Number(supplyAmount) || 0;
  const rate = Number(taxRate) || 0;
  const tax = Math.floor(supply * rate / 100);
  const total = supply + tax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemDesc.trim()) {
      setError('품목을 입력해주세요.');
      return;
    }
    if (supply <= 0) {
      setError('공급가액을 입력해주세요.');
      return;
    }
    if (!tradeDate) {
      setError('거래일을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/single-transactions', {
        direction,
        itemDesc: itemDesc.trim(),
        supplyAmount: supply,
        taxRate: rate,
        tradeDate,
        counterpartId: counterpartId ? Number(counterpartId) : undefined,
        memo: memo.trim() || undefined,
      });
      onCreated();
      onClose();
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/60">
          <h3 className="text-base font-semibold text-slate-800">
            새 단건 거래
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              거래 유형
            </label>
            <div className="flex gap-2">
              {(['SALES', 'PURCHASE'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    direction === d
                      ? d === 'SALES'
                        ? 'bg-[#078080] text-white shadow-sm'
                        : 'bg-violet-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {d === 'SALES' ? '매출' : '매입'}
                </button>
              ))}
            </div>
          </div>

          {/* Item description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              품목
            </label>
            <input
              type="text"
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="품목 설명을 입력하세요"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/50 transition-all"
            />
          </div>

          {/* Supply amount + Tax rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                공급가액
              </label>
              <input
                type="number"
                value={supplyAmount}
                onChange={(e) => setSupplyAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-800 font-mono placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                세율 (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                min="0"
                max="100"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-800 font-mono placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/50 transition-all"
              />
            </div>
          </div>

          {/* Live tax calculation */}
          <div className="bg-slate-50/80 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-sm text-slate-500">
              <span>공급가액</span>
              <span className="font-mono">
                {'\u20A9'}
                {supply.toLocaleString('ko-KR')}
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>세액</span>
              <span className="font-mono">
                {'\u20A9'}
                {tax.toLocaleString('ko-KR')}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-1 flex justify-between text-sm font-semibold text-slate-800">
              <span>합계</span>
              <span className="font-mono">
                {'\u20A9'}
                {total.toLocaleString('ko-KR')}
              </span>
            </div>
          </div>

          {/* Trade date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              거래일
            </label>
            <input
              type="date"
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/50 transition-all"
            />
          </div>

          {/* Counterpart */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              거래처
            </label>
            <select
              value={counterpartId}
              onChange={(e) => setCounterpartId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/50 transition-all"
            >
              <option value="">선택 안함</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              메모
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="참고 사항"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#078080]/30 focus:border-[#078080]/50 transition-all resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-[#078080] text-white text-sm font-medium hover:bg-[#078080]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
