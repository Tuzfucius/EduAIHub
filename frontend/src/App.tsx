import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import MainLayout from '@/components/MainLayout';
import AuthPage from '@/pages/Auth';
import DashboardPage from '@/pages/Dashboard';
import AISolverPage from '@/pages/AISolver';
import MaterialsPage from '@/pages/Materials';
import FocusPage from '@/pages/Focus';
import SettingsPage from '@/pages/Settings';

// Route Guard component
function RequireAuth({ children }: { children: JSX.Element }) {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// Page Transition Wrapper
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

// Main App Router
function AppRoutes() {
  const location = useLocation();
  const { token } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <PageWrapper><AuthPage /></PageWrapper>} />

        <Route path="/focus" element={
          <RequireAuth>
            <PageWrapper><FocusPage /></PageWrapper>
          </RequireAuth>
        } />

        <Route
          path="/"
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route path="dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
          <Route path="solver" element={<PageWrapper><AISolverPage /></PageWrapper>} />
          <Route path="materials" element={<PageWrapper><MaterialsPage /></PageWrapper>} />
          <Route path="settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 selection:bg-purple-500/30">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
