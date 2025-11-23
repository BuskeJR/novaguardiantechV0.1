import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Globe, Network, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DomainRule, IpWhitelist, Tenant } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Não Autorizado",
        description: "Você foi desconectado. Entrando novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: tenant, isLoading: tenantLoading } = useQuery<Tenant>({
    queryKey: ["/api/tenant/me"],
    enabled: isAuthenticated,
  });

  // Redireciona para preços se não tem plano pago
  useEffect(() => {
    if (tenant && isAuthenticated) {
      const paidPlans = ["residencial", "plus", "pro"];
      const hasPaidPlan = tenant.currentPlan && paidPlans.includes(tenant.currentPlan);
      
      if (!hasPaidPlan) {
        window.location.href = "/pricing";
      }
    }
  }, [tenant, isAuthenticated]);

  const { data: domains = [], isLoading: domainsLoading } = useQuery<DomainRule[]>({
    queryKey: ["/api/domains"],
    enabled: isAuthenticated && !!tenant?.id,
  });

  const { data: whitelist = [], isLoading: whitelistLoading } = useQuery<IpWhitelist[]>({
    queryKey: ["/api/whitelist"],
    enabled: isAuthenticated && !!tenant?.id,
  });

  if (authLoading || tenantLoading) {
    return <HomeSkeleton />;
  }

  const activeDomains = domains.filter(d => d.status === "active").length;
  const totalDomains = domains.length;
  const whitelistCount = whitelist.length;

  const stats = [
    {
      title: "Bloqueios Ativos",
      value: activeDomains.toString(),
      description: `${totalDomains} domínios no total`,
      icon: Shield,
      color: "text-primary",
    },
    {
      title: "Domínios Bloqueados",
      value: totalDomains.toString(),
      description: `${activeDomains} ativo(s) atualmente`,
      icon: Globe,
      color: "text-destructive",
    },
    {
      title: "IPs na Lista Branca",
      value: whitelistCount.toString(),
      description: "Pontos de acesso autorizados",
      icon: Network,
      color: "text-blue-500",
    },
    {
      title: "Status",
      value: tenant?.isActive ? "Ativo" : "Inativo",
      description: tenant?.subscriptionStatus || "desconhecido",
      icon: Activity,
      color: tenant?.isActive ? "text-green-500" : "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Painel de Controle</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta! Aqui está uma visão geral da sua proteção de DNS.
        </p>
      </div>

      {tenant && (
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-tenant-name">{tenant.name}</CardTitle>
            <CardDescription>
              ID do Tenant: {tenant.slug} • IP Público: {tenant.publicIp || "Não configurado"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!tenant?.publicIp) && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Activity className="h-5 w-5" />
              Configuração Necessária
            </CardTitle>
            <CardDescription>
              Seu endereço IP público não está configurado. Entre em contato com o suporte para completar sua configuração.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
