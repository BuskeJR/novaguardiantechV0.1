import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home, Globe, ListFilter, Settings, LogOut, Menu, Users as UsersIcon, Server, FileText, Building2, Network } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Clientes', href: '/clients', icon: Building2 },
    { name: 'Domínios Bloqueados', href: '/domains', icon: Globe },
    { name: 'Whitelist de IPs', href: '/whitelist', icon: ListFilter },
    { name: 'Meu IP', href: '/my-ip', icon: Network },
    { name: 'Instâncias Pi-hole', href: '/pihole', icon: Server, adminOnly: true },
    { name: 'Usuários', href: '/users', icon: UsersIcon, adminOnly: true },
    { name: 'Logs de Auditoria', href: '/audit', icon: FileText },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-6 border-b border-gray-200">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">NovaGuardianTech</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              if (item.adminOnly && user?.role !== 'ADMIN') {
                return null;
              }
              
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-200 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Conectado como: <span className="font-medium text-gray-900">{user?.role || 'USER'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
