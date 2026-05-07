import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import OnboardingLayout from './components/layout/OnboardingLayout';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminEmployeeDetail from './pages/admin/AdminEmployeeDetail';
import AdminApprovals from './pages/admin/AdminApprovals';

// Employee onboarding pages
import OnboardingHome from './pages/employee/OnboardingHome';
import ProfilePage from './pages/ProfilePage';
import EducationPage from './pages/EducationPage';
import ExperiencePage from './pages/ExperiencePage';
import DocumentsPage from './pages/DocumentsPage';
import BankDetailsPage from './pages/BankDetailsPage';

// ── ROUTE GUARDS ──────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin w-10 h-10 border-4 rounded-full"
        style={{ borderColor: '#E6F1FB', borderTopColor: '#1A4FA0' }}/>
      <div className="text-sm text-gray-400 font-medium">Loading...</div>
    </div>
  </div>
);

/** Redirect to login if not authenticated */
const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

/** Redirect to employee portal if not admin */
const AdminGuard = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/onboarding" replace />;
  return children;
};

/** Redirect to admin if user is admin */
const EmployeeGuard = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

// ── ROOT REDIRECT ─────────────────────────────────────────────────────────────

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/onboarding'} replace />;
};

// ── APP ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'DM Sans, sans-serif', fontSize: '13px', borderRadius: '12px' },
            success: { iconTheme: { primary: '#1A4FA0', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Root → smart redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* ── ADMIN DASHBOARD ── */}
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="employees/:id" element={<AdminEmployeeDetail />} />
            <Route path="approvals" element={<AdminApprovals />} />
          </Route>

          {/* ── EMPLOYEE ONBOARDING ── */}
          <Route path="/onboarding" element={<EmployeeGuard><OnboardingLayout /></EmployeeGuard>}>
            <Route index element={<OnboardingHome />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="education" element={<EducationPage />} />
            <Route path="experience" element={<ExperiencePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="bank" element={<BankDetailsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
