import dgram, { type RemoteInfo } from "node:dgram";
import dns from "node:dns/promises";
import { storage } from "./storage";
import { log } from "./app";

// dns2 lib doesn't have types, so we use any
let dns2: any = null;

// Cache domínios bloqueados em memória
let blockedDomains: Set<string> = new Set();
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Carrega dns2 module dinamicamente
 */
async function loadDns2() {
  if (!dns2) {
    dns2 = await import("dns2");
  }
  return dns2;
}

/**
 * Carrega domínios bloqueados do banco para a memória
 */
async function refreshBlockedDomains() {
  try {
    const tenants = await storage.getAllTenants();
    const allBlocked = new Set<string>();

    for (const tenant of tenants) {
      if (tenant.isActive) {
        const rules = await storage.getDomainRulesByTenantId(tenant.id);
        for (const rule of rules) {
          if (rule.status === "active") {
            // Adiciona domínio exato e wildcard
            allBlocked.add(rule.domain.toLowerCase());
            allBlocked.add(`*.${rule.domain.toLowerCase()}`);
          }
        }
      }
    }

    blockedDomains = allBlocked;
    lastCacheUpdate = Date.now();
    log(`DNS: ${allBlocked.size} domains loaded for blocking`, "dns");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log(`DNS: Error loading blocked domains: ${message}`, "dns");
  }
}

/**
 * Verifica se um domínio deve ser bloqueado
 */
function isBlocked(domain: string): boolean {
  const normalizedDomain = domain.toLowerCase();

  // Verificação exata
  if (blockedDomains.has(normalizedDomain)) {
    return true;
  }

  // Verificação de subdomínios
  const parts = normalizedDomain.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const wildcard = "*." + parts.slice(i).join(".");
    if (blockedDomains.has(wildcard)) {
      return true;
    }
  }

  return false;
}

/**
 * Processa uma query DNS
 */
async function processQuery(
  question: Record<string, unknown>,
  remoteAddress: string,
  remotePort: number,
  callback: (response: Buffer) => void
) {
  const name = question.name as string;
  const type = question.type as string;

  // Se o domínio está bloqueado
  if (isBlocked(name) && (type === "A" || type === "AAAA")) {
    log(`DNS BLOCKED: ${name} from ${remoteAddress}`, "dns");

    const response = {
      id: 0,
      type: "response",
      authoritative_answer: true,
      truncated: false,
      recursion_desired: true,
      recursion_available: true,
      authentic_data: false,
      checking_disabled: false,
      rcode: "NOERROR",
      questions: [question],
      answers:
        type === "A"
          ? [
              {
                name: name,
                type: "A",
                class: "IN",
                ttl: 60,
                address: "127.0.0.1",
              },
            ]
          : [
              {
                name: name,
                type: "AAAA",
                class: "IN",
                ttl: 60,
                address: "::1",
              },
            ],
      authorities: [],
      additionals: [],
    };

    callback(dns2.encode(response));
    return;
  }

  // Se não está bloqueado, encaminha para DNS público (Google)
  try {
    let addresses: string[] = [];

    if (type === "A") {
      addresses = await dns.resolve4(name as string).catch(() => []);
    } else if (type === "AAAA") {
      addresses = await dns.resolve6(name as string).catch(() => []);
    } else if (type === "CNAME") {
      const cnames = await dns.resolveCname(name as string).catch(() => []);
      addresses = cnames as string[];
    }

    const answers = addresses.map((addr: string) => ({
      name: name as string,
      type: type as string,
      class: "IN",
      ttl: 300,
      address: addr,
    }));

    const response = {
      id: 0,
      type: "response",
      authoritative_answer: false,
      truncated: false,
      recursion_desired: true,
      recursion_available: true,
      authentic_data: false,
      checking_disabled: false,
      rcode: "NOERROR",
      questions: [question],
      answers: answers,
      authorities: [],
      additionals: [],
    };

    callback(dns2.encode(response));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log(`DNS: Error resolving ${name}: ${message}`, "dns");

    const response = {
      id: 0,
      type: "response",
      authoritative_answer: false,
      truncated: false,
      recursion_desired: true,
      recursion_available: true,
      authentic_data: false,
      checking_disabled: false,
      rcode: "SERVFAIL",
      questions: [question],
      answers: [],
      authorities: [],
      additionals: [],
    };

    callback(dns2.encode(response));
  }
}

/**
 * Inicia o servidor DNS
 */
export async function startDnsServer() {
  try {
    // Carrega dns2
    await loadDns2();

    // Carrega domínios bloqueados imediatamente
    await refreshBlockedDomains();

    // Atualiza cache a cada 5 minutos
    setInterval(refreshBlockedDomains, CACHE_TTL);

    // Cria servidor UDP para DNS
    const server = dgram.createSocket("udp4");

    server.on("message", async (message: Buffer, rinfo: RemoteInfo) => {
      try {
        const request = dns2.decode(message);
        let responseBuffer = Buffer.alloc(0);

        for (const question of request.questions) {
          await processQuery(
            question as Record<string, unknown>,
            rinfo.address,
            rinfo.port,
            (response: Buffer) => {
              responseBuffer = response;
            }
          );

          // Envia resposta
          server.send(responseBuffer, 0, responseBuffer.length, rinfo.port, rinfo.address);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        log(`DNS: Error processing query: ${errorMessage}`, "dns");
      }
    });

    server.bind(53, "0.0.0.0");
    log("DNS server started on port 53", "dns");
  } catch (error) {
    if (error instanceof Error && error.message.includes("EACCES")) {
      log(
        "DNS: Cannot bind to port 53 (needs root/admin). DNS blocking disabled.",
        "dns"
      );
    } else {
      const message = error instanceof Error ? error.message : "Unknown error";
      log(`DNS: Error starting server: ${message}`, "dns");
    }
  }
}
