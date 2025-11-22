import { db } from "./db";
import { users, tenants, domainRules, ipWhitelist, auditLogs } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        id: "admin-user-123",
        email: "admin@novaguardian.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      })
      .onConflictDoNothing()
      .returning();

    console.log("✅ Admin user created:", adminUser?.email || "already exists");

    // Create regular user
    const [regularUser] = await db
      .insert(users)
      .values({
        id: "user-123",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user",
      })
      .onConflictDoNothing()
      .returning();

    console.log("✅ Regular user created:", regularUser?.email || "already exists");

    // Create tenant for regular user
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: "Demo Company",
        slug: "demo-company",
        ownerId: "user-123",
        isActive: true,
        publicIp: "203.0.113.10",
        subscriptionStatus: "active",
      })
      .onConflictDoNothing()
      .returning();

    console.log("✅ Tenant created:", tenant?.name || "already exists");

    // Add sample blocked domains if tenant exists or was just created
    const existingTenant = tenant || (await db.select().from(tenants).where(eq => eq.slug).limit(1))[0];
    
    if (existingTenant) {
      await db
        .insert(domainRules)
        .values([
          {
            tenantId: existingTenant.id,
            domain: "facebook.com",
            kind: "exact",
            status: "active",
            reason: "Social media blocking policy",
            createdBy: "user-123",
          },
          {
            tenantId: existingTenant.id,
            domain: "instagram.com",
            kind: "exact",
            status: "active",
            reason: "Social media blocking policy",
            createdBy: "user-123",
          },
          {
            tenantId: existingTenant.id,
            domain: ".*\\.gambling\\..*",
            kind: "regex",
            status: "active",
            reason: "Block all gambling sites",
            createdBy: "user-123",
          },
        ])
        .onConflictDoNothing();

      console.log("✅ Sample domains added");

      // Add sample IP whitelist
      await db
        .insert(ipWhitelist)
        .values([
          {
            tenantId: existingTenant.id,
            ipAddress: "192.168.1.1",
            label: "Office Router",
            createdBy: "user-123",
          },
          {
            tenantId: existingTenant.id,
            ipAddress: "10.0.0.1",
            label: "VPN Gateway",
            createdBy: "user-123",
          },
        ])
        .onConflictDoNothing();

      console.log("✅ Sample IP whitelist added");

      // Add audit log
      await db
        .insert(auditLogs)
        .values({
          actorUserId: "admin-user-123",
          tenantId: existingTenant.id,
          action: "database_seeded",
          resourceType: "system",
          resourceId: null,
          payloadJson: { message: "Initial database seed completed" },
        })
        .onConflictDoNothing();

      console.log("✅ Audit log created");
    }

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("✨ Database is ready!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
