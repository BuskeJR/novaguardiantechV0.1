import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

import { registerRoutes } from "./routes";
import setupReplit from "./replitAuth";
import passport from "passport";
import { setupGoogleOAuth } from "./google-oauth";
import { checkDomainBlocked, extractDomainFromUrl, getClientIpFromRequest } from "./proxy";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Session configuration
const PgSession = connectPgSimple(session);
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: "sessions",
      createTableIfMissing: false, // We'll create via Drizzle
    }),
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Setup Passport serialization
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    done(null, user || null);
  } catch (err) {
    done(err);
  }
});

// Setup Google OAuth
setupGoogleOAuth();

// PROXY BLOCKER MIDDLEWARE - Intercepta requisições HTTP e bloqueia domínios
// Executado ANTES de qualquer rota normal
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Pula requisições que não são pra domínios (API, etc)
    if (req.path.startsWith("/api") || req.path.startsWith("/__")) {
      return next();
    }

    const clientIp = getClientIpFromRequest(req);
    const hostHeader = req.headers.host || "";
    const domain = hostHeader.split(":")[0]; // Remove porta se houver

    // Verifica se este domínio deve ser bloqueado para este IP
    const isBlocked = await checkDomainBlocked(domain, clientIp);

    if (isBlocked) {
      log(`BLOCKED: ${domain} from IP ${clientIp}`, "proxy");
      return res.status(403).json({
        error: "Acesso bloqueado",
        message: `Este domínio (${domain}) está bloqueado para sua rede.`,
        domain,
        ip: clientIp,
      });
    }

    next();
  } catch (error) {
    // Se houver erro, deixa passar (não quer derrubar o servidor)
    log(`Proxy middleware error: ${error}`, "proxy");
    next();
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  // Note: Replit Auth disabled - using custom password + Google OAuth
  // await setupReplit(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
}
