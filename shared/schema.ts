import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// ===== SESSIONS TABLE (Required for Replit Auth) =====
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ===== USERS TABLE (Required for Replit Auth) =====
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"), // Nullable for OAuth-only users
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id").unique(), // For Google OAuth
  role: varchar("role", { length: 20 }).notNull().default("user"), // 'admin' or 'user'
  isActive: boolean("is_active").notNull().default(true), // For admin to deactivate users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  ownedTenants: many(tenants),
  auditLogs: many(auditLogs),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ===== TENANTS/CLIENTS TABLE (Multi-tenant) =====
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true),
  publicIp: varchar("public_ip", { length: 45 }), // IPv4 or IPv6
  stripeCustomerId: varchar("stripe_customer_id"),
  mercadopagoCustomerId: varchar("mercadopago_customer_id"),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("trial"), // trial, active, canceled
  currentPlan: varchar("current_plan", { length: 50 }).default("free"), // free, residencial, plus, pro
  maxDevices: integer("max_devices").default(0), // Limita quantidade de dispositivos por plano
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  owner: one(users, {
    fields: [tenants.ownerId],
    references: [users.id],
  }),
  domains: many(domainRules),
  whitelist: many(ipWhitelist),
  auditLogs: many(auditLogs),
}));

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// ===== DOMAIN RULES TABLE (Blocked domains per tenant) =====
export const domainRules = pgTable("domain_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  kind: varchar("kind", { length: 20 }).notNull().default("exact"), // 'exact' or 'regex'
  status: varchar("status", { length: 20 }).notNull().default("active"), // 'active' or 'inactive'
  reason: text("reason"), // Why this domain is blocked
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const domainRulesRelations = relations(domainRules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [domainRules.tenantId],
    references: [tenants.id],
  }),
  creator: one(users, {
    fields: [domainRules.createdBy],
    references: [users.id],
  }),
}));

export const insertDomainRuleSchema = createInsertSchema(domainRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
  createdBy: true,
});

export const updateDomainRuleSchema = insertDomainRuleSchema.partial();

export type InsertDomainRule = z.infer<typeof insertDomainRuleSchema>;
export type UpdateDomainRule = z.infer<typeof updateDomainRuleSchema>;
export type DomainRule = typeof domainRules.$inferSelect;

// ===== IP WHITELIST TABLE (Allowed IPs per tenant) =====
export const ipWhitelist = pgTable("ip_whitelist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(), // IPv4 or IPv6
  label: varchar("label", { length: 255 }), // Friendly name for this IP
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ipWhitelistRelations = relations(ipWhitelist, ({ one }) => ({
  tenant: one(tenants, {
    fields: [ipWhitelist.tenantId],
    references: [tenants.id],
  }),
  creator: one(users, {
    fields: [ipWhitelist.createdBy],
    references: [users.id],
  }),
}));

export const insertIpWhitelistSchema = createInsertSchema(ipWhitelist).omit({
  id: true,
  createdAt: true,
  tenantId: true,
  createdBy: true,
});

export type InsertIpWhitelist = z.infer<typeof insertIpWhitelistSchema>;
export type IpWhitelist = typeof ipWhitelist.$inferSelect;

// ===== AUDIT LOGS TABLE (Track all actions) =====
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(), // e.g., 'domain_added', 'domain_removed', 'ip_whitelisted'
  resourceType: varchar("resource_type", { length: 50 }), // e.g., 'domain', 'ip', 'tenant'
  resourceId: varchar("resource_id"),
  payloadJson: jsonb("payload_json"), // Additional data about the action
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
}));

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// ===== DNS STATS TABLE (Optional - for dashboard metrics) =====
export const dnsStats = pgTable("dns_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull().defaultNow(),
  totalQueries: integer("total_queries").notNull().default(0),
  blockedQueries: integer("blocked_queries").notNull().default(0),
  allowedQueries: integer("allowed_queries").notNull().default(0),
});

export const dnsStatsRelations = relations(dnsStats, ({ one }) => ({
  tenant: one(tenants, {
    fields: [dnsStats.tenantId],
    references: [tenants.id],
  }),
}));

export type DnsStats = typeof dnsStats.$inferSelect;

// ===== PASSWORD RESET TOKENS TABLE =====
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  resetCode: varchar("reset_code", { length: 6 }).notNull(), // 6-digit code sent via email
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
