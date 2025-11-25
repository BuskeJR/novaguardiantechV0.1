import { db } from "./db";
import { users, tenants, domainRules, ipWhitelist, auditLogs } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Create admin user
    const adminExists = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@novaguardian.com"))
      .limit(1);

    let adminUser = adminExists[0];
    if (!adminUser) {
      const [newAdmin] = await db
        .insert(users)
        .values({
          email: "admin@novaguardian.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          profileImageUrl: null,
          googleId: null,
          passwordHash: "$2b$10$eGXSoXsmxCCegw0DhDoA9uFKm0sDM3iAE.Zr6kqsxEwlkpl1/0wDC",
          isActive: true,
        })
        .returning();
      adminUser = newAdmin;
    }

    console.log("✅ Admin user created:", adminUser?.email);

    // Create regular user
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.email, "user@example.com"))
      .limit(1);

    let regularUser = userExists[0];
    if (!regularUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: "user@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "user",
          profileImageUrl: null,
          googleId: null,
          passwordHash: "$2b$10$eGXSoXsmxCCegw0DhDoA9uFKm0sDM3iAE.Zr6kqsxEwlkpl1/0wDC",
          isActive: true,
        })
        .returning();
      regularUser = newUser;
    }

    console.log("✅ Regular user created:", regularUser?.email);

    // Create tenant for regular user
    const tenantExists = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, "demo-company"))
      .limit(1);

    let existingTenant = tenantExists[0];
    if (!existingTenant) {
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: "Demo Company",
          slug: "demo-company",
          ownerId: regularUser!.id,
          isActive: true,
          publicIp: "203.0.113.10",
          subscriptionStatus: "active",
          currentPlan: "trial",
          maxDevices: 5,
          stripeCustomerId: null,
          mercadopagoCustomerId: null,
        })
        .returning();
      existingTenant = newTenant;
    }

    console.log("✅ Tenant created:", existingTenant?.name);

    // Add sample blocked domains
    const domainCount = await db
      .select()
      .from(domainRules)
      .where(eq(domainRules.tenantId, existingTenant!.id));

    let domainsAdded = 0;
    if (domainCount.length === 0) {
      const [domain1, domain2, domain3] = await db
        .insert(domainRules)
        .values([
          {
            tenantId: existingTenant!.id,
            domain: "facebook.com",
            kind: "exact",
            status: "active",
            reason: "Social media blocking policy",
            createdBy: regularUser!.id,
          },
          {
            tenantId: existingTenant!.id,
            domain: "instagram.com",
            kind: "exact",
            status: "active",
            reason: "Social media blocking policy",
            createdBy: regularUser!.id,
          },
          {
            tenantId: existingTenant!.id,
            domain: ".*\\.gambling\\..*",
            kind: "regex",
            status: "active",
            reason: "Block all gambling sites",
            createdBy: regularUser!.id,
          },
        ])
        .returning();
      domainsAdded = [domain1, domain2, domain3].filter(d => !!d).length;
    }

    console.log("✅ Sample domains added:", domainsAdded || "already exists");

    // Add sample IP whitelist
    const ipCount = await db
      .select()
      .from(ipWhitelist)
      .where(eq(ipWhitelist.tenantId, existingTenant!.id));

    let ipsAdded = 0;
    if (ipCount.length === 0) {
      const [ip1, ip2] = await db
        .insert(ipWhitelist)
        .values([
          {
            tenantId: existingTenant!.id,
            ipAddress: "192.168.1.1",
            label: "Office Router",
            createdBy: regularUser!.id,
          },
          {
            tenantId: existingTenant!.id,
            ipAddress: "10.0.0.1",
            label: "VPN Gateway",
            createdBy: regularUser!.id,
          },
        ])
        .returning();
      ipsAdded = [ip1, ip2].filter(ip => !!ip).length;
    }

    console.log("✅ Sample IP whitelist added:", ipsAdded || "already exists");

    // Add audit log
    await db
      .insert(auditLogs)
      .values({
        actorUserId: adminUser!.id,
        tenantId: existingTenant!.id,
        action: "database_seeded",
        resourceType: "system",
        resourceId: null,
        payloadJson: { message: "Database seed completed" },
      })
      .catch(() => {
        // Ignore if already exists
      });

    console.log("✅ Audit log created");

    const result = {
      data: {
        admin: adminUser?.email,
        user: regularUser?.email,
        tenant: existingTenant?.name,
        domains: domainsAdded || 3,
        ips: ipsAdded || 2,
      },
    };

    console.log("🎉 Seeding completed successfully!");
    return result;
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run seed if executed directly
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = import.meta.dirname || __filename.split("/").slice(0, -1).join("/");

if (process.argv[1] === __filename) {
  seedDatabase()
    .then(() => {
      console.log("✨ Database is ready!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
