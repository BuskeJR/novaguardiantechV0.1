import http from "node:http";
import httpProxy, { type Server as ProxyServer } from "http-proxy";
import { storage } from "./storage";
import { log } from "./app";

/**
 * HTTP Proxy que intercepta requisições e bloqueia domínios
 * Cliente configura este proxy nos seus dispositivos
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

          // Wildcard: se tiktok.com bloqueado, *.tiktok.com também é
          if (normalizedDomain === `www.${ruleDomain}`) return true;
          if (normalizedDomain.endsWith(`.${ruleDomain}`)) return true;

          return false;
        });

        if (isBlocked) {
          log(`BLOCKED: ${normalizedDomain} from IP ${clientIp}`, "proxy");
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log(`ERROR checking ${domain}: ${message}`, "proxy");
    return false;
  }
}

export function getClientIpFromRequest(req: http.IncomingMessage): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    (req.socket as any)?.remoteAddress ||
    "unknown"
  );
}

export function createProxyServer() {
  const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    followRedirects: true,
    timeout: 30000,
  });

  const server = http.createServer(async (req, res) => {
    try {
      const clientIp = getClientIpFromRequest(req);
      const host = req.headers.host || "";
      const domain = host.split(":")[0];

      log(
        `PROXY ${req.method} ${domain}${req.url} from ${clientIp}`,
        "proxy"
      );

      // Verifica se domínio está bloqueado
      const isBlocked = await checkDomainBlocked(domain, clientIp);

      if (isBlocked) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Acesso Bloqueado",
            message: `O domínio ${domain} está bloqueado para sua rede`,
            domain,
            ip: clientIp,
          })
        );
        return;
      }

      // Faz proxy da requisição
      const target = `http://${domain}`;
      proxy.web(req, res, { target }, (error: any) => {
        if (error) {
          log(`PROXY ERROR: ${error.message}`, "proxy");
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Bad Gateway",
              message: "Erro ao conectar ao servidor",
            })
          );
        }
      });
    } catch (error) {
      log(`SERVER ERROR: ${error}`, "proxy");
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Internal Server Error",
          message: "Erro interno do proxy",
        })
      );
    }
  });

  // Handle CONNECT method para HTTPS
  server.on("connect", async (req, socket, head) => {
    try {
      const clientIp = getClientIpFromRequest(req);
      const host = (req.url || "").split(":")[0];

      log(`PROXY CONNECT (HTTPS) ${host} from ${clientIp}`, "proxy");

      // Verifica se domínio está bloqueado
      const isBlocked = await checkDomainBlocked(host, clientIp);

      if (isBlocked) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.end();
        return;
      }

      // Faz proxy HTTPS
      const target = `http://${req.url || ""}`;
      proxy.ws(req, socket, head, { target }, (error: any) => {
        if (error) {
          log(`PROXY WS ERROR: ${error.message}`, "proxy");
          socket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
          socket.end();
        }
      });
    } catch (error) {
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.end();
    }
  });

  return server;
}
