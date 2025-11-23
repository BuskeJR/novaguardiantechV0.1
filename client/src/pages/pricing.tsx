import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Home, Zap, Crown, HelpCircle, X, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const features = [
  {
    name: "Dispositivos em Rede",
    residencial: "1-10",
    plus: "1-25",
    pro: "1-50",
  },
  {
    name: "Domínios Bloqueados",
    residencial: "500",
    plus: "2.500",
    pro: "Ilimitados",
  },
  {
    name: "IPs na Lista Branca",
    residencial: "20",
    plus: "50",
    pro: "Ilimitados",
  },
  {
    name: "Dashboard Web",
    residencial: true,
    plus: true,
    pro: true,
  },
  {
    name: "Relatórios de Bloqueio",
    residencial: true,
    plus: true,
    pro: true,
  },
  {
    name: "Suporte por Email",
    residencial: true,
    plus: true,
    pro: true,
  },
  {
    name: "Suporte Prioritário",
    residencial: false,
    plus: true,
    pro: true,
  },
  {
    name: "Suporte Chat 24/7",
    residencial: false,
    plus: false,
    pro: true,
  },
  {
    name: "Análise Avançada",
    residencial: false,
    plus: false,
    pro: true,
  },
];

const faqs = [
  {
    question: "Qual é a diferença entre os planos?",
    answer: "Cada plano oferece diferentes limites de dispositivos, domínios e endereços IP, otimizados para residências e empresas de diferentes tamanhos.",
  },
  {
    question: "Posso mudar de plano depois?",
    answer: "Sim, você pode fazer upgrade ou downgrade de seu plano a qualquer momento. As alterações entram em vigor no próximo período de faturamento.",
  },
  {
    question: "Qual é a política de reembolso?",
    answer: "Oferecemos garantia de reembolso integral em até 7 dias após a compra. Se não estiver satisfeito, reembolsamos 100% do seu pagamento, sem perguntas.",
  },
  {
    question: "Como funcionam os descontos anuais?",
    answer: "Se você escolher pagar anualmente, recebe um desconto automático de até 20% em relação ao preço mensal.",
  },
  {
    question: "Posso usar em múltiplas redes?",
    answer: "Cada conta é independente. Se precisar gerenciar múltiplas redes, você pode criar múltiplas contas.",
  },
  {
    question: "E se exceder meu limite?",
    answer: "Você receberá um aviso quando atingir 90% do seu limite. Pode fazer upgrade para um plano superior para mais espaço.",
  },
];

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
      // Try MercadoPago first, fallback to Stripe
      try {
        const response = await apiRequest("POST", "/api/checkout-mercadopago", { plan });
        return response as any;
      } catch (error) {
        // Fallback to Stripe
        console.log("MercadoPago checkout failed, trying Stripe fallback");
        const response = await apiRequest("POST", "/api/checkout", { plan });
        return response as any;
      }
    },
    onSuccess: (data: any) => {
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.success) {
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
      setLoading(false);
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
    ? Object.entries(plans)
        .filter(([key]) => key !== "free")
        .map(([key, plan]: any) => ({
          key,
          ...plan,
        }))
    : [];

  const calculatePrice = (plan: any) => {
    if (plan.price === 0 || !plan.annualDiscount || billingPeriod === "monthly") {
      return plan.price;
    }
    const annualPrice = plan.price * 12;
    const discount = annualPrice * (plan.annualDiscount / 100);
    return Math.floor(annualPrice - discount);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 pt-32 pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto max-w-6xl px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/30 px-4 py-2 mb-8 border border-blue-200 dark:border-blue-800">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Planos acessíveis para todos</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-8 leading-tight">
            Proteção DNS para <span className="text-blue-600 dark:text-blue-400">sua rede</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Bloqueie domínios maliciosos automaticamente. Escolha o plano perfeito para suas necessidades de proteção
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex gap-2 p-2 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-6 py-2.5 rounded-md font-semibold transition-all relative ${
                  billingPeriod === "annual"
                    ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Anual
                {billingPeriod === "annual" && (
                  <Badge className="absolute -top-2.5 -right-8 bg-green-500 text-white text-xs">
                    Economize 20%
                  </Badge>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {planList.map((plan) => {
            const isPopular = plan.popular;
            const displayPrice = calculatePrice(plan);
            const isAnnual = billingPeriod === "annual" && plan.annualDiscount;

            return (
              <div key={plan.key} className={`relative transition-all duration-300 ${isPopular ? "lg:scale-105" : ""}`}>
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-to-r from-blue-600 to-blue-500 text-white border-0 px-4 py-1.5 text-sm font-semibold">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <Card
                  className={`h-full flex flex-col ${
                    isPopular
                      ? "ring-2 ring-blue-500 shadow-xl"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg"
                  } transition-all duration-300`}
                >
                  <CardHeader className={`pb-6 ${isPopular ? "pt-10" : ""}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2.5 rounded-xl ${
                        isPopular
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "bg-slate-100 dark:bg-slate-900"
                      }`}>
                        {getPlanIcon(plan.key)}
                      </div>
                      {isPopular && (
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs">
                          Recomendado
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-base text-slate-600 dark:text-slate-400 mt-3">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col pb-8">
                    {/* Price */}
                    <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
                      {plan.price === 0 ? (
                        <div>
                          <div className="text-4xl font-bold text-slate-900 dark:text-white">
                            Gratuito
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                            {plan.trialDays} dias de teste sem cartão
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-5xl font-bold text-slate-900 dark:text-white">
                              R${(displayPrice / 100).toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 text-lg">
                              {isAnnual ? "/ano" : "/mês"}
                            </span>
                          </div>
                          {isAnnual && plan.annualDiscount && (
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              Economize {plan.annualDiscount}% ao pagar anualmente
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          Até {plan.maxDevices === 0 ? "teste" : plan.maxDevices} dispositivos
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
                          {plan.maxIps} endereços IP permitidos
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Dashboard de controle
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Relatórios completos
                        </span>
                      </li>
                    </ul>

                    {/* CTA Button */}
                    <Button
                      className={`w-full h-11 font-semibold transition-all ${
                        isPopular
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : ""
                      }`}
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan.key)}
                      disabled={loading || checkoutMutation.isPending}
                      data-testid={`button-select-${plan.key}`}
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Processando...
                        </>
                      ) : (
                        <>
                          {isAuthenticated ? "Selecionar" : "Começar"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-slate-50 dark:bg-slate-900/50 py-24">
        <div className="container mx-auto max-w-6xl px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Comparação Completa
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Veja exatamente o que cada plano oferece
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-5 px-6 font-semibold text-slate-900 dark:text-white">
                    Recursos
                  </th>
                  {planList.map((plan) => (
                    <th
                      key={plan.key}
                      className="text-center py-5 px-4 font-semibold text-slate-900 dark:text-white"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr
                    key={feature.name}
                    className={`border-b border-slate-200 dark:border-slate-800 ${
                      idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50 dark:bg-slate-900/30"
                    }`}
                  >
                    <td className="text-left py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                      {feature.name}
                    </td>
                    {planList.map((plan) => (
                      <td key={plan.key} className="text-center py-4 px-4">
                        {typeof feature[plan.key as keyof typeof feature] === "boolean" ? (
                          feature[plan.key as keyof typeof feature] ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-slate-300 dark:text-slate-600 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {feature[plan.key as keyof typeof feature]}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto max-w-3xl px-4 md:px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-6 border border-blue-200 dark:border-blue-800">
            <HelpCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Respostas para as dúvidas mais comuns
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`faq-${idx}`}
              className="border border-slate-200 dark:border-slate-800 rounded-lg px-6 py-4 data-[state=open]:bg-blue-50 dark:data-[state=open]:bg-blue-900/10 transition-colors"
            >
              <AccordionTrigger className="text-left hover:no-underline py-0">
                <span className="font-semibold text-slate-900 dark:text-white text-lg">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 py-20">
        <div className="container mx-auto max-w-4xl px-4 md:px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Teste gratuitamente por 7 dias. Sem cartão de crédito necessário.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-base font-semibold h-12"
              onClick={() => window.location.href = "/signup"}
              data-testid="button-cta-signup"
            >
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base font-semibold h-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => window.location.href = "/"}
              data-testid="button-cta-home"
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
