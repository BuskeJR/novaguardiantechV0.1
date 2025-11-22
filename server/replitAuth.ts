import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import type { Express, Request } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const ISSUER_URL = process.env.REPLIT_DEPLOYMENT
  ? "https://replit.com/oidc"
  : process.env.ISSUER_URL || "https://replit.com/oidc";

let isPassportInitialized = false;

function isReplitRequest(req: Request): boolean {
  return req.get("X-Replit-User-Id") !== undefined;
}

async function setupReplit(app: Express) {
  if (isPassportInitialized) {
    return;
  }

  // Simple OIDC endpoints (well-known from Replit)
  const authorizationURL = `${ISSUER_URL}/authorize`;
  const tokenURL = `${ISSUER_URL}/token`;
  const userInfoURL = `${ISSUER_URL}/userinfo`;

  passport.use(
    "replit",
    new OAuth2Strategy(
      {
        authorizationURL,
        tokenURL,
        clientID: "replit",
        clientSecret: "replit",
        callbackURL: "/api/auth/callback",
        scope: "openid email profile",
        state: true,
        passReqToCallback: true,
      },
      async (_req, _accessToken, _refreshToken, params, _profile, done) => {
        try {
          // Fetch user info using the id_token
          const userInfoResponse = await fetch(userInfoURL, {
            headers: {
              Authorization: `Bearer ${params.id_token}`,
            },
          });

          if (!userInfoResponse.ok) {
            throw new Error("Failed to fetch user info");
          }

          const userInfo = (await userInfoResponse.json()) as {
            sub: string;
            email?: string;
            given_name?: string;
            family_name?: string;
            picture?: string;
          };

          // Upsert user in database
          const existingUsers = await db
            .select()
            .from(users)
            .where(eq(users.id, userInfo.sub))
            .limit(1);

          let user;
          if (existingUsers.length > 0) {
            // Update existing user
            const [updated] = await db
              .update(users)
              .set({
                email: userInfo.email,
                firstName: userInfo.given_name,
                lastName: userInfo.family_name,
                profileImageUrl: userInfo.picture,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userInfo.sub))
              .returning();
            user = updated;
          } else {
            // Create new user
            const [created] = await db
              .insert(users)
              .values({
                id: userInfo.sub,
                email: userInfo.email,
                firstName: userInfo.given_name,
                lastName: userInfo.family_name,
                profileImageUrl: userInfo.picture,
                role: "user", // Default role
              })
              .returning();
            user = created;
          }

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );

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

  app.use(passport.initialize());
  app.use(passport.session());

  // Login route
  app.get("/api/login", (req, res, next) => {
    if (isReplitRequest(req)) {
      // Direct Replit workspace login
      const userId = req.get("X-Replit-User-Id");
      const userEmail = req.get("X-Replit-User-Email") || undefined;
      const userFirstName = req.get("X-Replit-User-Name") || undefined;
      const userProfileImage = req.get("X-Replit-User-Profile-Image") || undefined;

      if (!userId) {
        return res.status(401).send("Unauthorized");
      }

      // Upsert user for Replit workspace
      db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then((existingUsers) => {
          if (existingUsers.length > 0) {
            // Update
            return db
              .update(users)
              .set({
                email: userEmail,
                firstName: userFirstName,
                profileImageUrl: userProfileImage,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId))
              .returning();
          } else {
            // Insert
            return db
              .insert(users)
              .values({
                id: userId,
                email: userEmail,
                firstName: userFirstName,
                profileImageUrl: userProfileImage,
                role: "user",
              })
              .returning();
          }
        })
        .then(([user]) => {
          req.login(user, (err) => {
            if (err) {
              return res.status(500).send("Login failed");
            }
            res.redirect("/");
          });
        })
        .catch((err) => {
          console.error("User upsert error:", err);
          res.status(500).send("Internal server error");
        });
    } else {
      // OAuth2 flow for deployed apps
      passport.authenticate("replit", {
        successReturnToOrRedirect: "/",
        failureRedirect: "/",
      })(req, res, next);
    }
  });

  // OAuth callback
  app.get(
    "/api/auth/callback",
    passport.authenticate("replit", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/",
    })
  );

  // Logout
  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  isPassportInitialized = true;
}

export default setupReplit;
