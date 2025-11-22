import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    tenantName: "",
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar conta");
      }

      const data = await response.json();
      
      toast({
        title: "Conta criada com sucesso!",
        description: "Entrando na sua conta...",
      });

      // Auto-login by redirecting to login
      setTimeout(() => {
        window.location.href = `/api/login?user=${encodeURIComponent(data.userId)}`;
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>
            Comece sua proteção de DNS hoje mesmo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-email"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Primeiro Nome *</Label>
                <Input
                  id="firstName"
                  placeholder="João"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  placeholder="Silva"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantName">Nome da Empresa/Rede *</Label>
              <Input
                id="tenantName"
                placeholder="Minha Empresa"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                required
                data-testid="input-tenant-name"
              />
            </div>

            {/* Trial Info */}
            <div className="bg-primary/10 rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold text-primary">🎉 Plano Gratuito</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>✓ 100 domínios bloqueados</li>
                <li>✓ 5 IPs na lista branca</li>
                <li>✓ Suporte por email</li>
                <li>✓ 14 dias de teste</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="button-signup"
            >
              {loading ? "Criando conta..." : "Criar Conta Gratuita"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Já tem conta?{" "}
              <a href="/login" className="text-primary hover:underline">
                Entrar aqui
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
