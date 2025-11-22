import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [customUserId, setCustomUserId] = useState<string>("");

  const handleLogin = (userId: string) => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário ou insira um ID de usuário",
        variant: "destructive",
      });
      return;
    }

    // Redirect to login with user parameter
    window.location.href = `/api/login?user=${encodeURIComponent(userId)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">NovaGuardian</CardTitle>
          <CardDescription>
            Proteção de DNS Empresarial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Demo Users Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Usuários de Teste</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedUser === "demo-user" ? "default" : "outline"}
                onClick={() => setSelectedUser("demo-user")}
                data-testid="button-demo-user"
              >
                Demo Admin
              </Button>
              <Button
                variant={selectedUser === "teste1" ? "default" : "outline"}
                onClick={() => setSelectedUser("teste1")}
                data-testid="button-teste1-user"
              >
                Teste1 (User)
              </Button>
            </div>
            {selectedUser && (
              <Button
                className="w-full"
                onClick={() => handleLogin(selectedUser)}
                data-testid="button-login-selected"
              >
                Entrar como {selectedUser}
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          {/* Custom User Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Usuário Personalizado</h3>
            <Input
              placeholder="ID do usuário"
              value={customUserId}
              onChange={(e) => setCustomUserId(e.target.value)}
              data-testid="input-custom-user"
              onKeyPress={(e) => {
                if (e.key === "Enter" && customUserId) {
                  handleLogin(customUserId);
                }
              }}
            />
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => handleLogin(customUserId)}
              disabled={!customUserId}
              data-testid="button-login-custom"
            >
              Entrar com ID Personalizado
            </Button>
          </div>

          {/* Info Section */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs">
            <p className="font-semibold">Informações de Teste:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <strong>demo-user:</strong> Acesso Admin</li>
              <li>• <strong>teste1:</strong> Acesso Usuário</li>
              <li>• Crie qualquer ID customizado</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
