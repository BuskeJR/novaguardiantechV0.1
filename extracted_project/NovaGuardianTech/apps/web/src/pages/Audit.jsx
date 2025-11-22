import { useState } from 'react';
import { Search, Filter, Loader2, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useAuditLogs } from '@/hooks/useAudit';

export default function Audit() {
  const [filters, setFilters] = useState({
    action: '',
    limit: 50,
    offset: 0,
  });

  const { data: logs = [], isLoading, error } = useAuditLogs(filters);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getActionBadge = (action) => {
    const variants = {
      create: 'success',
      update: 'warning',
      delete: 'danger',
      sync: 'primary',
      provision: 'purple',
    };
    
    const actionLower = action.toLowerCase();
    const variant = Object.keys(variants).find(key => actionLower.includes(key)) || 'default';
    
    return <Badge variant={variants[variant]}>{action}</Badge>;
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, offset: 0 });
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoria</h1>
        <p className="text-gray-600 mt-2">Histórico completo de ações realizadas no sistema</p>
      </div>

      {error && (
        <Alert variant="danger">
          Erro ao carregar logs: {error.message}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine a busca de logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Ação
              </label>
              <Select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">Todas as ações</option>
                <option value="create">Criação</option>
                <option value="update">Atualização</option>
                <option value="delete">Exclusão</option>
                <option value="sync">Sincronização</option>
                <option value="provision">Provisionamento</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registros por Página
              </label>
              <Select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoria</CardTitle>
          <CardDescription>Total: {logs.length} registros</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum log encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">#{log.id}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user?.name || 'Sistema'}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.resource_type}
                      {log.resource_id && ` #${log.resource_id}`}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.client_id ? `Cliente #${log.client_id}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-xs truncate">
                      {log.details || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Exibindo {logs.length} de {logs.length} registros
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={filters.offset === 0}
            onClick={() => handleFilterChange('offset', Math.max(0, filters.offset - filters.limit))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={logs.length < filters.limit}
            onClick={() => handleFilterChange('offset', filters.offset + filters.limit)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
