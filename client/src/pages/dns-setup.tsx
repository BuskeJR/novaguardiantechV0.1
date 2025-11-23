import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DNSSetup() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast({
      title: "Copiado!",
      description: "DNS configurado copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Configuração de DNS
        </h1>
        <p className="text-muted-foreground mt-2">
          Instruções para configurar o bloqueio de domínios na sua rede
        </p>
      </div>

      {/* Alert */}
      <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          Certifique-se de que todos os domínios desejados foram adicionados em "Domínios Bloqueados" antes de configurar o DNS.
        </AlertDescription>
      </Alert>

      {/* Configuration Steps */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              Identificar seus dados de acesso
            </CardTitle>
            <CardDescription>
              Você precisará do endereço IP público e da porta DNS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para usar o NovaGuardian como servidor DNS, você precisa:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>IP Público da Aplicação:</strong> O IP público onde esta aplicação está hospedada
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Porta DNS:</strong> Porta 53 (padrão universal para DNS)
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              Configurar DNS no Roteador
            </CardTitle>
            <CardDescription>
              Adicione o servidor DNS NovaGuardian como DNS primário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Acesse a interface do seu roteador (normalmente em 192.168.1.1 ou 192.168.0.1) com as credenciais de administrador.
              </p>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Passos:</h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Acesse <strong>Configurações &gt; DNS</strong> ou <strong>Rede &gt; Servidores DNS</strong></li>
                  <li>2. Defina o DNS Primário como seu IP público (fornecido pelo NovaGuardian)</li>
                  <li>3. Deixe DNS Secundário em branco ou use 8.8.8.8</li>
                  <li>4. Salve as configurações</li>
                  <li>5. Reinicie o roteador</li>
                </ol>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Se você não souber acessar as configurações do seu roteador, consulte o manual ou a documentação do fabricante.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              Testar a Configuração
            </CardTitle>
            <CardDescription>
              Verifique se o bloqueio está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Após configurar, você pode testar se os domínios estão sendo bloqueados:
              </p>

              <div className="space-y-3 rounded-lg bg-muted p-3">
                <div>
                  <p className="text-xs font-semibold mb-1">Windows (Cmd ou PowerShell):</p>
                  <div className="flex items-center gap-2 bg-background rounded p-2">
                    <code className="text-xs font-mono text-muted-foreground flex-1">
                      nslookup tiktok.com [SEU_IP_PUBLICO]
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() =>
                        copyToClipboard("nslookup tiktok.com [SEU_IP_PUBLICO]", "cmd-windows")
                      }
                      data-testid="button-copy-cmd-windows"
                    >
                      {copied === "cmd-windows" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold mb-1">Mac/Linux (Terminal):</p>
                  <div className="flex items-center gap-2 bg-background rounded p-2">
                    <code className="text-xs font-mono text-muted-foreground flex-1">
                      dig @[SEU_IP_PUBLICO] tiktok.com
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() =>
                        copyToClipboard("dig @[SEU_IP_PUBLICO] tiktok.com", "cmd-mac")
                      }
                      data-testid="button-copy-cmd-mac"
                    >
                      {copied === "cmd-mac" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Se a resposta for <strong>127.0.0.1</strong>, o bloqueio está funcionando! Caso contrário, verifique as configurações do DNS no roteador.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                4
              </span>
              Gerenciar Domínios Bloqueados
            </CardTitle>
            <CardDescription>
              Adicione ou remova domínios a qualquer momento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Você pode adicionar ou remover domínios da lista de bloqueio a qualquer momento. As mudanças são aplicadas imediatamente:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Acesse <strong>"Domínios Bloqueados"</strong> no menu lateral</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Clique em <strong>"Adicionar Domínio"</strong> para bloquear novo domínio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Use o botão de <strong>lixeira</strong> para remover um domínio do bloqueio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Toggle <strong>"Ativo/Inativo"</strong> para ativar ou desativar bloqueios temporariamente</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Important Notes */}
      <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Dicas Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>
            • <strong>Bloqueio em toda rede:</strong> Uma vez configurado, todos os dispositivos conectados ao seu Wi-Fi/rede terão os domínios bloqueados automaticamente
          </p>
          <p>
            • <strong>Atualização em tempo real:</strong> Adicione novos domínios e eles começarão a ser bloqueados imediatamente
          </p>
          <p>
            • <strong>Wildcard automático:</strong> Se você bloquear "tiktok.com", também bloqueará automaticamente "www.tiktok.com" e todos os subdomínios
          </p>
          <p>
            • <strong>Sem necessidade de Cloudflare:</strong> O sistema funciona de forma independente, não requer configuração de serviços externos
          </p>
          <p>
            • <strong>Backup DNS:</strong> Recomenda-se ter um DNS secundário (como 8.8.8.8) para redundância
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
