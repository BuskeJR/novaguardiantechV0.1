import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertDomainRuleSchema, insertIpWhitelistSchema, insertTenantSchema } from "@shared/schema";
import type { User } from "@shared/schema";

// Middleware to require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Middleware to require admin role
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = req.user as User;
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
}

// Helper to get current user's tenant
async function getUserTenant(userId: string) {
  const tenant = await storage.getTenantByOwnerId(userId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }
  return tenant;
}

// Helper to create audit log
async function createAuditLog(
  userId: string | null,
  tenantId: string | null,
  action: string,
  resourceType: string | null,
  resourceId: string | null,
  payload: any = null
) {
  await storage.createAuditLog({
    actorUserId: userId,
    tenantId,
    action,
    resourceType,
    resourceId,
    payloadJson: payload,
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== AUTH ROUTES =====
  
  app.get("/api/auth/user", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    res.json(user);
  });

  // ===== TENANT ROUTES (USER) =====

  app.get("/api/tenant/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      let tenant = await storage.getTenantByOwnerId(user.id);

      // Auto-create tenant if doesn't exist
      if (!tenant) {
        const slug = `tenant-${user.id.substring(0, 8)}`;
        tenant = await storage.createTenant({
          name: user.firstName || user.email || "My Tenant",
          slug,
          ownerId: user.id,
          isActive: true,
          subscriptionStatus: "trial",
        });

        await createAuditLog(
          user.id,
          tenant.id,
          "tenant_created",
          "tenant",
          tenant.id,
          { slug, name: tenant.name }
        );
      }

      res.json(tenant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== DOMAIN ROUTES =====

  app.get("/api/domains", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenant = await getUserTenant(user.id);
      const domains = await storage.getDomainRulesByTenantId(tenant.id);
      res.json(domains);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/domains", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenant = await getUserTenant(user.id);

      const validated = insertDomainRuleSchema.parse(req.body);
      const domain = await storage.createDomainRule({
        ...validated,
        tenantId: tenant.id,
        createdBy: user.id,
      });

      await createAuditLog(
        user.id,
        tenant.id,
        "domain_added",
        "domain",
        domain.id,
        { domain: domain.domain, kind: domain.kind }
      );

      res.status(201).json(domain);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/domains/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenant = await getUserTenant(user.id);
      const { id } = req.params;

      const existing = await storage.getDomainRule(id);
      if (!existing || existing.tenantId !== tenant.id) {
        return res.status(404).json({ error: "Domain not found" });
      }

      const updated = await storage.updateDomainRule(id, req.body);

      await createAuditLog(
        user.id,
        tenant.id,
        "domain_updated",
        "domain",
        id,
        { changes: req.body }
      );

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/domains/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenant = await getUserTenant(user.id);
      const { id } = req.params;

      const existing = await storage.getDomainRule(id);
      if (!existing || existing.tenantId !== tenant.id) {
        return res.status(404).json({ error: "Domain not found" });
      }

      const success = await storage.deleteDomainRule(id);

      await createAuditLog(
        user.id,
        tenant.id,
        "domain_deleted",
        "domain",
        id,
        { domain: existing.domain }
      );

      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== IP WHITELIST ROUTES =====

  app.get("/api/whitelist", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenant = await getUserTenant(user.id);
      const whitelist = await storage.getIpWhitelistByTenantId(tenant.id);
      res.json(whitelist);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/whitelist", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenant = await getUserTenant(user.id);

      const validated = insertIpWhitelistSchema.parse(req.body);
      const ip = await storage.createIpWhitelist({
        ...validated,
        tenantId: tenant.id,
        createdBy: user.id,
      });

      await createAuditLog(
        user.id,
        tenant.id,
        "ip_whitelisted",
        "ip",
        ip.id,
        { ipAddress: ip.ipAddress, label: ip.label }
      );

      res.status(201).json(ip);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.delete("/api/whitelist/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenant = await getUserTenant(user.id);
      const { id } = req.params;

      const existing = await storage.getIpWhitelist(id);
      if (!existing || existing.tenantId !== tenant.id) {
        return res.status(404).json({ error: "IP not found" });
      }

      const success = await storage.deleteIpWhitelist(id);

      await createAuditLog(
        user.id,
        tenant.id,
        "ip_removed",
        "ip",
        id,
        { ipAddress: existing.ipAddress }
      );

      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== ADMIN ROUTES =====

  app.get("/api/admin/tenants", requireAdmin, async (req: Request, res: Response) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/tenants", requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const validated = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(validated);

      await createAuditLog(
        user.id,
        tenant.id,
        "tenant_created_by_admin",
        "tenant",
        tenant.id,
        { name: tenant.name, slug: tenant.slug }
      );

      res.status(201).json(tenant);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/admin/tenants/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { id } = req.params;

      const updated = await storage.updateTenant(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      await createAuditLog(
        user.id,
        id,
        "tenant_updated",
        "tenant",
        id,
        { changes: req.body }
      );

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/audit-logs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
