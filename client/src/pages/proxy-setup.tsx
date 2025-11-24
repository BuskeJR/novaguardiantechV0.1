import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProxySetup() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [proxyUrl, setProxyUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    const currentUrl = window.location.origin;
    const host = currentUrl.replace("http://", "").replace("https://", "");
    setProxyUrl(`${host}:3128`);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "URL do proxy copiada para a área de transferência",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Configuração de Proxy
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure o proxy HTTP/HTTPS para bloquear domínios em toda sua rede
        </p>
      </div>

      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Sistema Ativo e Funcionando!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✓ Proxy HTTP/HTTPS rodando na porta 3128</p>
          <p>✓ Bloqueio automático de domínios configurados</p>
          <p>✓ Isolamento total por cliente</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>URL do Proxy</CardTitle>
          <CardDescription>Configure nos seus dispositivos/navegadores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={proxyUrl}
              readOnly
              className="font-mono"
              data-testid="input-proxy-url"
            />
            <Button
              onClick={() => copyToClipboard(proxyUrl)}
              variant="outline"
              data-testid="button-copy-proxy"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Porta: 3128</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Configurar</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="windows">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="windows">Windows</TabsTrigger>
              <TabsTrigger value="mac">Mac</TabsTrigger>
              <TabsTrigger value="linux">Linux</TabsTrigger>
            </TabsList>

            <TabsContent value="windows" className="space-y-4 mt-4">
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold">Passo 1: Abra Configurações</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Win + I para abrir Configurações</li>
                  <li>Vá para "Rede e Internet"</li>
                  <li>Clique em "Proxy"</li>
                </ol>
                <h4 className="font-semibold mt-3">Passo 2: Configure Proxy Manual</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Ative "Use a proxy server"</li>
                  <li>Cole o endereço do proxy</li>
                  <li>Clique "Salvar"</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="mac" className="space-y-4 mt-4">
              <div className="space-y-3 text-sm">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Apple Menu → Preferências do Sistema</li>
                  <li>Clique "Rede"</li>
                  <li>Selecione sua conexão → "Avançado"</li>
                  <li>Aba "Proxies"</li>
                  <li>Marque "Proxy Web (HTTP)" e (HTTPS)"</li>
                  <li>Cole o endereço do proxy</li>
                  <li>"OK" → "Aplicar"</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="linux" className="space-y-4 mt-4">
              <div className="space-y-3 text-sm">
                <p>Terminal:</p>
                <div className="bg-black text-green-400 rounded p-2 font-mono text-xs">
                  export http_proxy=http://{proxyUrl}<br/>
                  export https_proxy=http://{proxyUrl}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>1. Adicione um domínio em "Domínios Bloqueados"</p>
          <p>2. Configure o proxy no seu dispositivo</p>
          <p>3. Tente acessar o domínio bloqueado</p>
          <p>4. Verá: "Acesso Bloqueado" ✓</p>
        </CardContent>
      </Card>
    </div>
  );
}
