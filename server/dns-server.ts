import dgram from "dgram";
import { storage } from "./storage";

interface DNSQuery {
  type: number;
  name: string;
}

interface DNSAnswer {
  name: string;
  type: number;
  class: number;
  ttl: number;
  rdlength: number;
  rdata: Buffer;
}

// Cache de domínios bloqueados
let blockedDomainsCache: Set<string> = new Set();
let lastCacheUpdate = 0;
const CACHE_TTL = 30000; // 30 segundos

async function updateBlockedDomainsCache() {
  try {
    const now = Date.now();
    if (now - lastCacheUpdate > CACHE_TTL) {
      const allDomains = await storage.getAllDomainRules();
      blockedDomainsCache.clear();

      allDomains.forEach((rule) => {
        if (rule.status === "active") {
          blockedDomainsCache.add(rule.domain.toLowerCase());
        }
      });

      lastCacheUpdate = now;
      console.log(
        `[DNS] Cache atualizado com ${blockedDomainsCache.size} domínios bloqueados`
      );
    }
  } catch (error) {
    console.error("[DNS] Erro ao atualizar cache:", error);
  }
}

function isDomainBlocked(domain: string): boolean {
  const lowerDomain = domain.toLowerCase().replace(/\.$/, ""); // Remove trailing dot

  // Verifica correspondência exata
  if (blockedDomainsCache.has(lowerDomain)) {
    return true;
  }

  // Verifica correspondência de subdomínios
  const parts = lowerDomain.split(".");
  for (let i = 1; i < parts.length; i++) {
    const parentDomain = parts.slice(i).join(".");
    if (blockedDomainsCache.has(parentDomain)) {
      return true;
    }
  }

  return false;
}

function parseQuery(buffer: Buffer): DNSQuery | null {
  try {
    let offset = 12; // Pula o header
    let name = "";
    let length = buffer[offset];

    while (length !== 0) {
      offset++;
      name += buffer.toString("ascii", offset, offset + length) + ".";
      offset += length;
      length = buffer[offset];
    }

    offset++; // Pula o zero final
    const type = buffer.readUInt16BE(offset);

    return { name, type };
  } catch {
    return null;
  }
}

function buildDNSResponse(query: Buffer, isBlocked: boolean): Buffer {
  const response = Buffer.alloc(512);
  let offset = 0;

  // Header
  response.writeUInt16BE(query.readUInt16BE(0), offset); // ID
  offset += 2;
  response.writeUInt16BE(0x8400, offset); // Flags (response)
  offset += 2;
  response.writeUInt16BE(1, offset); // Questions
  offset += 2;
  response.writeUInt16BE(1, offset); // Answers
  offset += 2;
  response.writeUInt16BE(0, offset); // Authority
  offset += 2;
  response.writeUInt16BE(0, offset); // Additional
  offset += 2;

  // Copy question section
  let qOffset = 12;
  let qLength = query.length;

  while (qOffset < qLength && query[qOffset] !== 0) {
    qOffset++;
  }
  qOffset += 5; // Skip zero + type + class

  query.copy(response, offset, 12, qOffset);
  offset += qOffset - 12;

  // Answer section
  const questionLen = offset - 12;
  response.writeUInt16BE(0xc00c, offset); // Pointer to question
  offset += 2;
  response.writeUInt16BE(1, offset); // Type A
  offset += 2;
  response.writeUInt16BE(1, offset); // Class IN
  offset += 2;
  response.writeUInt32BE(300, offset); // TTL
  offset += 4;
  response.writeUInt16BE(4, offset); // RDLength
  offset += 2;

  if (isBlocked) {
    response.writeUInt32BE(0x7f000001, offset); // 127.0.0.1
  } else {
    response.writeUInt32BE(0x08080808, offset); // 8.8.8.8 (Google DNS)
  }
  offset += 4;

  return response.slice(0, offset);
}

export function startDnsServer() {
  const server = dgram.createSocket("udp4");
  const DNS_PORT = 5353;

  server.on("message", async (msg: Buffer, rinfo: dgram.RemoteInfo) => {
    try {
      await updateBlockedDomainsCache();

      const query = parseQuery(msg);
      if (!query) {
        return; // Query inválida
      }

      const isBlocked = isDomainBlocked(query.name);
      const response = buildDNSResponse(msg, isBlocked);

      const status = isBlocked ? "🚫 BLOQUEADO" : "✓ PERMITIDO";
      console.log(`[DNS] ${status}: ${query.name}`);

      server.send(response, 0, response.length, rinfo.port, rinfo.address);
    } catch (error) {
      console.error("[DNS] Erro ao processar query:", error);
    }
  });

  server.bind(DNS_PORT);
  console.log(`✅ [DNS] Servidor DNS rodando na porta ${DNS_PORT}/UDP`);
  console.log(`📝 [DNS] Configure seu DNS para: 127.0.0.1:${DNS_PORT}`);

  return server;
}
