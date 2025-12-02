import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { hashPassword } from "./auth";

interface SocialProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  provider: "google" | "facebook";
}

async function findOrCreateSocialUser(profile: SocialProfile) {
  const existingUser = await storage.getUserByEmail(profile.email);
  
  const isAdminEmail = profile.email === "ydisolution@gmail.com";
  
  if (existingUser) {
    await storage.updateUser(existingUser.id, {
      firstName: existingUser.firstName || profile.firstName || null,
      lastName: existingUser.lastName || profile.lastName || null,
      profileImageUrl: existingUser.profileImageUrl || profile.profileImageUrl || null,
      isEmailVerified: "true",
      isAdmin: existingUser.isAdmin === "true" ? "true" : (isAdminEmail ? "true" : "false"),
    });
    return existingUser;
  }
  
  const newUser = await storage.upsertUser({
    email: profile.email,
    firstName: profile.firstName || null,
    lastName: profile.lastName || null,
    profileImageUrl: profile.profileImageUrl || null,
    isEmailVerified: "true",
    isAdmin: isAdminEmail ? "true" : "false",
  });
  
  return newUser;
}

export async function setupGoogleAuth(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientID || !clientSecret) {
    console.log("Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required");
    return false;
  }
  
  const callbackURL = process.env.NODE_ENV === "production" 
    ? `https://${process.env.REPLIT_DEV_DOMAIN || process.env.REPL_SLUG + "." + process.env.REPL_OWNER + ".repl.co"}/api/auth/google/callback`
    : "http://localhost:5000/api/auth/google/callback";
  
  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL,
    scope: ["email", "profile"],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("No email found in Google profile"));
      }
      
      const user = await findOrCreateSocialUser({
        id: profile.id,
        email,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        profileImageUrl: profile.photos?.[0]?.value,
        provider: "google",
      });
      
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }));
  
  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ["email", "profile"],
  }));
  
  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/?auth=failed" }),
    (req: Request, res: Response) => {
      const user = req.user as any;
      if (user?.id) {
        req.session.userId = user.id;
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
          }
          res.redirect("/?auth=success");
        });
      } else {
        res.redirect("/?auth=failed");
      }
    }
  );
  
  console.log("Google OAuth configured successfully");
  return true;
}

export async function setupFacebookAuth(app: Express) {
  const clientID = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  
  if (!clientID || !clientSecret) {
    console.log("Facebook OAuth not configured - FACEBOOK_APP_ID and FACEBOOK_APP_SECRET required");
    return false;
  }
  
  const callbackURL = process.env.NODE_ENV === "production"
    ? `https://${process.env.REPLIT_DEV_DOMAIN || process.env.REPL_SLUG + "." + process.env.REPL_OWNER + ".repl.co"}/api/auth/facebook/callback`
    : "http://localhost:5000/api/auth/facebook/callback";
  
  passport.use(new FacebookStrategy({
    clientID,
    clientSecret,
    callbackURL,
    profileFields: ["id", "emails", "name", "picture.type(large)"],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error("No email found in Facebook profile"));
      }
      
      const user = await findOrCreateSocialUser({
        id: profile.id,
        email,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        profileImageUrl: profile.photos?.[0]?.value,
        provider: "facebook",
      });
      
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }));
  
  app.get("/api/auth/facebook", passport.authenticate("facebook", {
    scope: ["email"],
  }));
  
  app.get("/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/?auth=failed" }),
    (req: Request, res: Response) => {
      const user = req.user as any;
      if (user?.id) {
        req.session.userId = user.id;
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
          }
          res.redirect("/?auth=success");
        });
      } else {
        res.redirect("/?auth=failed");
      }
    }
  );
  
  console.log("Facebook OAuth configured successfully");
  return true;
}

export async function setupSocialAuth(app: Express) {
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id || user);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  const googleConfigured = await setupGoogleAuth(app);
  const facebookConfigured = await setupFacebookAuth(app);
  
  app.get("/api/auth/providers", (req: Request, res: Response) => {
    res.json({
      google: googleConfigured,
      facebook: facebookConfigured,
    });
  });
  
  return { google: googleConfigured, facebook: facebookConfigured };
}

export async function createAdminUser() {
  const adminEmail = "admin@dealrush.co.il";
  const adminPassword = "DealRush2024!";
  
  const existingAdmin = await storage.getUserByEmail(adminEmail);
  if (existingAdmin) {
    console.log("Admin user already exists:", adminEmail);
    return existingAdmin;
  }
  
  const passwordHash = await hashPassword(adminPassword);
  
  const admin = await storage.upsertUser({
    email: adminEmail,
    passwordHash,
    firstName: "Admin",
    lastName: "DealRush",
    isAdmin: "true",
    isEmailVerified: "true",
  });
  
  console.log("Admin user created:", adminEmail);
  console.log("Admin password:", adminPassword);
  
  return admin;
}
