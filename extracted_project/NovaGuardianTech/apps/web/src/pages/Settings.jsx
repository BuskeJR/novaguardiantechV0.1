import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Settings as SettingsIcon, Server, Database, Network } from 'lucide-react';

export default function Settings() {
  const configItems = [
    {
      icon: Server,
      title: 'Servidor API',
      value: import.meta.env.VITE_API_URL || 'http://localhost:8080',
      description: 'Endpoint da API FastAPI',
    },
    {
      icon: Database,
      title: 'Banco de Dados',
      value: 'PostgreSQL 16',
      description: 'Gerenciado pelo Replit',
    },
    {
      icon: Network,
      title: 'Porta dnsdist',
      value: '5353',
      description: 'Porta UDP/TCP para consultas DNS',
    },
    {
      icon: SettingsIcon,
      title: 'Modo de Bloqueio',
      value: 'NXDOMAIN',
      description: 'Padrão de resposta para domínios bloqueados',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">
          Informações sobre a configuração do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                      {item.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variáveis de Ambiente</CardTitle>
          <CardDescription>Configuração do frontend React</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-700">VITE_API_URL</dt>
              <dd className="text-sm text-gray-600 mt-1 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                {import.meta.env.VITE_API_URL || 'http://localhost:8080'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">VITE_BRAND_NAME</dt>
              <dd className="text-sm text-gray-600 mt-1 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                {import.meta.env.VITE_BRAND_NAME || 'NovaGuardianTech'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">VITE_USE_MOCK</dt>
              <dd className="text-sm text-gray-600 mt-1 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                {import.meta.env.VITE_USE_MOCK || 'false'}
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comandos Úteis</CardTitle>
          <CardDescription>Comandos para testes e operação do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Testar bloqueio DNS (Linux/macOS):</p>
              <code className="block bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                dig @127.0.0.1 -p 5353 instagram.com
              </code>
              <p className="text-xs text-gray-500 mt-1">Deve retornar NXDOMAIN para domínios bloqueados</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Testar DNS permitido:</p>
              <code className="block bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                dig @127.0.0.1 -p 5353 google.com
              </code>
              <p className="text-xs text-gray-500 mt-1">Deve resolver normalmente</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Verificar status do Docker Compose:</p>
              <code className="block bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                docker compose ps
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
