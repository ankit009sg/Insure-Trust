import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ApplicantDashboard } from './pages/ApplicantDashboard';
import { ApplicantApplication } from './pages/ApplicantApplication';
import { PolicyManagerDashboard } from './pages/PolicyManagerDashboard';
import { SeniorManagerDashboard } from './pages/SeniorManagerDashboard';
import { ApplicationDetail } from './pages/ApplicationDetail';

// Common Components
import { Navbar } from './components/common/Navbar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component to enforce login
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Guard component to enforce specific roles
const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && !allowedRoles.includes(role)) {
    // Redirect to default dashboard for user role
    if (role === 'applicant') return <Navigate to="/dashboard" replace />;
    if (role === 'policy_manager') return <Navigate to="/policy-dashboard" replace />;
    if (role === 'senior_manager') return <Navigate to="/senior-dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Dispatcher Component for `/applications/:id` based on Role
const ApplicationDetailDispatcher: React.FC = () => {
  const { role } = useAuthStore();
  
  if (role === 'applicant') {
    return <ApplicantApplication />;
  } else if (role === 'policy_manager' || role === 'senior_manager') {
    return <ApplicationDetail />;
  }
  
  return <Navigate to="/login" replace />;
};

// Home Redirect Dispatcher
const HomeRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'applicant') return <Navigate to="/dashboard" replace />;
  if (role === 'policy_manager') return <Navigate to="/policy-dashboard" replace />;
  if (role === 'senior_manager') return <Navigate to="/senior-dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected General routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomeRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Applicant Gated Routes */}
              <Route
                path="/dashboard"
                element={
                  <RoleRoute allowedRoles={['applicant']}>
                    <ApplicantDashboard />
                  </RoleRoute>
                }
              />

              {/* Policy Manager Gated Routes */}
              <Route
                path="/policy-dashboard"
                element={
                  <RoleRoute allowedRoles={['policy_manager']}>
                    <PolicyManagerDashboard />
                  </RoleRoute>
                }
              />

              {/* Senior Manager Gated Routes */}
              <Route
                path="/senior-dashboard"
                element={
                  <RoleRoute allowedRoles={['senior_manager']}>
                    <SeniorManagerDashboard />
                  </RoleRoute>
                }
              />

              {/* Dynamic Dispatcher Route based on Logged-in Role */}
              <Route
                path="/applications/:id"
                element={
                  <ProtectedRoute>
                    <ApplicationDetailDispatcher />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Catch-All Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
