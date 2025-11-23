import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Home, Zap, Crown, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface PricingPlan {
  name: string;
  price: number;
  maxDevices: number;
  maxDomains: number;
  maxIps: number;
  billingCycle: string;
  description: string;
  annualDiscount?: number;
  trialDays?: number;
  stripePriceId?: string;
  popular?: boolean;
}

const getPlanIcon = (key: string) => {
  const iconProps = "h-8 w-8";
  switch (key) {
    case "free":
      return <Shield className={`${iconProps} text-muted-foreground`} />;
    case "residencial":
      return <Home className={`${iconProps} text-blue-500`} />;
    case "plus":
      return <Zap className={`${iconProps} text-amber-500`} />;
    case "pro":
      return <Crown className={`${iconProps} text-yellow-500`} />;
    default:
      return <Shield className={iconProps} />;
  }
};

export default function Pricing() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

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

  const calculatePrice = (plan: any) => {
    if (plan.price === 0 || !plan.annualDiscount || billingPeriod === "monthly") {
      return plan.price;
    }
    // Calcular preço anual com desconto
    const annualPrice = plan.price * 12;
    const discount = annualPrice * (plan.annualDiscount / 100);
    return Math.floor(annualPrice - discount);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-24 md:py-40">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto max-w-6xl px-4 text-center">
          <div className="flex justify-center mb-8">
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl p-4 border border-white/20">
              <Shield className="h-10 w-10 text-blue-400" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
            Planos de Proteção DNS
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Escolha o plano perfeito para proteger sua rede contra ameaças
          </p>

          <div className="flex justify-center gap-4 mb-8">
            <div className="inline-flex gap-2 p-1 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-white text-slate-900"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  billingPeriod === "annual"
                    ? "bg-white text-slate-900"
                    : "text-white hover:bg-white/10"
                }`}
              >
                Anual
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto max-w-7xl px-4 py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {planList.map((plan, index) => {
            const isPopular = plan.popular;
            const displayPrice = calculatePrice(plan);
            const isAnnual = billingPeriod === "annual" && plan.annualDiscount;

            return (
              <div key={plan.key} className="group">
                <Card
                  className={`relative h-full flex flex-col transition-all duration-300 ${
                    isPopular
                      ? "lg:scale-105 ring-2 ring-blue-500 shadow-2xl hover:shadow-2xl"
                      : "hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-4 py-1.5">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pt-8 pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform duration-300">
                        {getPlanIcon(plan.key)}
                      </div>
                      {isPopular && (
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Recomendado
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-2xl md:text-xl lg:text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    {/* Price Section */}
                    <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
                      {plan.price === 0 ? (
                        <div>
                          <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            Gratuito
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Período de teste de {plan.trialDays} dias
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-5xl font-bold text-slate-900 dark:text-white">
                              R${(displayPrice / 100).toFixed(2)}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {isAnnual ? "/ano" : "/mês"}
                            </span>
                          </div>
                          {isAnnual && plan.annualDiscount && (
                            <div className="inline-flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                Economize {plan.annualDiscount}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-4 mb-8 flex-1">
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Até {plan.maxDevices === 0 ? "teste" : plan.maxDevices} dispositivos em rede
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {plan.maxDomains} domínios bloqueados
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {plan.maxIps} endereços IP na lista branca
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Dashboard de controle web
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Relatórios de bloqueio
                        </span>
                      </li>
                      {plan.trialDays && (
                        <li className="flex gap-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Sem cartão de crédito
                          </span>
                        </li>
                      )}
                      {plan.key !== "free" && plan.key !== "residencial" && (
                        <li className="flex gap-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Suporte prioritário
                          </span>
                        </li>
                      )}
                      {plan.key === "pro" && (
                        <>
                          <li className="flex gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              Suporte por chat 24/7
                            </span>
                          </li>
                          <li className="flex gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              Análise avançada de tráfego
                            </span>
                          </li>
                        </>
                      )}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      className={`w-full font-semibold h-11 transition-all duration-300 ${
                        isPopular
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                          : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                      }`}
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan.key)}
                      disabled={loading}
                      data-testid={`button-select-${plan.key}`}
                    >
                      {isAuthenticated ? "Selecionar Plano" : "Criar Conta"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-slate-50 dark:bg-slate-900/50 py-32">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Comparação Completa
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Veja exatamente o que você ganha em cada plano
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-white">Recurso</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">Gratuito</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">Residencial</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">Plus</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">Dispositivos</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">Teste</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">Até 10</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">Até 25</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">Até 50</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">Domínios</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">100</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">500</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">2.000</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">5.000</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">IPs Whitelistados</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">5</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">10</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">25</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">50</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">Suporte</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">Email</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">Email</td>
                    <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">Prioritário</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-900 dark:text-white">24/7</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto max-w-3xl px-4 py-32">
        <div className="text-center mb-20">
          <div className="flex justify-center mb-6">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
              <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Posso mudar de plano depois?</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 dark:text-slate-400">
              Claro! Você pode fazer upgrade ou downgrade a qualquer momento. As cobranças serão ajustadas proporcionalmente ao período restante.
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Preciso de cartão de crédito para o plano gratuito?</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 dark:text-slate-400">
              Não! O plano gratuito é completamente sem custo e sem necessidade de cartão de crédito. Você pode usar todos os 3 dias de teste sem oferecer dados de pagamento.
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Qual é a política de reembolso?</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 dark:text-slate-400">
              Oferecemos uma garantia de satisfação de 30 dias. Se não estiver satisfeito, ofereceremos um reembolso completo, sem perguntas.
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Há desconto para pagamento anual?</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-600 dark:text-slate-400">
              Sim! Os planos Residencial e Plus oferecem desconto de 15% e 20% respectivamente quando você escolhe o pagamento anual. Você economiza significativamente escolhendo pagar um ano adiantado.
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Ainda tem dúvidas?
          </h3>
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            Nossa equipe está pronta para ajudar. Entre em contato conosco para uma consulta personalizada.
          </p>
          <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
            Falar com Suporte
          </Button>
        </div>
      </div>
    </div>
  );
}
