import { useState } from 'react';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import Alert from '@/components/ui/Alert';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ name: '', public_ip: '', pihole_password: '' });
  
  const { data: clients = [], isLoading, error } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        await updateMutation.mutateAsync({ id: editingClient.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsDialogOpen(false);
      setEditingClient(null);
      setFormData({ name: '', public_ip: '', pihole_password: '' });
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      public_ip: client.public_ip,
      pihole_password: client.pihole_password || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteMutation.mutateAsync(clientId);
    }
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setFormData({ name: '', public_ip: '', pihole_password: '' });
    setIsDialogOpen(true);
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
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-2">Gerencie os clientes e suas configurações DNS</p>
        </div>
        <Button onClick={handleNewClient}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {error && (
        <Alert variant="danger">
          Erro ao carregar clientes: {error.message}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>Total: {clients.length} clientes cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum cliente cadastrado ainda.</p>
              <Button onClick={handleNewClient} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Cliente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>IP Público</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-xs">#{client.id}</TableCell>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="font-mono text-xs">{client.public_ip}</TableCell>
                    <TableCell>
                      <Badge variant="success">Ativo</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(client.id)}
                          disabled={deleteMutation.isLoading}
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

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle onClose={() => setIsDialogOpen(false)}>
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>

          <DialogContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Empresa XYZ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP Público
                </label>
                <Input
                  value={formData.public_ip}
                  onChange={(e) => setFormData({ ...formData, public_ip: e.target.value })}
                  placeholder="Ex: 203.0.113.10"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  IP público do cliente para roteamento DNS
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Pi-hole (opcional)
                </label>
                <Input
                  type="password"
                  value={formData.pihole_password}
                  onChange={(e) => setFormData({ ...formData, pihole_password: e.target.value })}
                  placeholder="Senha para admin Pi-hole"
                />
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {(createMutation.isLoading || updateMutation.isLoading) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
