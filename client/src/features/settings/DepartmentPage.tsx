import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import api from '@/services/api';

interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

// TODO: POST /api/employees/departments — create department
// TODO: PUT /api/employees/departments/:id — update department
// TODO: DELETE /api/employees/departments/:id — delete department
// Backend CRUD for departments does not exist yet. Only GET (list) is available.

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/employees/departments')
      .then((res) => setDepartments(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" strokeWidth={1.75} />
          <h2 className="text-xl font-bold text-slate-800">부서 관리</h2>
        </div>
        {/* TODO: Enable when POST endpoint is ready */}
        <button
          disabled
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/40 text-white rounded-xl font-medium shadow-sm cursor-not-allowed"
          title="백엔드 API 준비 중"
        >
          새 부서 (준비 중)
        </button>
      </div>

      {/* Department cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 bg-white/80 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-400">등록된 부서가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2
                    className="w-5 h-5 text-primary"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-800 truncate">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {new Date(dept.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">
                {dept.description || '설명 없음'}
              </p>
              {/* TODO: employee count - needs backend support */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  소속 인원: -- 명
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
