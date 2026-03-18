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
              path="/calendar"
              element={<PlaceholderPage title="일정공유" />}
            />
            <Route
              path="/approvals"
              element={<PlaceholderPage title="전자결재" />}
            />
            <Route
              path="/meetings"
              element={<PlaceholderPage title="업무회의" />}
            />
            <Route
              path="/suggestions"
              element={<PlaceholderPage title="건의게시판" />}
            />
            <Route
              path="/database"
              element={<PlaceholderPage title="사내DB" />}
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
