import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';

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

interface Props {
  employee: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EmployeeFormModal({ employee, onClose, onSaved }: Props) {
  const isEdit = !!employee;
  const [form, setForm] = useState({
    employeeNo: '', email: '', password: '', name: '',
    role: 'EMPLOYEE', position: '', phone: '',
    ourCompanyId: '', departmentId: '', joinDate: '',
    isActive: true,
  });
  const [companies, setCompanies] = useState<{ id: string; code: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/our-companies').then(r => setCompanies(r.data.data)).catch(() => {});
    api.get('/employees/departments').then(r => setDepartments(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (employee) {
      setForm({
        employeeNo: employee.employeeNo,
        email: employee.email,
        password: '',
        name: employee.name,
        role: employee.role,
        position: employee.position || '',
        phone: employee.phone || '',
        ourCompanyId: employee.ourCompany.id,
        departmentId: employee.department.id,
        joinDate: '',
        isActive: employee.isActive,
      });
    }
  }, [employee]);

  const set = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!form.name || !form.email || !form.ourCompanyId || !form.departmentId) {
      setErr('필수 항목을 모두 입력해주세요.');
      return;
    }
    if (!isEdit && !form.password) {
      setErr('비밀번호를 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const data: Record<string, unknown> = {
          name: form.name, role: form.role, position: form.position || null,
          phone: form.phone || null, ourCompanyId: form.ourCompanyId,
          departmentId: form.departmentId, isActive: form.isActive,
        };
        if (form.password) data.password = form.password;
        await api.put(`/employees/${employee.id}`, data);
      } else {
        await api.post('/employees', {
          employeeNo: form.employeeNo, email: form.email, password: form.password,
          name: form.name, role: form.role, position: form.position || null,
          phone: form.phone || null, ourCompanyId: form.ourCompanyId,
          departmentId: form.departmentId, joinDate: form.joinDate || undefined,
        });
      }
      onSaved();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || '저장에 실패했습니다.';
      setErr(msg);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white/95 backdrop-blur-2xl rounded-[20px] shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{isEdit ? '직원 수정' : '새 직원'}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-400" strokeWidth={1.75} />
          </button>
        </div>

        {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Field label="사번 *" value={form.employeeNo} onChange={v => set('employeeNo', v)} disabled={isEdit} />
          <Field label="이메일 *" value={form.email} onChange={v => set('email', v)} disabled={isEdit} type="email" />
          <Field label="이름 *" value={form.name} onChange={v => set('name', v)} />
          <Field label={isEdit ? '비밀번호 변경' : '비밀번호 *'} value={form.password} onChange={v => set('password', v)} type="password" placeholder={isEdit ? '변경 시에만 입력' : ''} />
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">역할 *</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="EMPLOYEE">직원</option>
              <option value="MANAGER">매니저</option>
              <option value="ACCOUNTANT">경영지원</option>
              <option value="ADMIN">관리자</option>
            </select>
          </div>
          <Field label="직위" value={form.position} onChange={v => set('position', v)} />
          <Field label="전화번호" value={form.phone} onChange={v => set('phone', v)} />
          {!isEdit && <Field label="입사일" value={form.joinDate} onChange={v => set('joinDate', v)} type="date" />}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">소속 회사 *</label>
            <select value={form.ourCompanyId} onChange={e => set('ourCompanyId', e.target.value)} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="">선택</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">부서 *</label>
            <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none">
              <option value="">선택</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded" />
            활성 계정
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition">취소</button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-light transition disabled:opacity-50">
            {saving ? '저장 중...' : isEdit ? '수정' : '생성'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', disabled = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100 disabled:text-gray-400 transition"
      />
    </div>
  );
}
