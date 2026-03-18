import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import api from '@/services/api';
import CompanyLookupModal from '@/components/CompanyLookupModal';

/* ── Types ── */
interface Company { id: string; name: string; contacts?: Contact[]; }
interface Contact { id: string; name: string; position: string | null; phone: string | null; email: string | null; }
interface ItemRow { key: number; name: string; spec: string; unit: string; quantity: number; unitPrice: number; taxRate: number; remark: string; }

interface ExistingQuotation {
  id: string;
  direction: 'SALES' | 'PURCHASE';
  title: string;
  quotationDate: string;
  validUntil: string | null;
  paymentTerms: string | null;
  counterpart: { id: string; name: string } | null;
  contactName?: string;
  contactEmail?: string;
  defaultTaxRate: number;
  items: Array<{ name: string; spec: string | null; unit: string | null; quantity: number; unitPrice: number; taxRate: number; remark: string | null; }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
  existing?: ExistingQuotation | null;
}

const PAYMENT_TERMS = ['현금결제', '선입금', '월말', '익월말', '익익월말', '협의'];
const VALIDITY_OPTIONS = ['견적일로부터 7일', '견적일로부터 15일', '견적일로부터 30일', '견적일로부터 60일', '별도 협의'];

/* ── Helpers ── */
let keySeq = 0;
function nextKey() { return ++keySeq; }
function emptyItem(): ItemRow { return { key: nextKey(), name: '', spec: '', unit: '', quantity: 1, unitPrice: 0, taxRate: 10, remark: '' }; }
function today() { return new Date().toISOString().slice(0, 10); }
function fmt(n: number) { return `₩${n.toLocaleString('ko-KR')}`; }

/* ── Component ── */
export default function QuotationFormModal({ open, onClose, onSaved, existing }: Props) {
  const isEdit = !!existing;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showLookup, setShowLookup] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [direction, setDirection] = useState<'SALES' | 'PURCHASE'>('SALES');
  const [title, setTitle] = useState('');
  const [quotationDate, setQuotationDate] = useState(today());
  const [validUntil, setValidUntil] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentCustom, setPaymentCustom] = useState(false);
  const [counterpartId, setCounterpartId] = useState('');
  const [contactName, setContactName] = useState('');
  const [, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [defaultTaxRate, setDefaultTaxRate] = useState(10);
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  // Load companies
  useEffect(() => {
    if (!open) return;
    api.get('/companies', { params: { limit: 500 } }).then(r => setCompanies(r.data.data)).catch(() => {});
  }, [open]);

  // Load contacts when counterpart changes
  useEffect(() => {
    if (!counterpartId) { setContacts([]); return; }
    api.get(`/companies/${counterpartId}`).then(r => {
      setContacts(r.data.data.contacts || []);
    }).catch(() => setContacts([]));
  }, [counterpartId]);

  // Init from existing
  useEffect(() => {
    if (!open) return;
    if (existing) {
      setDirection(existing.direction);
      setTitle(existing.title);
      setQuotationDate(existing.quotationDate.slice(0, 10));
      setValidUntil(existing.validUntil?.slice(0, 10) ?? '');
      setPaymentTerms(existing.paymentTerms ?? '');
      setPaymentCustom(existing.paymentTerms ? !PAYMENT_TERMS.includes(existing.paymentTerms) : false);
      setCounterpartId(existing.counterpart?.id ?? '');
      setContactName(existing.contactName ?? '');
      setContactEmail(existing.contactEmail ?? '');
      setDefaultTaxRate(existing.defaultTaxRate);
      setItems(existing.items.map(i => ({ key: nextKey(), name: i.name, spec: i.spec ?? '', unit: i.unit ?? '', quantity: i.quantity, unitPrice: i.unitPrice, taxRate: i.taxRate, remark: i.remark ?? '' })));
    } else {
      setDirection('SALES'); setTitle(''); setQuotationDate(today()); setValidUntil('');
      setPaymentTerms(''); setPaymentCustom(false); setCounterpartId('');
      setContactName(''); setContactPhone(''); setContactEmail('');
      setDefaultTaxRate(10); setItems([emptyItem()]);
    }
  }, [open, existing]);

  // Calculations
  const calc = useMemo(() => {
    let supply = 0;
    items.forEach(i => { supply += i.quantity * i.unitPrice; });
    const tax = Math.floor(supply * defaultTaxRate / 100);
    return { supply, tax, total: supply + tax };
  }, [items, defaultTaxRate]);

  function updateItem(key: number, field: keyof ItemRow, value: string | number) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i));
  }

  function selectContact(ct: Contact) {
    setContactName(ct.name + (ct.position ? ` (${ct.position})` : ''));
    setContactPhone(ct.phone || '');
    setContactEmail(ct.email || '');
  }

  async function handleLookupSelect(result: { name: string; bizNumber: string; representative: string; address: string; phone: string }) {
    try {
      const res = await api.post('/companies', { name: result.name, bizNumber: result.bizNumber || undefined, representative: result.representative || undefined, address: result.address || undefined, phone: result.phone || undefined });
      const newCompany = res.data.data;
      setCompanies(prev => [...prev, newCompany]);
      setCounterpartId(newCompany.id);
    } catch {
      const existing = companies.find(c => c.name === result.name);
      if (existing) setCounterpartId(existing.id);
      else alert('거래처 등록에 실패했습니다.');
    }
    setShowLookup(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0 || !items.some(i => i.name)) { alert('품목을 1개 이상 입력하세요.'); return; }
    setSaving(true);
    try {
      const payload = {
        direction, title, quotationDate,
        validUntil: validUntil || undefined,
        paymentTerms: paymentTerms || undefined,
        counterpartId: counterpartId || undefined,
        contactName: contactName || undefined,
        contactEmail: contactEmail || undefined,
        defaultTaxRate,
        items: items.filter(i => i.name).map(i => ({
          name: i.name, spec: i.spec || undefined, unit: i.unit || undefined,
          quantity: i.quantity, unitPrice: i.unitPrice, taxRate: i.taxRate, remark: i.remark || undefined,
        })),
      };
      const res = isEdit && existing
        ? await api.put(`/quotations/${existing.id}`, payload)
        : await api.post('/quotations', payload);
      onSaved(res.data.data.id);
    } catch { alert('저장에 실패했습니다.'); }
    setSaving(false);
  }

  if (!open) return null;

  const inputCls = "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl mx-4 bg-white/95 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{isEdit ? '견적서 수정' : '새 견적서'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition"><X className="w-5 h-5" strokeWidth={1.75} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Direction */}
          <div className="flex items-center gap-3">
            {(['SALES', 'PURCHASE'] as const).map(d => (
              <label key={d} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition ${direction === d ? (d === 'SALES' ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-violet-300 bg-violet-50 text-violet-700') : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <input type="radio" name="direction" value={d} checked={direction === d} onChange={() => setDirection(d)} className="sr-only" />
                <span className="text-sm font-medium">{d === 'SALES' ? '매출' : '매입'}</span>
              </label>
            ))}
          </div>

          {/* Basic fields */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>제목</label><input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>견적일 *</label><input type="date" required value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className={inputCls} /></div>
            <div>
              <label className={labelCls}>유효기간</label>
              <select value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputCls}>
                <option value="">선택</option>
                {VALIDITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>결제조건</label>
              {paymentCustom ? (
                <div className="flex gap-1">
                  <input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="직접 입력" className={inputCls} />
                  <button type="button" onClick={() => { setPaymentCustom(false); setPaymentTerms(''); }} className="px-2 text-xs text-slate-400 hover:text-slate-600">✕</button>
                </div>
              ) : (
                <select value={paymentTerms} onChange={e => { if (e.target.value === '__custom') { setPaymentCustom(true); setPaymentTerms(''); } else setPaymentTerms(e.target.value); }} className={inputCls}>
                  <option value="">선택</option>
                  {PAYMENT_TERMS.map(v => <option key={v} value={v}>{v}</option>)}
                  <option value="__custom">직접 입력...</option>
                </select>
              )}
            </div>
            <div><label className={labelCls}>기본 세율(%)</label><input type="number" min={0} max={100} value={defaultTaxRate} onChange={e => setDefaultTaxRate(Number(e.target.value) || 0)} className={inputCls} /></div>
          </div>

          {/* Counterpart + Contact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>거래처</label>
              <div className="flex gap-1.5">
                <select value={counterpartId} onChange={e => setCounterpartId(e.target.value)} className={"flex-1 " + inputCls}>
                  <option value="">선택</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowLookup(true)} className="px-2.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition" title="공공데이터 검색">
                  <Search className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
              {contacts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {contacts.map(ct => (
                    <button key={ct.id} type="button" onClick={() => selectContact(ct)} className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-600 rounded-full hover:bg-primary/10 hover:text-primary transition">
                      {ct.name}{ct.position ? ` (${ct.position})` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div><label className={labelCls}>담당자명</label><input value={contactName} onChange={e => setContactName(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>담당자 이메일</label><input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className={inputCls} /></div>
          </div>

          {/* Items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-700">품목 ({items.length})</h3>
              <button type="button" onClick={() => setItems(p => [...p, emptyItem()])} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium">
                <Plus className="w-4 h-4" strokeWidth={1.75} />추가
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-xs text-slate-400">
                  <th className="px-2 py-2 text-left font-medium w-[160px]">품명 *</th>
                  <th className="px-2 py-2 text-left font-medium w-[90px]">규격</th>
                  <th className="px-2 py-2 text-left font-medium w-[50px]">단위</th>
                  <th className="px-2 py-2 text-right font-medium w-[70px]">수량</th>
                  <th className="px-2 py-2 text-right font-medium w-[100px]">단가</th>
                  <th className="px-2 py-2 text-right font-medium w-[50px]">세율%</th>
                  <th className="px-2 py-2 text-left font-medium w-[80px]">비고</th>
                  <th className="px-2 py-2 text-right font-medium w-[100px]">금액</th>
                  <th className="w-8" />
                </tr></thead>
                <tbody>
                  {items.map(item => {
                    const amt = item.quantity * item.unitPrice;
                    const cellCls = "w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30";
                    return (
                      <tr key={item.key} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-1 py-1"><input required value={item.name} onChange={e => updateItem(item.key, 'name', e.target.value)} className={cellCls} /></td>
                        <td className="px-1 py-1"><input value={item.spec} onChange={e => updateItem(item.key, 'spec', e.target.value)} className={cellCls} /></td>
                        <td className="px-1 py-1"><input value={item.unit} onChange={e => updateItem(item.key, 'unit', e.target.value)} className={cellCls} /></td>
                        <td className="px-1 py-1"><input type="number" min={1} value={item.quantity} onChange={e => updateItem(item.key, 'quantity', Number(e.target.value) || 0)} className={cellCls + " text-right font-mono"} /></td>
                        <td className="px-1 py-1"><input type="number" min={0} value={item.unitPrice} onChange={e => updateItem(item.key, 'unitPrice', Number(e.target.value) || 0)} className={cellCls + " text-right font-mono"} /></td>
                        <td className="px-1 py-1"><input type="number" min={0} max={100} value={item.taxRate} onChange={e => updateItem(item.key, 'taxRate', Number(e.target.value) || 0)} className={cellCls + " text-right"} /></td>
                        <td className="px-1 py-1"><input value={item.remark} onChange={e => updateItem(item.key, 'remark', e.target.value)} className={cellCls} /></td>
                        <td className="px-2 py-1 text-right font-mono text-sm font-medium text-slate-700">{amt.toLocaleString('ko-KR')}</td>
                        <td className="px-1 py-1"><button type="button" onClick={() => setItems(p => p.filter(i => i.key !== item.key))} className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"><Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {items.length === 0 && <div className="px-6 py-6 text-center text-sm text-slate-400">품목을 추가하세요.</div>}
            </div>

            {/* Totals */}
            <div className="mt-3 flex justify-end">
              <div className="w-56 space-y-1 text-sm">
                <div className="flex justify-between text-slate-500"><span>공급가액</span><span className="font-mono font-medium text-slate-700">{fmt(calc.supply)}</span></div>
                <div className="flex justify-between text-slate-500"><span>세액</span><span className="font-mono font-medium text-slate-700">{fmt(calc.tax)}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-800"><span>합계</span><span className="font-mono text-primary">{fmt(calc.total)}</span></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition">취소</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-medium text-white bg-primary hover:brightness-110 rounded-xl shadow-sm transition disabled:opacity-50">
              {saving ? '저장중...' : isEdit ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </div>

      {showLookup && <CompanyLookupModal onClose={() => setShowLookup(false)} onSelect={handleLookupSelect} />}
    </div>
  );
}
