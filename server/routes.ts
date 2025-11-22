import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertDomainRuleSchema, insertIpWhitelistSchema, insertTenantSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import { stripe, PRICING_PLANS } from "./stripe-config";

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

// Signup schema
const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Primeiro nome obrigatório"),
  lastName: z.string().min(1, "Sobrenome obrigatório"),
  tenantName: z.string().min(1, "Nome da empresa obrigatório"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== AUTH ROUTES =====
  
  app.get("/api/auth/user", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    res.json(user);
  });

  // Signup endpoint
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const validated = signupSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Create new user
      const newUser = await storage.createUser({
        email: validated.email,
        firstName: validated.firstName,
        lastName: validated.lastName,
        role: "user",
      });

      // Create tenant for the user
      const slug = validated.tenantName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .substring(0, 50);

      const tenant = await storage.createTenant({
        name: validated.tenantName,
        slug: `${slug}-${newUser.id.substring(0, 8)}`,
        ownerId: newUser.id,
        isActive: true,
        subscriptionStatus: "trial",
      });

      // Log signup
      await createAuditLog(
        newUser.id,
        tenant.id,
        "user_signup",
        "user",
        newUser.id,
        { email: validated.email }
      );

      res.status(201).json({
        userId: newUser.id,
        email: newUser.email,
        tenantId: tenant.id,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validação falhou", details: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
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

  // ===== PRICING & CHECKOUT ROUTES =====

  app.get("/api/pricing", async (req: Request, res: Response) => {
    try {
      res.json(PRICING_PLANS);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe checkout session
  app.post("/api/checkout", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(400).json({ 
          error: "Stripe não configurado. Usando modo desenvolvimento com versão gratuita." 
        });
      }

      const user = req.user as User;
      const tenant = await getUserTenant(user.id);
      const { plan } = req.body;

      if (!plan || !(plan in PRICING_PLANS)) {
        return res.status(400).json({ error: "Plano inválido" });
      }

      const planData = PRICING_PLANS[plan as keyof typeof PRICING_PLANS];

      if (plan === "free") {
        // Free plan - just update subscription status
        await storage.updateTenant(tenant.id, {
          subscriptionStatus: "active",
        });

        return res.json({ success: true, planUpgraded: "free" });
      }

      // Get or create Stripe customer
      let customerId = tenant.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { tenantId: tenant.id, userId: user.id },
        });
        customerId = customer.id;

        await storage.updateTenant(tenant.id, {
          stripeCustomerId: customerId,
        });
      }

      // Create checkout session for paid plans
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: planData.stripePriceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.BASE_URL || "http://localhost:5000"}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL || "http://localhost:5000"}/pricing?canceled=true`,
        metadata: { tenantId: tenant.id, plan },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe webhook
  app.post("/api/webhook/stripe", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(400).json({ error: "Stripe not configured" });
      }

      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn("STRIPE_WEBHOOK_SECRET not configured");
        return res.status(400).json({ error: "Webhook not configured" });
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body as any,
          sig,
          webhookSecret
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Handle subscription events
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const { tenantId } = session.metadata;

        if (tenantId) {
          await storage.updateTenant(tenantId, {
            subscriptionStatus: "active",
          });

          await createAuditLog(
            null,
            tenantId,
            "subscription_upgraded",
            "subscription",
            tenantId,
            { plan: session.metadata.plan }
          );
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        // Find tenant by customer ID and cancel subscription
        const tenants = await storage.getAllTenants();
        const tenant = tenants.find(t => t.stripeCustomerId === customerId);

        if (tenant) {
          await storage.updateTenant(tenant.id, {
            subscriptionStatus: "canceled",
          });

          await createAuditLog(
            null,
            tenant.id,
            "subscription_canceled",
            "subscription",
            tenant.id
          );
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
