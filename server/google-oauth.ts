import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import { hashPassword } from "./auth-utils";
import type { User } from "@shared/schema";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
  );
}

export function setupGoogleOAuth() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL || "http://localhost:5000"}/api/auth/google/callback`,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          let user = await storage.getUserByEmail(profile.emails?.[0]?.value!);

          if (!user) {
            // Create new user from Google profile
            const email = profile.emails?.[0]?.value!;
            const firstName = profile.name?.givenName || "User";
            const lastName = profile.name?.familyName || "Google";

            user = await storage.createUser({
              email,
              firstName,
              lastName,
              googleId: profile.id,
              profileImageUrl: profile.photos?.[0]?.value,
              role: "user",
            });

            // Create tenant for the user
            const slug = `${firstName.toLowerCase()}-${user.id.substring(0, 8)}`;

            await storage.createTenant({
              name: `${firstName} ${lastName}`,
              slug,
              ownerId: user.id,
              isActive: true,
              subscriptionStatus: "trial",
            });
          } else if (!user.googleId) {
            // Link Google account to existing user
            await storage.updateUser(user.id, {
              googleId: profile.id,
            });
          }

          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
