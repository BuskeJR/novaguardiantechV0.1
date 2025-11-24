import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    id: "residencial_mensal",
    name: "Residencial",
    period: "Mensal",
    price: "R$ 9,90",
    pricePerMonth: 9.90,
    description: "Perfeito para uso pessoal e familiar",
    features: [
      "Até 5 IPs na whitelist",
      "Bloqueio de até 1.000 domínios",
      "Atualizações automáticas de listas",
      "Suporte por email",
      "Dashboard básico",
    ],
  },
  {
    id: "residencial_trimestral",
    name: "Residencial",
    period: "Trimestral",
    price: "R$ 26,73",
    pricePerMonth: 8.91,
    description: "Economize com plano trimestral",
    features: [
      "Até 5 IPs na whitelist",
      "Bloqueio de até 1.000 domínios",
      "Atualizações automáticas de listas",
      "Suporte por email",
      "Dashboard básico",
      "10% de desconto",
    ],
    discount: "10%",
  },
  {
    id: "residencial_anual",
    name: "Residencial",
    period: "Anual",
    price: "R$ 107,91",
    pricePerMonth: 8.99,
    description: "Melhor valor anual",
    features: [
      "Até 5 IPs na whitelist",
      "Bloqueio de até 1.000 domínios",
      "Atualizações automáticas de listas",
      "Suporte por email",
      "Dashboard básico",
      "25% de desconto",
      "Renovação automática",
    ],
    discount: "25%",
    featured: true,
  },
  {
    id: "plus_mensal",
    name: "Plus",
    period: "Mensal",
    price: "R$ 24,90",
    pricePerMonth: 24.90,
    description: "Para pequenos negócios",
    features: [
      "Até 20 IPs na whitelist",
      "Bloqueio de até 5.000 domínios",
      "Listas personalizadas",
      "Suporte por email e chat",
      "Dashboard avançado",
      "Relatórios básicos",
    ],
  },
  {
    id: "plus_trimestral",
    name: "Plus",
    period: "Trimestral",
    price: "R$ 67,32",
    pricePerMonth: 22.44,
    description: "Economize com plano trimestral",
    features: [
      "Até 20 IPs na whitelist",
      "Bloqueio de até 5.000 domínios",
      "Listas personalizadas",
      "Suporte por email e chat",
      "Dashboard avançado",
      "Relatórios básicos",
      "10% de desconto",
    ],
    discount: "10%",
  },
  {
    id: "plus_anual",
    name: "Plus",
    period: "Anual",
    price: "R$ 269,28",
    pricePerMonth: 22.44,
    description: "Melhor valor anual",
    features: [
      "Até 20 IPs na whitelist",
      "Bloqueio de até 5.000 domínios",
      "Listas personalizadas",
      "Suporte por email e chat",
      "Dashboard avançado",
      "Relatórios básicos",
      "25% de desconto",
      "Renovação automática",
    ],
    discount: "25%",
  },
  {
    id: "pro_mensal",
    name: "Pro",
    period: "Mensal",
    price: "R$ 59,90",
    pricePerMonth: 59.90,
    description: "Para empresas e redes grandes",
    features: [
      "IPs ilimitados",
      "Bloqueio de até 50.000 domínios",
      "API REST completa",
      "Suporte prioritário 24/7",
      "Dashboard completo com analytics",
      "Relatórios detalhados",
      "Gerenciamento de múltiplos usuários",
      "Integração com sistemas terceiros",
    ],
  },
  {
    id: "pro_trimestral",
    name: "Pro",
    period: "Trimestral",
    price: "R$ 161,73",
    pricePerMonth: 53.91,
    description: "Economize com plano trimestral",
    features: [
      "IPs ilimitados",
      "Bloqueio de até 50.000 domínios",
      "API REST completa",
      "Suporte prioritário 24/7",
      "Dashboard completo com analytics",
      "Relatórios detalhados",
      "Gerenciamento de múltiplos usuários",
      "Integração com sistemas terceiros",
      "10% de desconto",
    ],
    discount: "10%",
  },
  {
    id: "pro_anual",
    name: "Pro",
    period: "Anual",
    price: "R$ 647,91",
    pricePerMonth: 53.99,
    description: "Melhor valor anual",
    features: [
      "IPs ilimitados",
      "Bloqueio de até 50.000 domínios",
      "API REST completa",
      "Suporte prioritário 24/7",
      "Dashboard completo com analytics",
      "Relatórios detalhados",
      "Gerenciamento de múltiplos usuários",
      "Integração com sistemas terceiros",
      "25% de desconto",
      "Renovação automática",
    ],
    discount: "25%",
    featured: true,
  },
];

export default function Pricing() {
  const [selectedPeriod, setSelectedPeriod] = useState<"Mensal" | "Trimestral" | "Anual">("Mensal");

  const filteredPlans = plans.filter(plan => plan.period === selectedPeriod);
  const planNames = ["Residencial", "Plus", "Pro"];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold" data-testid="text-page-title">
          Planos e Preços
        </h1>
        <p className="text-muted-foreground text-lg">
          Escolha o plano perfeito para sua rede
        </p>
      </div>

      {/* Seletor de Período */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => setSelectedPeriod("Mensal")}
          variant={selectedPeriod === "Mensal" ? "default" : "outline"}
          data-testid="button-period-mensal"
        >
          Mensal
        </Button>
        <Button
          onClick={() => setSelectedPeriod("Trimestral")}
          variant={selectedPeriod === "Trimestral" ? "default" : "outline"}
          data-testid="button-period-trimestral"
        >
          Trimestral
        </Button>
        <Button
          onClick={() => setSelectedPeriod("Anual")}
          variant={selectedPeriod === "Anual" ? "default" : "outline"}
          data-testid="button-period-anual"
        >
          Anual
        </Button>
      </div>

      {/* Grade de Planos */}
      <div className="grid md:grid-cols-3 gap-6">
        {planNames.map((planName) => {
          const plan = filteredPlans.find(p => p.name === planName);
          if (!plan) return null;

          return (
            <Card
              key={plan.id}
              className={`flex flex-col ${
                plan.featured ? "border-primary shadow-lg scale-105" : ""
              }`}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.discount && (
                <div className="bg-primary text-primary-foreground text-center py-2 rounded-t-lg font-semibold">
                  {plan.discount} de desconto!
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                {/* Preço */}
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{plan.price}</div>
                  <p className="text-sm text-muted-foreground">
                    R$ {plan.pricePerMonth.toFixed(2)}/mês
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className="w-full"
                  variant={plan.featured ? "default" : "outline"}
                  size="lg"
                  data-testid={`button-select-${plan.id}`}
                >
                  Escolher Plano
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ ou Info Adicional */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Posso mudar de plano?</h4>
            <p className="text-muted-foreground">
              Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Ajustaremos o valor proporcionalmente.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Período de testes?</h4>
            <p className="text-muted-foreground">
              Todos os planos incluem 7 dias de teste gratuito. Sem cartão de crédito necessário.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Suporte?</h4>
            <p className="text-muted-foreground">
              Oferecemos suporte por email em todos os planos. Planos Plus e Pro incluem chat e telefone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
