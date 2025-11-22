import { useState } from 'react';
import { Plus, Trash2, ListFilter, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useWhitelist, useAddWhitelist, useDeleteWhitelist } from '@/hooks/useWhitelist';
import { useClients } from '@/hooks/useClients';

export default function Whitelist() {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const { data: clients = [] } = useClients();
  const { data: whitelist = [], isLoading, error } = useWhitelist(selectedClientId);
  const addMutation = useAddWhitelist();
  const deleteMutation = useDeleteWhitelist();

  const handleAddIp = async (e) => {
    e.preventDefault();
    if (!newIp.trim() || !selectedClientId) return;

    try {
      await addMutation.mutateAsync({
        client_id: parseInt(selectedClientId),
        ip_address: newIp.trim(),
        label: newLabel.trim() || 'Sem descrição',
      });
      setNewIp('');
      setNewLabel('');
    } catch (err) {
      console.error('Erro ao adicionar IP:', err);
    }
  };

  const handleDeleteIp = async (whitelistId) => {
    if (window.confirm('Tem certeza que deseja remover este IP da whitelist?')) {
      await deleteMutation.mutateAsync(whitelistId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Whitelist de IPs</h1>
        <p className="text-gray-600 mt-2">
          Gerencie os endereços IP autorizados por cliente
        </p>
      </div>

      {error && (
        <Alert variant="warning">
          Erro ao carregar whitelist. Verifique se a API está rodando.
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Cliente</CardTitle>
          <CardDescription>Escolha o cliente para gerenciar IPs autorizados</CardDescription>
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
              <CardTitle>Adicionar Novo IP</CardTitle>
              <CardDescription>Autorize IPs específicos para este cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddIp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço IP
                    </label>
                    <Input
                      type="text"
                      placeholder="192.168.1.100"
                      value={newIp}
                      onChange={(e) => setNewIp(e.target.value)}
                      disabled={addMutation.isLoading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição (opcional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Escritório Central, Filial SP, etc."
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      disabled={addMutation.isLoading}
                    />
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
                      Adicionar IP
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IPs Autorizados</CardTitle>
              <CardDescription>{whitelist.length} endereço(s) na whitelist</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : whitelist.length === 0 ? (
                <div className="text-center py-12">
                  <ListFilter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum IP autorizado para este cliente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Endereço IP</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whitelist.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">#{entry.id}</TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {entry.ip_address}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{entry.label}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteIp(entry.id)}
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
