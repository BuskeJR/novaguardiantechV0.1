import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  tenants,
  domainRules,
  ipWhitelist,
  auditLogs,
  passwordResetTokens,
  type User,
  type UpsertUser,
  type Tenant,
  type InsertTenant,
  type DomainRule,
  type InsertDomainRule,
  type UpdateDomainRule,
  type IpWhitelist,
  type InsertIpWhitelist,
  type AuditLog,
  type InsertAuditLog,
  type PasswordResetToken,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Tenant methods
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantByOwnerId(ownerId: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | undefined>;

  // Domain rule methods
  getDomainRulesByTenantId(tenantId: string): Promise<DomainRule[]>;
  getAllDomainRules(): Promise<DomainRule[]>;
  getDomainRule(id: string): Promise<DomainRule | undefined>;
  createDomainRule(rule: InsertDomainRule): Promise<DomainRule>;
  updateDomainRule(id: string, data: UpdateDomainRule): Promise<DomainRule | undefined>;
  deleteDomainRule(id: string): Promise<boolean>;

  // IP whitelist methods
  getIpWhitelistByTenantId(tenantId: string): Promise<IpWhitelist[]>;
  getIpWhitelist(id: string): Promise<IpWhitelist | undefined>;
  createIpWhitelist(ip: InsertIpWhitelist): Promise<IpWhitelist>;
  deleteIpWhitelist(id: string): Promise<boolean>;

  // Audit log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByTenantId(tenantId: string, limit?: number): Promise<AuditLog[]>;

  // Password reset methods
  createPasswordResetToken(userId: string, resetCode: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(userId: string, resetCode: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(tokenId: string): Promise<boolean>;
  deleteExpiredPasswordResetTokens(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Tenant methods
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return tenant;
  }

  async getTenantByOwnerId(ownerId: string): Promise<Tenant | undefined> {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.ownerId, ownerId))
      .limit(1);
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(insertTenant).returning();
    return tenant;
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | undefined> {
    const [tenant] = await db
      .update(tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  // Domain rule methods
  async getDomainRulesByTenantId(tenantId: string): Promise<DomainRule[]> {
    return await db
      .select()
      .from(domainRules)
      .where(eq(domainRules.tenantId, tenantId))
      .orderBy(desc(domainRules.createdAt));
  }

  async getAllDomainRules(): Promise<DomainRule[]> {
    return await db
      .select()
      .from(domainRules)
      .orderBy(desc(domainRules.createdAt));
  }

  async getDomainRule(id: string): Promise<DomainRule | undefined> {
    const [rule] = await db.select().from(domainRules).where(eq(domainRules.id, id)).limit(1);
    return rule;
  }

  async createDomainRule(insertRule: InsertDomainRule): Promise<DomainRule> {
    const [rule] = await db.insert(domainRules).values(insertRule as any).returning();
    return rule;
  }

  async updateDomainRule(
    id: string,
    data: UpdateDomainRule
  ): Promise<DomainRule | undefined> {
    const [rule] = await db
      .update(domainRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(domainRules.id, id))
      .returning();
    return rule;
  }

  async deleteDomainRule(id: string): Promise<boolean> {
    const result = await db.delete(domainRules).where(eq(domainRules.id, id)).returning();
    return result.length > 0;
  }

  // IP whitelist methods
  async getIpWhitelistByTenantId(tenantId: string): Promise<IpWhitelist[]> {
    return await db
      .select()
      .from(ipWhitelist)
      .where(eq(ipWhitelist.tenantId, tenantId))
      .orderBy(desc(ipWhitelist.createdAt));
  }

  async getIpWhitelist(id: string): Promise<IpWhitelist | undefined> {
    const [ip] = await db.select().from(ipWhitelist).where(eq(ipWhitelist.id, id)).limit(1);
    return ip;
  }

  async createIpWhitelist(insertIp: InsertIpWhitelist): Promise<IpWhitelist> {
    const [ip] = await db.insert(ipWhitelist).values(insertIp as any).returning();
    return ip;
  }

  async deleteIpWhitelist(id: string): Promise<boolean> {
    const result = await db.delete(ipWhitelist).where(eq(ipWhitelist.id, id)).returning();
    return result.length > 0;
  }

  // Audit log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(insertLog).returning();
    return log;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getAuditLogsByTenantId(tenantId: string, limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // Password reset methods
  async createPasswordResetToken(userId: string, resetCode: string, expiresAt: Date): Promise<PasswordResetToken> {
    // Delete old tokens first
    await this.deleteExpiredPasswordResetTokens(userId);
    
    const [token] = await db
      .insert(passwordResetTokens)
      .values({ userId, resetCode, expiresAt, isUsed: false })
      .returning();
    return token;
  }

  async getPasswordResetToken(userId: string, resetCode: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          eq(passwordResetTokens.resetCode, resetCode),
          eq(passwordResetTokens.isUsed, false)
        )
      )
      .limit(1);
    return token;
  }

  async markPasswordResetTokenAsUsed(tokenId: string): Promise<boolean> {
    const [token] = await db
      .update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.id, tokenId))
      .returning();
    return !!token;
  }

  async deleteExpiredPasswordResetTokens(userId: string): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));
  }
}

export const storage = new DatabaseStorage();
