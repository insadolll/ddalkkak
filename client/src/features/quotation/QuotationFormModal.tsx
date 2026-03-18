import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '@/services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Company {
  id: number;
  name: string;
}

interface ItemRow {
  key: number;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  remark: string;
}

interface QuotationFormData {
  direction: 'SALES' | 'PURCHASE';
  title: string;
  quotationDate: string;
  validUntil: string;
  paymentTerms: string;
  counterpartId: number | null;
  contactName: string;
  contactEmail: string;
  defaultTaxRate: number;
  items: ItemRow[];
}

interface ExistingQuotation {
  id: number;
  direction: 'SALES' | 'PURCHASE';
  title: string;
  quotationDate: string;
  validUntil: string | null;
  paymentTerms: string | null;
  counterpart: { id: number; name: string } | null;
  contactName?: string;
  contactEmail?: string;
  defaultTaxRate: number;
  items: Array<{
    name: string;
    spec: string | null;
    unit: string | null;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    remark: string | null;
  }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (id: number) => void;
  existing?: ExistingQuotation | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

let keySeq = 0;
function nextKey(): number {
  return ++keySeq;
}

function emptyItem(): ItemRow {
  return {
    key: nextKey(),
    name: '',
    spec: '',
    unit: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 10,
    remark: '',
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(n: number): string {
  return `₩${n.toLocaleString('ko-KR')}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function QuotationFormModal({
  open,
  onClose,
  onSaved,
  existing,
}: Props) {
  const isEdit = !!existing;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<QuotationFormData>(() => initForm(null));

  // Initialize form when modal opens or existing changes
  useEffect(() => {
    if (open) setForm(initForm(existing ?? null));
  }, [open, existing]);

  // Fetch companies for counterpart dropdown
  useEffect(() => {
    if (!open) return;
    api
      .get('/companies')
      .then((res) => {
        const list = Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        setCompanies(list);
      })
      .catch(() => setCompanies([]));
  }, [open]);

  /* ---- Calculations ---- */
  const calculations = useMemo(() => {
    let supply = 0;
    const rows = form.items.map((item) => {
      const amount = item.quantity * item.unitPrice;
      supply += amount;
      return { ...item, amount };
    });
    const tax = Math.floor(supply * (form.defaultTaxRate / 100));
    return { rows, supply, tax, total: supply + tax };
  }, [form.items, form.defaultTaxRate]);

  /* ---- Item handlers ---- */
  function updateItem(key: number, field: keyof ItemRow, value: string | number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  }

  function removeItem(key: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.key !== key),
    }));
  }

  /* ---- Submit ---- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.items.length === 0) {
      alert('품목을 1개 이상 추가하세요.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        direction: form.direction,
        title: form.title,
        quotationDate: form.quotationDate,
        validUntil: form.validUntil || undefined,
        paymentTerms: form.paymentTerms || undefined,
        counterpartId: form.counterpartId || undefined,
        contactName: form.contactName || undefined,
        contactEmail: form.contactEmail || undefined,
        defaultTaxRate: form.defaultTaxRate,
        items: form.items.map((i) => ({
          name: i.name,
          spec: i.spec || undefined,
          unit: i.unit || undefined,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
          remark: i.remark || undefined,
        })),
      };

      let res;
      if (isEdit && existing) {
        res = await api.put(`/quotations/${existing.id}`, payload);
      } else {
        res = await api.post('/quotations', payload);
      }
      onSaved(res.data.data.id);
    } catch {
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-4 bg-white/95 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? '견적서 수정' : '새 견적서'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ---- Direction ---- */}
          <fieldset className="flex items-center gap-4">
            <legend className="text-sm font-medium text-slate-600 mb-2">
              구분
            </legend>
            {(['SALES', 'PURCHASE'] as const).map((d) => (
              <label
                key={d}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition ${
                  form.direction === d
                    ? d === 'SALES'
                      ? 'border-teal-300 bg-teal-50 text-teal-700'
                      : 'border-violet-300 bg-violet-50 text-violet-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="direction"
                  value={d}
                  checked={form.direction === d}
                  onChange={() =>
                    setForm((p) => ({ ...p, direction: d }))
                  }
                  className="sr-only"
                />
                <span className="text-sm font-medium">
                  {d === 'SALES' ? '매출' : '매입'}
                </span>
              </label>
            ))}
          </fieldset>

          {/* ---- Basic fields ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="제목"
              required
              value={form.title}
              onChange={(v) => setForm((p) => ({ ...p, title: v }))}
            />
            <Field
              label="견적일"
              type="date"
              required
              value={form.quotationDate}
              onChange={(v) => setForm((p) => ({ ...p, quotationDate: v }))}
            />
            <Field
              label="유효기한"
              type="date"
              value={form.validUntil}
              onChange={(v) => setForm((p) => ({ ...p, validUntil: v }))}
            />
            <Field
              label="결제조건"
              value={form.paymentTerms}
              onChange={(v) => setForm((p) => ({ ...p, paymentTerms: v }))}
              placeholder="예: 납품후 30일"
            />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                거래처
              </label>
              <select
                value={form.counterpartId ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    counterpartId: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              >
                <option value="">선택 안 함</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="담당자명"
              value={form.contactName}
              onChange={(v) => setForm((p) => ({ ...p, contactName: v }))}
            />
            <Field
              label="담당자 이메일"
              type="email"
              value={form.contactEmail}
              onChange={(v) => setForm((p) => ({ ...p, contactEmail: v }))}
            />
            <Field
              label="기본 세율(%)"
              type="number"
              value={String(form.defaultTaxRate)}
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  defaultTaxRate: Number(v) || 0,
                }))
              }
            />
          </div>

          {/* ---- Items ---- */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">
                품목 ({form.items.length})
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition"
              >
                <Plus className="w-4 h-4" strokeWidth={1.75} />
                품목 추가
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-400">
                    <th className="px-3 py-2 text-left font-medium w-[180px]">
                      품명 *
                    </th>
                    <th className="px-2 py-2 text-left font-medium w-[100px]">
                      규격
                    </th>
                    <th className="px-2 py-2 text-left font-medium w-[60px]">
                      단위
                    </th>
                    <th className="px-2 py-2 text-right font-medium w-[80px]">
                      수량
                    </th>
                    <th className="px-2 py-2 text-right font-medium w-[110px]">
                      단가
                    </th>
                    <th className="px-2 py-2 text-right font-medium w-[60px]">
                      세율%
                    </th>
                    <th className="px-2 py-2 text-left font-medium w-[100px]">
                      비고
                    </th>
                    <th className="px-2 py-2 text-right font-medium w-[110px]">
                      금액
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item) => {
                    const amt = item.quantity * item.unitPrice;
                    return (
                      <tr
                        key={item.key}
                        className="border-t border-slate-100 hover:bg-slate-50/50"
                      >
                        <td className="px-2 py-1.5">
                          <input
                            required
                            value={item.name}
                            onChange={(e) =>
                              updateItem(item.key, 'name', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-1 py-1.5">
                          <input
                            value={item.spec}
                            onChange={(e) =>
                              updateItem(item.key, 'spec', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-1 py-1.5">
                          <input
                            value={item.unit}
                            onChange={(e) =>
                              updateItem(item.key, 'unit', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-1 py-1.5">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                'quantity',
                                Number(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1.5 text-sm text-right font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-1 py-1.5">
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                'unitPrice',
                                Number(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1.5 text-sm text-right font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-1 py-1.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.taxRate}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                'taxRate',
                                Number(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1.5 text-sm text-right rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-1 py-1.5">
                          <input
                            value={item.remark}
                            onChange={(e) =>
                              updateItem(item.key, 'remark', e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-sm font-medium text-slate-700">
                          {amt.toLocaleString('ko-KR')}
                        </td>
                        <td className="px-1 py-1.5">
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {form.items.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-slate-400">
                  품목을 추가하세요.
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="mt-3 flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>공급가액</span>
                  <span className="font-mono font-medium text-slate-700">
                    {fmt(calculations.supply)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>세액</span>
                  <span className="font-mono font-medium text-slate-700">
                    {fmt(calculations.tax)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-800">
                  <span>합계</span>
                  <span className="font-mono text-primary">
                    {fmt(calculations.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Footer ---- */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary hover:brightness-110 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {saving ? '저장중...' : isEdit ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Field helper                                                      */
/* ------------------------------------------------------------------ */

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Init form helper                                                  */
/* ------------------------------------------------------------------ */

function initForm(existing: ExistingQuotation | null): QuotationFormData {
  if (existing) {
    return {
      direction: existing.direction,
      title: existing.title,
      quotationDate: existing.quotationDate.slice(0, 10),
      validUntil: existing.validUntil?.slice(0, 10) ?? '',
      paymentTerms: existing.paymentTerms ?? '',
      counterpartId: existing.counterpart?.id ?? null,
      contactName: existing.contactName ?? '',
      contactEmail: existing.contactEmail ?? '',
      defaultTaxRate: existing.defaultTaxRate,
      items: existing.items.map((i) => ({
        key: nextKey(),
        name: i.name,
        spec: i.spec ?? '',
        unit: i.unit ?? '',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
        remark: i.remark ?? '',
      })),
    };
  }
  return {
    direction: 'SALES',
    title: '',
    quotationDate: today(),
    validUntil: '',
    paymentTerms: '',
    counterpartId: null,
    contactName: '',
    contactEmail: '',
    defaultTaxRate: 10,
    items: [emptyItem()],
  };
}
