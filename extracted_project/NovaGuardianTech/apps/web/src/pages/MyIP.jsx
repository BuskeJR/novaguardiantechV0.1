import { useState } from 'react';
import { Copy, RefreshCw, CheckCircle2, Globe, Shield, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useMyIP } from '@/hooks/useMyIP';
import useAuthStore from '@/hooks/useAuth';

export default function MyIP() {
  const { data, isLoading, error, refetch } = useMyIP();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const handleCopyIP = () => {
    if (data?.ip) {
      navigator.clipboard.writeText(data.ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Capturando seu IP...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="warning">
          Erro ao capturar IP. Verifique se você está autenticado e a API está rodando.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Endereço IP</h1>
        <p className="text-gray-600 mt-2">
          Descubra seu IP público atual e adicione rapidamente à whitelist
        </p>
      </div>

      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-600" />
              <CardTitle>Seu IP Público</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="hover:bg-blue-100"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>Este é o endereço IP que o servidor vê quando você acessa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg border-2 border-blue-300 p-6 text-center">
            <div className="text-5xl font-mono font-bold text-blue-600 mb-4">
              {data?.ip || 'Não disponível'}
            </div>
            <Button
              onClick={handleCopyIP}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar IP
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <CardTitle>Informações do Usuário</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900 font-mono">{user?.email || 'Não disponível'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Role</label>
              <p className="text-gray-900 font-mono">{user?.role || 'Não disponível'}</p>
            </div>
            {data?.client_id && (
              <div>
                <label className="text-sm font-medium text-gray-600">ID do Cliente</label>
                <p className="text-gray-900 font-mono">{data.client_id}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-600" />
              <CardTitle>Detecção de IP</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">X-Forwarded-For</label>
              <p className="text-gray-900 font-mono text-sm break-all">
                {data?.headers?.x_forwarded_for || 'Não disponível'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">X-Real-IP</label>
              <p className="text-gray-900 font-mono text-sm break-all">
                {data?.headers?.x_real_ip || 'Não disponível'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">CF-Connecting-IP</label>
              <p className="text-gray-900 font-mono text-sm break-all">
                {data?.headers?.cf_connecting_ip || 'Não disponível'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <div className="space-y-2">
          <p className="font-semibold">💡 Dicas de Uso:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Use este IP para adicionar à whitelist de clientes</li>
            <li>O IP pode mudar se você estiver usando VPN ou mudar de rede</li>
            <li>IPs atrás de proxy/load balancer são detectados automaticamente</li>
            <li>Para troubleshooting, verifique os headers de detecção abaixo</li>
          </ul>
        </div>
      </Alert>

      {data?.user_agent && (
        <Card>
          <CardHeader>
            <CardTitle>Navegador (User Agent)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 font-mono break-all">
              {data.user_agent}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
