import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import useAuthStore from '@/hooks/useAuth';
import api from '@/lib/api';
import { mockLogin } from '@/lib/mockAuth';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useMock, setUseMock] = useState(USE_MOCK);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let access_token, user;

      if (useMock) {
        // Modo Mock (sem API)
        const mockResponse = await mockLogin(email, password);
        access_token = mockResponse.access_token;
        user = mockResponse.user;
      } else {
        // Tentar API real
        try {
          const formData = new FormData();
          formData.append('username', email);
          formData.append('password', password);

          const response = await api.post('/auth/login', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });

          access_token = response.data.access_token;
          user = response.data.user;
        } catch (apiError) {
          // Se a API falhar (Network Error), usar mock automaticamente
          if (apiError.message === 'Network Error' || apiError.code === 'ERR_NETWORK') {
            console.log('API não disponível, usando modo mock...');
            setUseMock(true);
            const mockResponse = await mockLogin(email, password);
            access_token = mockResponse.access_token;
            user = mockResponse.user;
          } else {
            throw apiError;
          }
        }
      }

      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuth(user, access_token);
      
      navigate('/');
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.message || err.response?.data?.detail || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Shield className="h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">NovaGuardianTech</h1>
          </div>
          <p className="text-gray-600">Sistema de Bloqueio DNS Inteligente</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Faça login para acessar o painel administrativo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {useMock && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
                  ⚠️ Modo Mock Ativo - API não disponível. Os dados são apenas para demonstração.
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>

              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-800 font-medium mb-2">Credenciais de demonstração:</p>
                <p className="text-xs text-blue-700">Admin: admin@novaguardian.com / admin123</p>
                <p className="text-xs text-blue-700">Usuário: user@example.com / user123</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
