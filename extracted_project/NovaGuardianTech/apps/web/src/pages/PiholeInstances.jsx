import { useState } from 'react';
import { Server, Plus, RefreshCw, Trash2, Loader2, PlayCircle, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { 
  usePiholeInstances, 
  useProvisionPihole, 
  useDeprovisionPihole, 
  useRestartPihole,
  useUpdateDnsdist 
} from '@/hooks/usePihole';
import { useClients } from '@/hooks/useClients';

export default function PiholeInstances() {
  const [isProvisionDialogOpen, setIsProvisionDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ client_id: '', password: '' });
  
  const { data: instances = [], isLoading, error } = usePiholeInstances();
  const { data: clients = [] } = useClients();
  const provisionMutation = useProvisionPihole();
  const deprovisionMutation = useDeprovisionPihole();
  const restartMutation = useRestartPihole();
  const updateDnsdistMutation = useUpdateDnsdist();

  const handleProvision = async (e) => {
    e.preventDefault();
    
    try {
      await provisionMutation.mutateAsync(formData);
      setIsProvisionDialogOpen(false);
      setFormData({ client_id: '', password: '' });
    } catch (err) {
      console.error('Erro ao provisionar Pi-hole:', err);
    }
  };

  const handleDeprovision = async (clientId) => {
    if (window.confirm('Tem certeza que deseja remover esta instância Pi-hole? Esta ação não pode ser desfeita.')) {
      await deprovisionMutation.mutateAsync(clientId);
    }
  };

  const handleRestart = async (containerName) => {
    await restartMutation.mutateAsync(containerName);
  };

  const handleUpdateDnsdist = async () => {
    await updateDnsdistMutation.mutateAsync();
  };

  const getStatusBadge = (status) => {
    const variants = {
      running: 'success',
      stopped: 'danger',
      restarting: 'warning',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instâncias Pi-hole</h1>
          <p className="text-gray-600 mt-2">Gerencie containers Pi-hole por cliente</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleUpdateDnsdist}
            disabled={updateDnsdistMutation.isLoading}
          >
            {updateDnsdistMutation.isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Atualizar dnsdist
          </Button>
          <Button onClick={() => setIsProvisionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Provisionar Instância
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger">
          Erro ao carregar instâncias: {error.message}
        </Alert>
      )}

      {updateDnsdistMutation.isSuccess && (
        <Alert variant="success">
          Configuração dnsdist atualizada com sucesso!
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instâncias Ativas</CardTitle>
          <CardDescription>Total: {instances.length} instâncias provisionadas</CardDescription>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma instância provisionada ainda.</p>
              <Button
                onClick={() => setIsProvisionDialogOpen(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Provisionar Primeira Instância
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Container</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>IP Interno</TableHead>
                  <TableHead>IP Público</TableHead>
                  <TableHead>Porta Web</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.container_name}>
                    <TableCell className="font-mono text-xs">
                      {instance.container_name}
                    </TableCell>
                    <TableCell className="font-medium">
                      Cliente #{instance.client_id}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {instance.internal_ip}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {instance.public_ip}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {instance.web_port}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(instance.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestart(instance.container_name)}
                          disabled={restartMutation.isLoading}
                          title="Reiniciar"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeprovision(instance.client_id)}
                          disabled={deprovisionMutation.isLoading}
                          title="Remover"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isProvisionDialogOpen} onClose={() => setIsProvisionDialogOpen(false)}>
        <form onSubmit={handleProvision}>
          <DialogHeader>
            <DialogTitle onClose={() => setIsProvisionDialogOpen(false)}>
              Provisionar Nova Instância Pi-hole
            </DialogTitle>
          </DialogHeader>

          <DialogContent>
            <div className="space-y-4">
              <Alert variant="info">
                Será criado um container Docker Pi-hole dedicado para o cliente selecionado.
              </Alert>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <Select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.public_ip})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Admin Pi-hole
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Senha para interface web"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use uma senha forte para acesso à interface web do Pi-hole
                </p>
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProvisionDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={provisionMutation.isLoading}
            >
              {provisionMutation.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Provisionando...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Provisionar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
