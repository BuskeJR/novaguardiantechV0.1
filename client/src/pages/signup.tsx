import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, Eye, EyeOff, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

export default function Signup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    tenantName: "",
    password: "",
  });

  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    { label: "Mínimo 8 caracteres", met: false },
    { label: "1 letra maiúscula", met: false },
    { label: "1 letra minúscula", met: false },
    { label: "1 número", met: false },
    { label: "1 caractere especial (@$!%*?&)", met: false },
  ]);

  const updatePasswordRequirements = (password: string) => {
    const requirements = [
      { label: "Mínimo 8 caracteres", met: password.length >= 8 },
      { label: "1 letra maiúscula", met: /[A-Z]/.test(password) },
      { label: "1 letra minúscula", met: /[a-z]/.test(password) },
      { label: "1 número", met: /\d/.test(password) },
      { label: "1 caractere especial (@$!%*?&)", met: /@|\$|!|%|\*|\?|&/.test(password) },
    ];
    setPasswordRequirements(requirements);
  };

  const allRequirementsMet = passwordRequirements.every(r => r.met);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allRequirementsMet) {
      toast({
        title: "Erro",
        description: "Sua senha não atende todos os requisitos",
        variant: "destructive",
      });
      return;
    }

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
        description: "Redirecionando para login...",
      });

      // Redirect to login
      setTimeout(() => {
        window.location.href = `/login?email=${encodeURIComponent(formData.email)}`;
      }, 500);
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
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-signup-email"
              />
            </div>

            {/* Name Fields */}
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

            {/* Company Name */}
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

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Crie uma senha segura"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    updatePasswordRequirements(e.target.value);
                  }}
                  required
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold">Requisitos da senha:</p>
                <ul className="space-y-1 text-xs">
                  {passwordRequirements.map((req, i) => (
                    <li key={i} className="flex gap-2 items-center">
                      {req.met ? (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className={req.met ? "text-foreground" : "text-muted-foreground"}>
                        {req.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !allRequirementsMet}
              data-testid="button-signup"
            >
              {loading ? "Criando conta..." : "Criar Conta Gratuita"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {/* Login Link */}
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
