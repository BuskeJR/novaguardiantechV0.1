import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");

  const handleLogin = () => {
    if (!userId.trim()) {
      toast({
        title: "Erro",
        description: "Insira seu ID de usuário",
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
          {/* Login Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">ID do Usuário</label>
              <Input
                placeholder="Insira seu ID de usuário"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                data-testid="input-user-id"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                autoFocus
              />
            </div>

            <Button
              className="w-full"
              onClick={handleLogin}
              data-testid="button-login"
            >
              Entrar
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                novo cliente
              </span>
            </div>
          </div>

          {/* Signup Link */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = "/signup"}
            data-testid="button-create-account"
          >
            Criar Conta Gratuita
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
