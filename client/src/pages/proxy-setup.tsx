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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Copy, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProxySetup() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [proxyUrl, setProxyUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Não Autorizado",
        description: "Você foi desconectado.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    // Pega a URL do proxy baseado na URL atual
    const currentUrl = window.location.origin;
    setProxyUrl(`${currentUrl}:5000`);
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
          Configure o proxy nos seus dispositivos para bloquear domínios automaticamente
        </p>
      </div>

      {/* Resumo Rápido */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            1. Configure o proxy nos seus dispositivos apontando para o NovaGuardianTech
          </p>
          <p className="text-sm">
            2. Adicione seu IP Público na seção de "Configuração de Rede"
          </p>
          <p className="text-sm">
            3. Adicione os domínios que deseja bloquear na seção de "Domínios Bloqueados"
          </p>
          <p className="text-sm font-semibold">
            ✓ Pronto! Qualquer requisição para esses domínios será bloqueada automaticamente
          </p>
        </CardContent>
      </Card>

      {/* Proxy URL */}
      <Card>
        <CardHeader>
          <CardTitle>URL do Proxy</CardTitle>
          <CardDescription>
            Use esta URL para configurar o proxy nos seus dispositivos
          </CardDescription>
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
        </CardContent>
      </Card>

      {/* Instruções por Sistema Operacional */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções de Configuração</CardTitle>
          <CardDescription>
            Siga o guia para seu sistema operacional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="windows" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="windows">Windows</TabsTrigger>
              <TabsTrigger value="mac">Mac</TabsTrigger>
              <TabsTrigger value="linux">Linux</TabsTrigger>
            </TabsList>

            {/* Windows */}
            <TabsContent value="windows" className="space-y-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Passo 1: Abra as Configurações de Rede</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Abra "Configurações" (Win + I)</li>
                  <li>Vá para "Rede e Internet"</li>
                  <li>Clique em "Proxy" no menu esquerdo</li>
                </ol>

                <h4 className="font-semibold mt-4">Passo 2: Configure o Proxy Manual</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Na seção "Proxy Manual", ative "Use a proxy server"</li>
                  <li>Endereço: Digite a URL do proxy (veja acima)</li>
                  <li>Porta: 5000</li>
                  <li>Clique "Salvar"</li>
                </ol>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3 mt-4">
                  <p className="text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Você pode precisar reiniciar o navegador para aplicar as mudanças</span>
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Mac */}
            <TabsContent value="mac" className="space-y-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Passo 1: Abra as Preferências de Rede</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Clique no ícone Apple → "Preferências do Sistema"</li>
                  <li>Clique em "Rede"</li>
                  <li>Selecione sua conexão de rede (WiFi ou Ethernet)</li>
                  <li>Clique em "Avançado..."</li>
                </ol>

                <h4 className="font-semibold mt-4">Passo 2: Configure o Proxy HTTP</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Vá para a aba "Proxies"</li>
                  <li>Marque "Proxy Web (HTTP)"</li>
                  <li>Servidor Web Proxy: Digite a URL do proxy</li>
                  <li>Porta: 5000</li>
                  <li>Clique "OK" → "Aplicar"</li>
                </ol>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3 mt-4">
                  <p className="text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Configure também o "Proxy Web Seguro (HTTPS)" com os mesmos dados</span>
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Linux */}
            <TabsContent value="linux" className="space-y-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Passo 1: Via Variáveis de Ambiente</h4>
                <p className="text-sm mb-2">Adicione ao seu .bashrc ou .zshrc:</p>
                <div className="bg-black dark:bg-gray-950 text-gray-100 rounded p-3 font-mono text-xs overflow-x-auto">
                  <code>
                    export http_proxy="{proxyUrl}"<br />
                    export https_proxy="{proxyUrl}"<br />
                    export HTTP_PROXY="{proxyUrl}"<br />
                    export HTTPS_PROXY="{proxyUrl}"
                  </code>
                </div>

                <h4 className="font-semibold mt-4">Passo 2: Via GUI (Gnome)</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Abra "Settings" → "Network"</li>
                  <li>Clique em "Network Proxy"</li>
                  <li>Selecione "Manual"</li>
                  <li>HTTP Proxy: {proxyUrl}</li>
                  <li>HTTPS Proxy: {proxyUrl}</li>
                </ol>

                <h4 className="font-semibold mt-4">Passo 3: Por Aplicação</h4>
                <p className="text-sm">
                  Cada navegador pode ter sua própria configuração de proxy. Consulte a documentação
                  do seu navegador (Chrome, Firefox, etc).
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Checklist de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist de Configuração</CardTitle>
          <CardDescription>
            Certifique-se de completar todos estes passos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              defaultChecked={false}
              className="mt-1"
              data-testid="checkbox-proxy-configured"
            />
            <span className="text-sm">Proxy configurado no seu dispositivo</span>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              defaultChecked={false}
              className="mt-1"
              data-testid="checkbox-ip-added"
            />
            <span className="text-sm">
              IP público adicionado em "Configuração de Rede"
            </span>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              defaultChecked={false}
              className="mt-1"
              data-testid="checkbox-domains-added"
            />
            <span className="text-sm">
              Domínios adicionados em "Domínios Bloqueados"
            </span>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              defaultChecked={false}
              className="mt-1"
              data-testid="checkbox-firewall-allow"
            />
            <span className="text-sm">
              Se necessário, permita a Replit na seu firewall
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Teste de Conexão */}
      <Card>
        <CardHeader>
          <CardTitle>Teste de Conexão</CardTitle>
          <CardDescription>
            Teste se o proxy está funcionando corretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Após configurar o proxy, visite um site qualquer. Se o proxy está funcionando,
            você verá uma mensagem do NovaGuardianTech no navegador.
          </p>
          <p className="text-sm text-muted-foreground">
            Domínios bloqueados mostrarão: "Acesso bloqueado - Este domínio está bloqueado
            para sua rede"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
