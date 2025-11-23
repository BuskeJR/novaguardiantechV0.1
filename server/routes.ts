import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertDomainRuleSchema, insertIpWhitelistSchema, insertTenantSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import { hashPassword, comparePassword, getPasswordErrors } from "./auth-utils";
import { sendPasswordResetEmail } from "./email";
import { createBlockRule, deleteBlockRule, getZoneInfo, listRules } from "./cloudflare";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

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
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

// Login schema
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== PASSPORT LOCAL STRATEGY =====
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email: string, password: string, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Email ou senha inválidos" });
          }

          // Validate user is active
          if (user.isActive === false) {
            return done(null, false, { message: "Usuário desativado. Contate o administrador" });
          }

          const isValid = await comparePassword(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Email ou senha inválidos" });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // ===== AUTH ROUTES =====
  
  app.get("/api/auth/user", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as User;
    res.json(user);
  });

  // Signup endpoint
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const validated = signupSchema.parse(req.body);
      
      // Validate password strength
      const passwordErrors = getPasswordErrors(validated.password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({ 
          error: "Senha fraca", 
          details: passwordErrors 
        });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Hash password
      const passwordHash = await hashPassword(validated.password);

      // Create new user
      const newUser = await storage.createUser({
        email: validated.email,
        firstName: validated.firstName,
        lastName: validated.lastName,
        passwordHash,
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
        subscriptionStatus: "active",
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

  // Email/Password login endpoint
  app.post("/api/auth/login-password", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({ error: info?.message || "Email ou senha inválidos" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Erro ao criar sessão" });
        }

        res.json({
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      });
    })(req, res, next);
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
          subscriptionStatus: "active",
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
      } as any);

      // Try to sync with Cloudflare if zone is configured
      if (tenant.cloudflareZoneId && domain.status === "active") {
        const cfResult = await createBlockRule(
          tenant.cloudflareZoneId,
          domain.domain,
          `BLOCK-${domain.domain}`
        );
        
        if (!cfResult.success) {
          console.warn(`Cloudflare sync warning for domain ${domain.domain}: ${cfResult.error}`);
          // Don't fail the request, just log the warning
        }
      }

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

      // Note: Cloudflare rule deletion would require storing the rule ID in our database
      // For now, the rule will remain in Cloudflare but be marked inactive here
      // TODO: Add cloudflareRuleId field to domainRules table for cleanup

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
      } as any);

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

  // ===== USER MANAGEMENT ROUTES (ADMIN) =====

  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { email, firstName, lastName, password, role } = req.body;

      // Validate input
      if (!email || !firstName || !lastName || !password || !role) {
        return res.status(400).json({ error: "Campos obrigatórios: email, firstName, lastName, password, role" });
      }

      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({ error: "Role deve ser 'admin' ou 'user'" });
      }

      // Check if user already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Validate and hash password
      const passwordErrors = getPasswordErrors(password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({ error: "Senha fraca", details: passwordErrors });
      }

      const passwordHash = await hashPassword(password);

      // Create user
      const newUser = await storage.createUser({
        email,
        firstName,
        lastName,
        passwordHash,
        role,
        profileImageUrl: null,
        googleId: null,
      });

      // Create tenant if role is user
      if (role === "user") {
        await storage.createTenant({
          name: `${firstName} ${lastName}`,
          slug: email.split("@")[0],
          ownerId: newUser.id,
          isActive: true,
          publicIp: null,
          dnsConfigPath: null,
          stripeCustomerId: null,
          subscriptionStatus: "trial",
        });
      }

      await createAuditLog(
        user.id,
        null,
        "user_created",
        "user",
        newUser.id,
        { email, role }
      );

      res.status(201).json(newUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({ error: "Campo 'isActive' obrigatório" });
      }

      const updated = await storage.updateUser(id, { isActive });
      if (!updated) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      await createAuditLog(
        user.id,
        null,
        "user_updated",
        "user",
        id,
        { isActive }
      );

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (id === user.id) {
        return res.status(400).json({ error: "Você não pode deletar sua própria conta" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      await createAuditLog(
        user.id,
        null,
        "user_deleted",
        "user",
        id,
        {}
      );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== PASSWORD RESET ROUTES =====

  app.post("/api/auth/request-reset", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists (security best practice)
        return res.json({ success: true, message: "Se o email existe, você receberá um código de reset" });
      }

      // Generate 6-digit code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await storage.createPasswordResetToken(user.id, resetCode, expiresAt);

      // Send email with reset code
      try {
        await sendPasswordResetEmail(email, resetCode, user.firstName || undefined);
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
        // Still return success even if email fails (in dev mode)
        if (process.env.NODE_ENV !== "production") {
          console.log(`[DEV] Reset code for ${email}: ${resetCode}`);
        }
      }

      res.json({ 
        success: true, 
        message: "Código de reset enviado para seu email"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/verify-reset-code", async (req: Request, res: Response) => {
    try {
      const { email, resetCode } = req.body;

      if (!email || !resetCode) {
        return res.status(400).json({ error: "Email e código obrigatórios" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "Email não encontrado" });
      }

      const token = await storage.getPasswordResetToken(user.id, resetCode);
      if (!token) {
        return res.status(400).json({ error: "Código inválido ou expirado" });
      }

      // Check if expired
      if (token.expiresAt < new Date()) {
        return res.status(400).json({ error: "Código expirado" });
      }

      res.json({ success: true, tokenId: token.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, resetCode, newPassword } = req.body;

      if (!email || !resetCode || !newPassword) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "Email não encontrado" });
      }

      const token = await storage.getPasswordResetToken(user.id, resetCode);
      if (!token) {
        return res.status(400).json({ error: "Código inválido" });
      }

      // Validate password
      const passwordErrors = getPasswordErrors(newPassword);
      if (passwordErrors.length > 0) {
        return res.status(400).json({ error: "Senha fraca", details: passwordErrors });
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update password
      await storage.updateUser(user.id, { passwordHash });

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token.id);

      // Log the action
      await createAuditLog(
        user.id,
        null,
        "password_reset",
        "user",
        user.id,
        { email }
      );

      res.json({ success: true, message: "Senha alterada com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== LOGOUT =====
  
  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao sair" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.redirect("/login");
      }
      res.redirect("/login");
    });
  });

  // ===== TENANT SETTINGS (USER) =====
  
  app.patch("/api/tenant/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const { publicIp } = req.body;

      const tenant = await getUserTenant(user.id);
      
      const updated = await storage.updateTenant(tenant.id, {
        publicIp: publicIp || null,
      });

      await createAuditLog(
        user.id,
        tenant.id,
        "tenant_updated",
        "tenant",
        tenant.id,
        { publicIp }
      );

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== CLOUDFLARE INTEGRATION ROUTES =====

  // Test Cloudflare connection and get zone info
  app.post("/api/cloudflare/test", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenant = await getUserTenant(user.id);
      const { zoneId } = req.body;

      if (!zoneId) {
        return res.status(400).json({ error: "Zone ID obrigatório" });
      }

      const result = await getZoneInfo(zoneId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        zone: result.zone,
        message: "Conexão com Cloudflare bem-sucedida!"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Configure Cloudflare Zone ID for tenant
  app.post("/api/cloudflare/configure", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenant = await getUserTenant(user.id);
      const { zoneId } = req.body;

      // Only owner or admin can configure Cloudflare
      if (user.id !== tenant.ownerId && user.role !== "admin") {
        return res.status(403).json({ error: "Apenas o proprietário do tenant ou administrador pode configurar Cloudflare" });
      }

      if (!zoneId) {
        return res.status(400).json({ error: "Zone ID obrigatório" });
      }

      // Verify zone exists and is accessible
      const zoneInfo = await getZoneInfo(zoneId);
      if (!zoneInfo.success) {
        return res.status(400).json({ error: `Zona inválida: ${zoneInfo.error}` });
      }

      // Update tenant with Cloudflare Zone ID
      const updated = await storage.updateTenant(tenant.id, {
        cloudflareZoneId: zoneId,
      });

      await createAuditLog(
        user.id,
        tenant.id,
        "cloudflare_configured",
        "tenant",
        tenant.id,
        { 
          zoneId,
          zoneName: zoneInfo.zone?.name
        }
      );

      res.json({
        success: true,
        tenant: updated,
        message: `Cloudflare configurado para zona: ${zoneInfo.zone?.name}`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List all Cloudflare rules for the tenant
  app.get("/api/cloudflare/rules", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenant = await getUserTenant(user.id);

      if (!tenant.cloudflareZoneId) {
        return res.status(400).json({ error: "Cloudflare não configurado para este tenant" });
      }

      const result = await listRules(tenant.cloudflareZoneId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        rules: result.rules,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DNS Status Page - HTML Visual
  app.get("/dns-status", async (req: Request, res: Response) => {
    try {
      const tenants = await storage.getAllTenants();
      let allBlockedDomains: string[] = [];

      for (const tenant of tenants) {
        if (tenant.isActive) {
          const rules = await storage.getDomainRulesByTenantId(tenant.id);
          allBlockedDomains = allBlockedDomains.concat(
            rules
              .filter(r => r.status === "active")
              .map(r => r.domain.toLowerCase())
          );
        }
      }

      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Status DNS - NovaGuardian</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 100%;
      padding: 40px;
    }
    h1 { color: #333; margin-bottom: 10px; font-size: 28px; }
    .status { 
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 30px;
    }
    .domains-section {
      background: #f3f4f6;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .domains-section h2 {
      font-size: 16px;
      color: #666;
      margin-bottom: 15px;
    }
    .domains-list {
      list-style: none;
    }
    .domains-list li {
      background: white;
      padding: 12px 16px;
      border-left: 4px solid #ef4444;
      margin-bottom: 10px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      color: #333;
    }
    .empty {
      color: #999;
      font-style: italic;
      padding: 20px;
      text-align: center;
    }
    .test-form {
      margin-top: 30px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
    .test-form h2 {
      font-size: 16px;
      color: #333;
      margin-bottom: 15px;
    }
    .form-group {
      display: flex;
      gap: 10px;
    }
    input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }
    button {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }
    button:hover { background: #5568d3; }
    .result {
      margin-top: 15px;
      padding: 15px;
      border-radius: 6px;
      display: none;
    }
    .result.success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .result.error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛡️ NovaGuardian DNS Status</h1>
    <span class="status">✅ Sistema Operacional</span>

    <div class="domains-section">
      <h2>Domínios Bloqueados no Sistema</h2>
      <ul class="domains-list">
        ${allBlockedDomains.length > 0 
          ? allBlockedDomains.map(d => `<li>🚫 ${d}</li>`).join('')
          : '<li class="empty">Nenhum domínio bloqueado</li>'
        }
      </ul>
      <p style="text-align: center; color: #666; font-size: 14px; margin-top: 10px;">
        <strong>${allBlockedDomains.length}</strong> domínio(s) bloqueado(s)
      </p>
    </div>

    <div class="test-form">
      <h2>Teste um Domínio</h2>
      <div class="form-group">
        <input type="text" id="domainInput" placeholder="ex: tiktok.com" value="google.com">
        <button onclick="testDomain()">Testar</button>
      </div>
      <div class="result" id="result"></div>
    </div>
  </div>

  <script>
    async function testDomain() {
      const domain = document.getElementById('domainInput').value;
      if (!domain) { alert('Digite um domínio'); return; }

      const resultDiv = document.getElementById('result');
      resultDiv.style.display = 'none';

      try {
        const res = await fetch('/api/dns/test-public?domain=' + encodeURIComponent(domain));
        const data = await res.json();
        
        resultDiv.className = 'result ' + (data.blocked ? 'error' : 'success');
        resultDiv.innerHTML = '<strong>' + data.message + '</strong>';
        resultDiv.style.display = 'block';
      } catch (err) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = '<strong>❌ Erro:</strong> ' + err.message;
        resultDiv.style.display = 'block';
      }
    }

    document.getElementById('domainInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') testDomain();
    });

    // Teste automático ao carregar
    window.addEventListener('load', function() {
      setTimeout(() => testDomain(), 500);
    });
  </script>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DNS Test endpoint - PUBLIC - Testa se domínios estão bloqueados
  app.get("/api/dns/test-public", async (req: Request, res: Response) => {
    try {
      const { domain } = req.query;

      // Busca TODOS os domínios bloqueados de TODOS os tenants
      const tenants = await storage.getAllTenants();
      let allBlockedDomains: string[] = [];

      for (const tenant of tenants) {
        if (tenant.isActive) {
          const rules = await storage.getDomainRulesByTenantId(tenant.id);
          allBlockedDomains = allBlockedDomains.concat(
            rules
              .filter(r => r.status === "active")
              .map(r => r.domain.toLowerCase())
          );
        }
      }

      // Se não mandou domínio, retorna lista de TODOS os bloqueados
      if (!domain) {
        return res.json({
          success: true,
          totalBlocked: allBlockedDomains.length,
          blockedDomains: allBlockedDomains,
          message: `Total de ${allBlockedDomains.length} domínios bloqueados no sistema`,
        });
      }

      // Testa um domínio específico
      const normalizedDomain = (domain as string).toLowerCase();
      const isBlocked = allBlockedDomains.some(blocked => {
        if (blocked === normalizedDomain) return true;
        // Wildcard: se tiktok.com está bloqueado, www.tiktok.com também é
        if (normalizedDomain.endsWith(blocked) && normalizedDomain.split(".").length > blocked.split(".").length) {
          return true;
        }
        return false;
      });

      res.json({
        success: true,
        domain: normalizedDomain,
        blocked: isBlocked,
        totalBlockedInSystem: allBlockedDomains.length,
        message: isBlocked 
          ? `✅ BLOQUEADO: ${domain} está na lista de bloqueio`
          : `❌ NÃO BLOQUEADO: ${domain} pode ser acessado`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DNS Test endpoint - Com autenticação para tenant específico
  app.get("/api/dns/test", requireAuth, async (req: Request, res: Response) => {
    try {
      const { domain } = req.query;

      if (!domain || typeof domain !== "string") {
        return res.status(400).json({ error: "Domínio obrigatório" });
      }

      const user = req.user as User;
      const tenant = await getUserTenant(user.id);

      // Busca domínios bloqueados do tenant
      const rules = await storage.getDomainRulesByTenantId(tenant.id);
      const normalizedDomain = domain.toLowerCase();
      
      // Verifica se está bloqueado (exato ou wildcard)
      const isBlocked = rules.some(rule => {
        if (rule.status !== "active") return false;
        
        const ruleDomain = rule.domain.toLowerCase();
        if (ruleDomain === normalizedDomain) return true;
        
        // Verificação de wildcard
        if (normalizedDomain.endsWith(ruleDomain) && normalizedDomain.split(".").length > ruleDomain.split(".").length) {
          return true;
        }
        
        return false;
      });

      res.json({
        success: true,
        domain: normalizedDomain,
        blocked: isBlocked,
        totalBlockedInTenant: rules.length,
        message: isBlocked 
          ? `✅ Domínio ${domain} ESTÁ BLOQUEADO pelo NovaGuardian`
          : `❌ Domínio ${domain} NÃO está bloqueado (será resolvido normalmente)`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
