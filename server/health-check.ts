import { db } from "./db";
import { users } from "@shared/schema";

export async function healthCheck(): Promise<{ status: "ok" | "error"; database?: string; timestamp: string }> {
  try {
    // Teste conexão com DB
    const result = await db.select().from(users).limit(1);
    
    return {
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Health check failed:", error);
    return {
      status: "error",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    };
  }
}
