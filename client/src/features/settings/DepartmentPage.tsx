import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '@/services/api';

interface Department {
  id: string;
  name: string;
  description: string | null;
  _count?: { employees: number };
}

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const fetchDepts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  function openCreate() {
    setEditTarget(null);
    setForm({ name: '', description: '' });
    setErr('');
    setShowModal(true);
  }

  function openEdit(dept: Department) {
    setEditTarget(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setErr('');
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('부서명을 입력해주세요.'); return; }
    setSaving(true);
    setErr('');
    try {
      if (editTarget) {
        await api.put(`/departments/${editTarget.id}`, form);
      } else {
        await api.post('/departments', form);
      }
      setShowModal(false);
      fetchDepts();
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || '저장에 실패했습니다.');
    }
    setSaving(false);
  }

  async function handleDelete(dept: Department) {
    if (!window.confirm(`"${dept.name}" 부서를 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/departments/${dept.id}`);
      fetchDepts();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || '삭제에 실패했습니다.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" strokeWidth={1.75} />
          <h2 className="text-xl font-bold text-slate-800">부서 관리</h2>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-light shadow-sm transition">
          <Plus className="w-4 h-4" strokeWidth={2} />새 부서
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="h-36 bg-white/80 rounded-2xl animate-pulse" />)}
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-400">등록된 부서가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map(dept => (
            <div key={dept.id} className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{dept.name}</h3>
                    <p className="text-xs text-slate-400">{dept._count?.employees ?? 0}명</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(dept)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition">
                    <Pencil className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                  </button>
                  <button onClick={() => handleDelete(dept)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition">
                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-500">{dept.description || '설명 없음'}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <form onSubmit={handleSave} className="relative bg-white/95 backdrop-blur-2xl rounded-[20px] shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{editTarget ? '부서 수정' : '새 부서'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" strokeWidth={1.75} />
              </button>
            </div>
            {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">부서명 *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">설명</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition">취소</button>
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-light transition disabled:opacity-50">
                {saving ? '저장 중...' : editTarget ? '수정' : '생성'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
