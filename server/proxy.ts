import { storage } from "./storage";
import { log } from "./app";

/**
 * Proxy HTTP para interceptar requisições e aplicar bloqueios
 * Cliente configura computador/router pra usar este proxy
 */

export async function checkDomainBlocked(
  domain: string,
  clientIp: string
): Promise<boolean> {
  try {
    const tenants = await storage.getAllTenants();
    const normalizedDomain = domain.toLowerCase();

    for (const tenant of tenants) {
      if (!tenant.isActive) continue;

      // Verifica se o IP está na whitelist deste tenant
      const whitelistIps = await storage.getIpWhitelistByTenantId(tenant.id);
      const ipWhitelisted = whitelistIps.some(w => w.ipAddress === clientIp);

      if (ipWhitelisted) {
        // IP está na whitelist, verifica se domínio está bloqueado
        const rules = await storage.getDomainRulesByTenantId(tenant.id);
        
        const isBlocked = rules.some(rule => {
          if (rule.status !== "active") return false;
          
          const ruleDomain = rule.domain.toLowerCase();
          
          // Match exato
          if (ruleDomain === normalizedDomain) return true;
          
          // Verificação de wildcard: se tiktok.com bloqueado, *.tiktok.com também é
          if (normalizedDomain === `www.${ruleDomain}`) return true;
          if (normalizedDomain.endsWith(`.${ruleDomain}`)) return true;
          
          return false;
        });

        if (isBlocked) {
          log(`PROXY BLOCK: ${normalizedDomain} from IP ${clientIp}`, "proxy");
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log(`PROXY ERROR checking ${domain}: ${message}`, "proxy");
    return false;
  }
}

export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // Se não conseguir parsear, tenta extrair manualmente
    const match = url.match(/(?:https?:\/\/)?([^\/]+)/);
    return match ? match[1] : "";
  }
}

export function getClientIpFromRequest(req: any): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown"
  );
}
