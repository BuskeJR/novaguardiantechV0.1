import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Shield, Globe, ListFilter, Activity, Building2, Loader2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import useAuthStore from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: stats, isLoading, error } = useStats();

  const statsCards = [
    {
      name: 'Clientes',
      value: stats?.clients_count || 0,
      description: 'Cadastrados',
      icon: Building2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      name: 'Domínios Bloqueados',
      value: stats?.domains_count || 0,
      description: 'Regras ativas',
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'IPs na Whitelist',
      value: stats?.whitelist_count || 0,
      description: 'IPs autorizados',
      icon: ListFilter,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Instâncias Pi-hole',
      value: stats?.pihole_instances_count || 0,
      description: 'Containers ativos',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo, {user?.name || 'Usuário'}! Visão geral do sistema de bloqueio DNS.
        </p>
      </div>

      {error && (
        <Alert variant="warning">
          Modo demonstração ativo. Conecte a API para ver dados reais.
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Início Rápido</CardTitle>
            <CardDescription>Primeiros passos para configurar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="font-medium text-gray-900">Configure a API FastAPI</p>
                  <p className="text-gray-600">Inicie a API backend para gerenciar as regras DNS</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="font-medium text-gray-900">Adicione domínios para bloqueio</p>
                  <p className="text-gray-600">Use a página "Domínios Bloqueados" para criar regras</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="font-medium text-gray-900">Configure o Pi-hole via Docker</p>
                  <p className="text-gray-600">Inicie o container do Pi-hole para aplicar os bloqueios</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <p className="font-medium text-gray-900">Teste com dig/nslookup</p>
                  <p className="text-gray-600">Valide que os domínios bloqueados retornam NXDOMAIN</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
            <CardDescription>Detalhes técnicos da instalação</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-900">Usuário Logado</dt>
                <dd className="text-gray-600">{user?.email || 'N/A'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Nível de Acesso</dt>
                <dd className="text-gray-600">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user?.role || 'USER'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Modo de Bloqueio</dt>
                <dd className="text-gray-600">NXDOMAIN (padrão)</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Porta dnsdist</dt>
                <dd className="text-gray-600">5353 (desenvolvimento)</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Status da API</dt>
                <dd className="text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${error ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                    {error ? 'Modo demonstração' : 'Conectado'}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
