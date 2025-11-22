import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/useAuth';
import useAuthStore from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import Domains from '@/pages/Domains';
import Whitelist from '@/pages/Whitelist';
import PiholeInstances from '@/pages/PiholeInstances';
import Users from '@/pages/Users';
import Audit from '@/pages/Audit';
import Settings from '@/pages/Settings';
import MyIP from '@/pages/MyIP';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const token = localStorage.getItem('auth_token');
  
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="domains" element={<Domains />} />
              <Route path="whitelist" element={<Whitelist />} />
              <Route path="my-ip" element={<MyIP />} />
              <Route path="pihole" element={<PiholeInstances />} />
              <Route path="users" element={<Users />} />
              <Route path="audit" element={<Audit />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
