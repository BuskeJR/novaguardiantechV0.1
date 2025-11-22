import { Shield, Lock, Zap, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" data-testid="logo-icon" />
            <span className="text-xl font-bold" data-testid="text-brand-name">NovaGuardian</span>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = "/login"}
              variant="outline"
              data-testid="button-login"
            >
              Entrar
            </Button>
            <Button 
              onClick={() => window.location.href = "/signup"}
              data-testid="button-signup-header"
            >
              Criar Conta
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-6 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-8">
            <Shield className="h-4 w-4" />
            Proteção Empresarial de DNS
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Proteja Sua Rede com
            <span className="text-primary"> Bloqueio de DNS</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            Solução multi-tenant de filtragem DNS. Bloqueie domínios maliciosos, anúncios e conteúdo indesejado em toda sua rede com um único clique.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = "/login"}
              data-testid="button-get-started"
            >
              Começar Gratuitamente
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = "/pricing"}
              data-testid="button-learn-more"
            >
              Ver Planos
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container px-6 py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Funciona</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Três passos simples para proteger sua rede inteira
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Criar Conta",
                description: "Cadastre-se e configure seu tenant com seu endereço IP público",
                icon: Users,
              },
              {
                step: "2",
                title: "Adicionar Domínios",
                description: "Adicione domínios que deseja bloquear através do nosso painel intuitivo",
                icon: Lock,
              },
              {
                step: "3",
                title: "Proteção Instantânea",
                description: "Domínios são bloqueados automaticamente em toda sua rede",
                icon: Zap,
              },
            ].map((item) => (
              <Card key={item.step} className="relative overflow-hidden">
                <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10">
                  {item.step}
                </div>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Recursos Poderosos</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar bloqueio de DNS em escala
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Suporte Multi-Tenant",
                description: "Configurações de DNS isoladas para cada cliente com separação total de dados",
                icon: Users,
              },
              {
                title: "Bloqueio em Tempo Real",
                description: "Bloqueio instantâneo de domínios em toda sua infraestrutura de rede",
                icon: Zap,
              },
              {
                title: "Lista Branca de IPs",
                description: "Controle quais endereços IP podem acessar sua proteção de DNS",
                icon: Network,
              },
              {
                title: "Registro de Auditoria",
                description: "Trilha de auditoria completa de todas as alterações e ações de configuração",
                icon: FileText,
              },
              {
                title: "Segurança Avançada",
                description: "Controle de acesso baseado em funções com permissões de admin e usuário",
                icon: Lock,
              },
              {
                title: "Análises do Painel",
                description: "Estatísticas em tempo real e insights sobre consultas bloqueadas",
                icon: LayoutDashboard,
              },
            ].map((feature, index) => (
              <Card key={index} className="hover-elevate">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-6 py-24 bg-primary/5">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para Proteger Sua Rede?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Junte-se a empresas que protegem suas redes com NovaGuardian DNS
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => window.location.href = "/login"}
            data-testid="button-cta-start"
          >
            Começar Teste Grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container px-6 py-12 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">NovaGuardian</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 NovaGuardianTech. Proteção de DNS Empresarial.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Fixing missing imports
import { Network, LayoutDashboard, FileText } from "lucide-react";
