import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface PricingPlan {
  name: string;
  price: number;
  maxDomains: number;
  maxIps: number;
  trialDays?: number;
  stripePriceId?: string;
}

export default function Pricing() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ["/api/pricing"],
    queryFn: () => fetch("/api/pricing").then(r => r.json()),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", "/api/checkout", { plan });
      return response;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        toast({
          title: "Sucesso!",
          description: "Você está usando o plano gratuito",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/tenant/me"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar checkout",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (planKey: string) => {
    if (!isAuthenticated) {
      window.location.href = "/signup";
      return;
    }

    setLoading(true);
    checkoutMutation.mutate(planKey);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("success")) {
      toast({
        title: "Pagamento confirmado!",
        description: "Sua assinatura foi ativada com sucesso",
      });
    } else if (params.has("canceled")) {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser",
      });
    }
  }, [toast]);

  const planList = plans
    ? Object.entries(plans).map(([key, plan]: any) => ({
        key,
        ...plan,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Planos de Proteção DNS</h1>
          <p className="text-lg text-muted-foreground">
            Escolha o plano perfeito para sua rede
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {planList.map((plan) => (
            <Card
              key={plan.key}
              className={`relative flex flex-col ${
                plan.key === "pro" ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.key === "pro" && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Mais Popular
                </Badge>
              )}

              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  {plan.key === "free"
                    ? "Perfeito para começar"
                    : "Para pequenas e médias empresas"}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <div className="mb-6">
                  {plan.price === 0 ? (
                    <div className="text-3xl font-bold">Gratuito</div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold">
                        ${(plan.price / 100).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{plan.maxDomains} domínios bloqueados</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{plan.maxIps} IPs na lista branca</span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Suporte por email</span>
                  </li>
                  {plan.trialDays && (
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{plan.trialDays} dias de teste</span>
                    </li>
                  )}
                  {plan.key === "pro" && (
                    <>
                      <li className="flex gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">Suporte prioritário</span>
                      </li>
                      <li className="flex gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">Relatórios avançados</span>
                      </li>
                    </>
                  )}
                  {plan.key === "enterprise" && (
                    <>
                      <li className="flex gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">Suporte 24/7 dedicado</span>
                      </li>
                      <li className="flex gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">API ilimitada</span>
                      </li>
                      <li className="flex gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">Integração customizada</span>
                      </li>
                    </>
                  )}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.key === "pro" ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.key)}
                  disabled={loading}
                  data-testid={`button-select-${plan.key}`}
                >
                  {isAuthenticated ? "Selecionar Plano" : "Criar Conta"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Perguntas Frequentes</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Posso mudar de plano?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Cobraças serão ajustadas proporcionalmente.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preciso de cartão de crédito para o plano gratuito?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Não! O plano gratuito é totalmente sem cartão de crédito.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Qual é a política de reembolso?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Oferecemos reembolso de 30 dias se não estiver satisfeito. Entre em contato com nosso suporte.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
