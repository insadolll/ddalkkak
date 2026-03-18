import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Building2, Pencil, Trash2, User, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import CompanyLookupModal from '@/components/CompanyLookupModal';

interface Contact {
  id: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
}

interface Company {
  id: string;
  name: string;
  code: string | null;
  bizNumber: string | null;
  representative: string | null;
  address: string | null;
  phone: string | null;
  taxEmail: string | null;
  memo: string | null;
  contacts: Contact[];
}

export default function CompanyListPage() {
  const { user, selectedCompanyId } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLookup, setShowLookup] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', bizNumber: '', representative: '', address: '', phone: '', taxEmail: '', memo: '' });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (search) params.search = search;
      const res = await api.get('/companies', { params });
      setCompanies(res.data.data);
    } catch { /* */ }
    setLoading(false);
  }, [search, selectedCompanyId]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  function openCreate() {
    setEditId(null);
    setForm({ name: '', bizNumber: '', representative: '', address: '', phone: '', taxEmail: '', memo: '' });
    setShowForm(true);
  }

  function openEdit(c: Company) {
    setEditId(c.id);
    setForm({ name: c.name, bizNumber: c.bizNumber || '', representative: c.representative || '', address: c.address || '', phone: c.phone || '', taxEmail: c.taxEmail || '', memo: c.memo || '' });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/companies/${editId}`, form);
      } else {
        await api.post('/companies', form);
      }
      setShowForm(false);
      fetchCompanies();
    } catch { alert('저장에 실패했습니다.'); }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`"${name}" 거래처를 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/companies/${id}`);
      fetchCompanies();
    } catch { alert('삭제에 실패했습니다.'); }
  }

  async function handleLookupSelect(result: { name: string; bizNumber: string; representative: string; address: string; phone: string }) {
    try {
      await api.post('/companies', {
        name: result.name,
        bizNumber: result.bizNumber || undefined,
        representative: result.representative || undefined,
        address: result.address || undefined,
        phone: result.phone || undefined,
      });
      fetchCompanies();
    } catch { alert('이미 존재하는 거래처이거나 등록에 실패했습니다.'); }
    setShowLookup(false);
  }

  const isAdmin = user?.role === 'ADMIN';
  const canEdit = isAdmin || user?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" strokeWidth={1.75} />
          <h2 className="text-xl font-bold text-slate-800">거래처 관리</h2>
          <span className="text-sm text-slate-400">{companies.length}개</span>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => setShowLookup(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
              <Search className="w-4 h-4" strokeWidth={1.75} />공공데이터 검색
            </button>
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-light shadow-sm transition">
              <Plus className="w-4 h-4" strokeWidth={2} />새 거래처
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="거래처명, 사업자번호 검색..." className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-white/80 rounded-2xl animate-pulse" />)}
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center shadow-sm">
          <Building2 className="w-10 h-10 text-slate-200 mx-auto mb-3" strokeWidth={1.75} />
          <p className="text-slate-400">거래처가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(c => (
            <div key={c.id} className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.bizNumber && <span className="text-xs text-slate-400 font-mono">{c.bizNumber}</span>}
                    {c.representative && <span className="text-xs text-slate-400">대표: {c.representative}</span>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition">
                      <Pencil className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDelete(c.id, c.name)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition">
                        <Trash2 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {c.address && <p className="text-xs text-slate-400 mb-2 truncate">{c.address}</p>}
              {c.contacts.length > 0 && (
                <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                  {c.contacts.slice(0, 2).map(ct => (
                    <div key={ct.id} className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="w-3 h-3" strokeWidth={1.75} />
                      <span>{ct.name}{ct.position ? ` (${ct.position})` : ''}</span>
                      {ct.phone && <><Phone className="w-3 h-3 ml-1" strokeWidth={1.75} /><span>{ct.phone}</span></>}
                      {ct.email && <><Mail className="w-3 h-3 ml-1" strokeWidth={1.75} /><span className="truncate">{ct.email}</span></>}
                    </div>
                  ))}
                  {c.contacts.length > 2 && <p className="text-[11px] text-slate-400">+{c.contacts.length - 2}명</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form onSubmit={handleSave} className="relative bg-white/95 backdrop-blur-2xl rounded-[20px] shadow-2xl w-full max-w-md p-6 space-y-3">
            <h3 className="text-lg font-bold text-slate-800 mb-2">{editId ? '거래처 수정' : '새 거래처'}</h3>
            {[
              ['거래처명 *', 'name'], ['사업자번호', 'bizNumber'], ['대표자', 'representative'],
              ['주소', 'address'], ['전화번호', 'phone'], ['세금계산서 이메일', 'taxEmail'], ['메모', 'memo'],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                <input type="text" value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition">취소</button>
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-light transition disabled:opacity-50">
                {saving ? '저장 중...' : editId ? '수정' : '등록'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showLookup && <CompanyLookupModal onClose={() => setShowLookup(false)} onSelect={handleLookupSelect} />}
    </div>
  );
}
