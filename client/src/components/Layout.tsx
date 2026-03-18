import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import {
  FolderKanban,
  FileText,
  ArrowLeftRight,
  Calendar,
  FileCheck,
  Users,
  MessageSquare,
  Database,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Check,
  Settings,
} from 'lucide-react';

interface OurCompany {
  id: number;
  code: string;
  name: string;
}

const menuItems = [
  { to: '/projects', label: '프로젝트 관리', icon: FolderKanban },
  { to: '/quotations', label: '견적서', icon: FileText },
  { to: '/accounting', label: '매입매출', icon: ArrowLeftRight },
  { to: '/calendar', label: '일정공유', icon: Calendar },
  { to: '/approvals', label: '전자결재', icon: FileCheck },
  { to: '/meetings', label: '업무회의', icon: Users },
  { to: '/suggestions', label: '건의게시판', icon: MessageSquare },
  { to: '/database', label: '사내DB', icon: Database },
] as const;

const pageTitles: Record<string, string> = {
  '/': '대시보드',
  '/projects': '프로젝트 관리',
  '/quotations': '견적서',
  '/accounting': '매입매출',
  '/calendar': '일정공유',
  '/approvals': '전자결재',
  '/meetings': '업무회의',
  '/suggestions': '건의게시판',
  '/database': '사내DB',
  '/settings/employees': '직원 관리',
};

export default function Layout() {
  const { user, logout, switchCompany } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [companies, setCompanies] = useState<OurCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<OurCompany | null>(null);
  const [companySwitcherOpen, setCompanySwitcherOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  // Load companies
  useEffect(() => {
    api
      .get<{ success: boolean; data: OurCompany[] }>('/our-companies')
      .then((res) => {
        const list = res.data.data;
        setCompanies(list);

        // Restore previously selected company or default to user's company
        const savedId = localStorage.getItem('selectedCompanyId');
        const initial =
          list.find((c) => c.id === Number(savedId)) ||
          list.find((c) => c.id === user?.ourCompanyId) ||
          list[0];

        if (initial) {
          setSelectedCompany(initial);
          switchCompany(initial.id);
        }
      })
      .catch(() => {
        // Fallback to user's company info
        if (user) {
          const fallback: OurCompany = {
            id: user.ourCompanyId,
            code: user.ourCompanyCode,
            name: user.ourCompanyName,
          };
          setSelectedCompany(fallback);
          setCompanies([fallback]);
          switchCompany(fallback.id);
        }
      });
  }, [user, switchCompany]);

  const handleCompanySwitch = (company: OurCompany) => {
    setSelectedCompany(company);
    switchCompany(company.id);
    setCompanySwitcherOpen(false);
  };

  const pageTitle = pageTitles[location.pathname] || '딸깍 v2';
  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[260px]';

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarWidth} fixed top-0 left-0 h-screen bg-white/60 backdrop-blur-2xl border-r border-white/30 flex flex-col transition-all duration-300 z-30`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 w-6 h-6 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
        >
          <ChevronLeft
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            strokeWidth={1.75}
          />
        </button>

        {/* Company switcher */}
        <div className="p-4 border-b border-white/30">
          {collapsed ? (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <span className="text-sm font-bold text-primary">
                {selectedCompany?.code?.charAt(0) || 'D'}
              </span>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => isAdmin && setCompanySwitcherOpen(!companySwitcherOpen)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                  isAdmin
                    ? 'hover:bg-primary/5 cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {selectedCompany?.code?.charAt(0) || 'D'}
                  </span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {selectedCompany?.name || 'Loading...'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedCompany?.code || ''}
                  </p>
                </div>
                {isAdmin && (
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${companySwitcherOpen ? 'rotate-180' : ''}`}
                    strokeWidth={1.75}
                  />
                )}
              </button>

              {/* Dropdown */}
              {companySwitcherOpen && isAdmin && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white/90 backdrop-blur-xl rounded-xl border border-white/40 shadow-lg overflow-hidden z-50">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => handleCompanySwitch(company)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {company.code.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-slate-700 flex-1 text-left truncate">
                        {company.name}
                      </span>
                      {selectedCompany?.id === company.id && (
                        <Check className="w-4 h-4 text-primary" strokeWidth={1.75} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {/* Dashboard link */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FolderKanban
                  className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500'}`}
                  strokeWidth={1.75}
                />
                {!collapsed && <span className="text-sm">대시보드</span>}
              </>
            )}
          </NavLink>

          <div className="h-px bg-slate-200/50 my-2 mx-2" />

          {menuItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500'}`}
                    strokeWidth={1.75}
                  />
                  {!collapsed && <span className="text-sm">{label}</span>}
                </>
              )}
            </NavLink>
          ))}

          {/* Settings (ADMIN only) */}
          {isAdmin && (
            <>
              <div className="h-px bg-slate-200/50 my-2 mx-2" />
              <NavLink
                to="/settings/employees"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Settings
                      className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500'}`}
                      strokeWidth={1.75}
                    />
                    {!collapsed && <span className="text-sm">설정</span>}
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>

        {/* User info + Logout */}
        <div className="p-3 border-t border-white/30">
          {collapsed ? (
            <button
              onClick={logout}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors mx-auto"
              title="Logout"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.75} />
            </button>
          ) : (
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.position || user?.role || ''}
                </p>
              </div>
              <button
                onClick={logout}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-[260px]'}`}
      >
        {/* Header */}
        <header className="h-16 bg-white/60 backdrop-blur-xl border-b border-white/30 sticky top-0 z-20 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100/60 hover:text-slate-600 transition-colors relative">
              <Bell className="w-5 h-5" strokeWidth={1.75} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>

            {/* User avatar + name */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700">
                {user?.name || 'User'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
