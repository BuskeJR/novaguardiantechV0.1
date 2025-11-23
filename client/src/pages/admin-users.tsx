import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, EyeOff, Trash2 } from "lucide-react";
import type { User } from "@shared/schema";
import { useLocation } from "wouter";

export default function AdminUsers() {
  const { toast } = useToast();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Não Autorizado",
        description: "Você foi desconectado.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (!authLoading && !isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissões de administrador",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, authLoading, toast, navigate]);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && isAdmin,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof newUser) => {
      await apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
      });
      setIsAddDialogOpen(false);
      setNewUser({
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        role: "user",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar usuário",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário atualizado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar usuário",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário removido",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover usuário",
        variant: "destructive",
      });
    },
  });

  if (isLoading || authLoading) {
    return <UsersSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            Gerenciar Usuários
          </h1>
          <p className="text-muted-foreground">
            Crie, edite ou desative usuários do sistema
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          data-testid="button-add-user"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, idx) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium" data-testid={`text-email-${idx}`}>
                      {user.email}
                    </TableCell>
                    <TableCell data-testid={`text-name-${idx}`}>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "default" : "outline"}
                        data-testid={`badge-role-${idx}`}
                      >
                        {user.role === "admin" ? "Admin" : "Cliente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive !== false ? "default" : "secondary"}
                        data-testid={`badge-status-${idx}`}
                      >
                        {user.isActive !== false ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleMutation.mutate({
                            id: user.id,
                            isActive: user.isActive === false,
                          })
                        }
                        data-testid={`button-toggle-${idx}`}
                        title={
                          user.isActive === false ? "Ativar" : "Desativar"
                        }
                      >
                        {user.isActive === false ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(user.id)}
                        data-testid={`button-delete-${idx}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Adicione um novo usuário ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">Primeiro Nome</Label>
              <Input
                id="firstName"
                placeholder="João"
                value={newUser.firstName}
                onChange={(e) =>
                  setNewUser({ ...newUser, firstName: e.target.value })
                }
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                placeholder="Silva"
                value={newUser.lastName}
                onChange={(e) =>
                  setNewUser({ ...newUser, lastName: e.target.value })
                }
                data-testid="input-last-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                data-testid="input-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuário</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Cliente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => addMutation.mutate(newUser)}
              disabled={
                !newUser.email ||
                !newUser.firstName ||
                !newUser.lastName ||
                !newUser.password ||
                addMutation.isPending
              }
              data-testid="button-submit"
            >
              {addMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
