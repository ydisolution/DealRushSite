import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import type { Express } from "express";
import memoize from "memoizee";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertSocialUser(claims: any) {
  // Check if user with this email already exists
  const existingUser = claims["email"] ? await storage.getUserByEmail(claims["email"]) : null;
  
  const isAdminEmail = claims["email"] === "ydisolution@gmail.com";
  
  if (existingUser) {
    // Update existing user with social profile info (but keep existing data if present)
    await storage.updateUser(existingUser.id, {
      firstName: existingUser.firstName || claims["first_name"],
      lastName: existingUser.lastName || claims["last_name"],
      profileImageUrl: existingUser.profileImageUrl || claims["profile_image_url"],
      isEmailVerified: "true", // Social login means verified email
      isAdmin: existingUser.isAdmin === "true" ? "true" : (isAdminEmail ? "true" : "false"),
    });
    return existingUser;
  }
  
  // Create new user from social login
  const newUser = await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    isEmailVerified: "true",
    isAdmin: isAdminEmail ? "true" : "false",
  });
  
  return newUser;
}

export async function setupSocialAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: any = {};
    updateUserSession(user, tokens);
    const dbUser = await upsertSocialUser(tokens.claims());
    user.dbUserId = dbUser?.id;
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string, protocol: string) => {
    const strategyName = `replitauth:${protocol}:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `${protocol}://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
    return strategyName;
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Social login route - redirects to OAuth provider
  app.get("/api/social/login", (req, res, next) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const strategyName = ensureStrategy(req.hostname, protocol as string);
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // OAuth callback
  app.get("/api/callback", (req, res, next) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const strategyName = ensureStrategy(req.hostname, protocol as string);
    passport.authenticate(strategyName, {
      failureRedirect: "/?auth=failed",
    })(req, res, (err: any) => {
      if (err) {
        console.error("OAuth callback error:", err);
        return res.redirect("/?auth=failed");
      }
      
      // Set session userId from the social login
      const user = req.user as any;
      if (user?.dbUserId) {
        req.session.userId = user.dbUserId;
      }
      
      res.redirect("/?auth=success");
    });
  });

  // Social logout (clears both local session and OAuth session)
  app.get("/api/social/logout", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  });
}
