import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CloudflareSetup() {
  const { toast } = useToast();
  const [zoneId, setZoneId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfigure = async () => {
    if (!zoneId.trim()) {
      toast({
        title: "Erro",
        description: "Digite o Zone ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("/api/cloudflare/configure", {
        method: "POST",
        body: JSON.stringify({ zoneId: zoneId.trim() }),
      });

      toast({
        title: "Sucesso!",
        description: `Cloudflare configurado para: ${response.message}`,
      });
      setZoneId("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao configurar Cloudflare",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          Configurar Cloudflare
        </h1>
        <p className="text-muted-foreground">
          Configure seu Zone ID do Cloudflare para ativar o bloqueio automático de domínios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zone ID do Cloudflare</CardTitle>
          <CardDescription>
            Você pode encontrar o Zone ID em: Cloudflare Dashboard → Seu Domínio → Lado direito da tela
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="zone-id" className="text-sm font-medium">
              Zone ID
            </label>
            <Input
              id="zone-id"
              placeholder="Exemplo: 0f11e36f96785e44410485b64b456356"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              data-testid="input-zone-id"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Cole o Zone ID do Cloudflare aqui
            </p>
          </div>

          <Button
            onClick={handleConfigure}
            disabled={isLoading || !zoneId.trim()}
            size="lg"
            data-testid="button-configure-cloudflare"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Configurando..." : "Configurar Cloudflare"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como encontrar o Zone ID?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>Acesse: https://dash.cloudflare.com/</li>
            <li>Clique no seu domínio (newnessplanner.com)</li>
            <li>Procure "Zone ID" no lado direito da página</li>
            <li>Copie aquele código longo (32 caracteres)</li>
            <li>Cole aqui acima e clique em "Configurar Cloudflare"</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
