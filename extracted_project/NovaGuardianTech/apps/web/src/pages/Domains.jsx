import { useState } from 'react';
import { Plus, Trash2, Globe, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useDomains, useAddDomain, useDeleteDomain, useSyncDomains } from '@/hooks/useDomains';
import { useClients } from '@/hooks/useClients';

export default function Domains() {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [domainKind, setDomainKind] = useState('EXACT');

  const { data: clients = [] } = useClients();
  const { data: domains = [], isLoading, error } = useDomains(selectedClientId);
  const addMutation = useAddDomain();
  const deleteMutation = useDeleteDomain();
  const syncMutation = useSyncDomains();

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomain.trim() || !selectedClientId) return;

    try {
      await addMutation.mutateAsync({
        client_id: parseInt(selectedClientId),
        domain: newDomain.trim(),
        kind: domainKind,
      });
      setNewDomain('');
    } catch (err) {
      console.error('Erro ao adicionar domínio:', err);
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (window.confirm('Tem certeza que deseja remover este domínio?')) {
      await deleteMutation.mutateAsync(domainId);
    }
  };

  const handleSync = async () => {
    if (!selectedClientId) return;
    await syncMutation.mutateAsync(parseInt(selectedClientId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Domínios Bloqueados</h1>
        <p className="text-gray-600 mt-2">
          Gerencie as regras de bloqueio de domínios por cliente
        </p>
      </div>

      {error && (
        <Alert variant="warning">
          Erro ao carregar domínios. Verifique se a API está rodando.
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Cliente</CardTitle>
          <CardDescription>Escolha o cliente para gerenciar domínios bloqueados</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="">Selecione um cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.public_ip})
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {selectedClientId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Domínio</CardTitle>
              <CardDescription>Configure domínios para bloqueio (EXACT ou REGEX)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDomain} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domínio
                    </label>
                    <Input
                      type="text"
                      placeholder="exemplo.com ou *.ads.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      disabled={addMutation.isLoading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Regra
                    </label>
                    <Select
                      value={domainKind}
                      onChange={(e) => setDomainKind(e.target.value)}
                      disabled={addMutation.isLoading}
                    >
                      <option value="EXACT">Exato</option>
                      <option value="REGEX">Regex</option>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={addMutation.isLoading}>
                  {addMutation.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Domínio
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Domínios Cadastrados</CardTitle>
                  <CardDescription>{domains.length} domínio(s) bloqueado(s)</CardDescription>
                </div>
                <Button
                  onClick={handleSync}
                  disabled={domains.length === 0 || syncMutation.isLoading}
                >
                  {syncMutation.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar com Pi-hole
                    </>
                  )}
                </Button>
              </div>

              {syncMutation.isSuccess && (
                <Alert variant="success" className="mt-4">
                  ✓ Sincronização com Pi-hole concluída!
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : domains.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum domínio bloqueado para este cliente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Domínio</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-mono text-xs">#{domain.id}</TableCell>
                        <TableCell className="font-medium">{domain.domain}</TableCell>
                        <TableCell>
                          <Badge variant={domain.kind === 'EXACT' ? 'primary' : 'warning'}>
                            {domain.kind}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">Ativo</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDomain(domain.id)}
                            disabled={deleteMutation.isLoading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
