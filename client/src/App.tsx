import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';

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
            <Route
              path="/projects"
              element={<PlaceholderPage title="프로젝트 관리" />}
            />
            <Route
              path="/quotations"
              element={<PlaceholderPage title="견적서" />}
            />
            <Route
              path="/accounting"
              element={<PlaceholderPage title="매입매출" />}
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
