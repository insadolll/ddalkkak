import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, UserCog, Building2 } from 'lucide-react';
import api from '@/services/api';
import EmployeeFormModal from './EmployeeFormModal';

interface Employee {
  id: string;
  employeeNo: string;
  email: string;
  name: string;
  role: string;
  position: string | null;
  phone: string | null;
  isActive: boolean;
  ourCompany: { id: string; code: string; name: string };
  department: { id: string; name: string };
}

const roleLabels: Record<string, string> = {
  ADMIN: '관리자',
  MANAGER: '매니저',
  ACCOUNTANT: '경영지원',
  EMPLOYEE: '직원',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  MANAGER: 'bg-teal-100 text-teal-700',
  ACCOUNTANT: 'bg-violet-100 text-violet-700',
  EMPLOYEE: 'bg-slate-100 text-slate-600',
};

const roleFilters = ['', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE'];

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/employees', { params });
      setEmployees(res.data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [search, roleFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleSaved = () => {
    setShowModal(false);
    setEditTarget(null);
    fetchEmployees();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="w-6 h-6 text-primary" strokeWidth={1.75} />
          <h2 className="text-xl font-bold text-slate-800">직원 관리</h2>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-light shadow-sm transition"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          새 직원
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름, 이메일, 사번 검색..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        </div>
        <div className="flex gap-1.5">
          {roleFilters.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                roleFilter === r
                  ? 'bg-primary text-white'
                  : 'bg-white/80 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {r ? roleLabels[r] : '전체'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-white/80 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-400">직원이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map(emp => (
            <div
              key={emp.id}
              onClick={() => { setEditTarget(emp); setShowModal(true); }}
              className={`bg-white/80 backdrop-blur-xl border rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 ${
                emp.isActive ? 'border-white/30' : 'border-red-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{emp.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{emp.name}</h3>
                    <p className="text-xs text-slate-400">{emp.employeeNo}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${roleColors[emp.role]}`}>
                  {roleLabels[emp.role]}
                </span>
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="text-slate-500">{emp.email}</p>
                {emp.position && <p className="text-slate-400">{emp.position}</p>}
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-500">
                    <Building2 className="w-3 h-3" strokeWidth={1.75} />
                    {emp.ourCompany.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-500">
                    {emp.department.name}
                  </span>
                  {!emp.isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-[11px] text-red-600">비활성</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EmployeeFormModal
          employee={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
