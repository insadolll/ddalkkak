import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import ProjectListPage from '@/features/project/ProjectListPage';
import ProjectDetailPage from '@/features/project/ProjectDetailPage';
import QuotationListPage from '@/features/quotation/QuotationListPage';
import QuotationDetailPage from '@/features/quotation/QuotationDetailPage';
import AccountingPage from '@/features/accounting/AccountingPage';
import CompanyListPage from '@/features/company/CompanyListPage';
import EmployeeListPage from '@/features/settings/EmployeeListPage';
import DepartmentPage from '@/features/settings/DepartmentPage';
import CalendarPage from '@/features/calendar/CalendarPage';
import LeavePage from '@/features/leave/LeavePage';
import ApprovalPage from '@/features/approval/ApprovalPage';
import MeetingPage from '@/features/meeting/MeetingPage';
import SuggestionPage from '@/features/suggestion/SuggestionPage';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-12 shadow-sm text-center">
      <h2 className="text-lg font-semibold text-slate-800 mb-2">{title}</h2>
      <p className="text-sm text-slate-400">This page is under construction.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route
              path="/projects/:id"
              element={<ProjectDetailPage />}
            />
            <Route path="/quotations" element={<QuotationListPage />} />
            <Route
              path="/quotations/:id"
              element={<QuotationDetailPage />}
            />
            <Route
              path="/accounting"
              element={<AccountingPage />}
            />
            <Route
              path="/companies"
              element={<CompanyListPage />}
            />
            <Route
              path="/calendar"
              element={<CalendarPage />}
            />
            <Route
              path="/leaves"
              element={<LeavePage />}
            />
            <Route
              path="/approvals"
              element={<ApprovalPage />}
            />
            <Route
              path="/meetings"
              element={<MeetingPage />}
            />
            <Route
              path="/suggestions"
              element={<SuggestionPage />}
            />
            <Route
              path="/database"
              element={<PlaceholderPage title="사내DB" />}
            />
            <Route
              path="/settings/employees"
              element={<EmployeeListPage />}
            />
            <Route
              path="/settings/departments"
              element={<DepartmentPage />}
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
