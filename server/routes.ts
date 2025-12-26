import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertDealSchema, insertParticipantSchema, users } from "@shared/schema";
import type { User, Participant } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { notificationService } from "./websocket";
import { sendDealJoinNotification, sendPriceDropNotification, sendDealClosedNotification, sendEmail, sendWelcomeEmail } from "./email";
import { calculateDynamicPrice, getCurrentTier, shouldUpdatePrices, calculateAllParticipantPrices } from "./dynamicPricing";
import supplierRoutes from "./supplierRoutes";
import { registerUser, loginUser, verifyEmailByUserId, requestPasswordReset, resetPassword, resendVerificationEmail } from "./auth";
import MemoryStore from "memorystore";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import rateLimit from "express-rate-limit";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { dealClosureService } from "./dealClosureService";
import { setupSocialAuth, createAdminUser, createSupplierUser } from "./socialAuth";
import { db } from "./db";

function parseIsraelTimeToUTC(dateTimeLocalString: string): Date {
  const [datePart, timePart] = dateTimeLocalString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  const tempDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(tempDate);
  const getPart = (type: string) => Number(parts.find(p => p.type === type)?.value || 0);
  
  const israelHour = getPart('hour');
  const israelMinute = getPart('minute');
  const israelDay = getPart('day');
  const israelMonth = getPart('month');
  const israelYear = getPart('year');
  
  const utcMinutes = tempDate.getUTCHours() * 60 + tempDate.getUTCMinutes();
  const israelMinutes = israelHour * 60 + israelMinute;
  
  let offsetMinutes = israelMinutes - utcMinutes;
  if (israelDay !== tempDate.getUTCDate() || israelMonth !== tempDate.getUTCMonth() + 1 || israelYear !== tempDate.getUTCFullYear()) {
    if (israelMinutes < utcMinutes) {
      offsetMinutes += 24 * 60;
    } else {
      offsetMinutes -= 24 * 60;
    }
  }
  
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0) - offsetMinutes * 60 * 1000);
}

const MemoryStoreSession = MemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
}

function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    storage.getUser(req.session.userId).then(user => {
      if (user?.isAdmin === "true") {
        next();
      } else {
        res.status(403).json({ error: "Admin access required" });
      }
    }).catch(() => {
      res.status(500).json({ error: "Failed to check admin status" });
    });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Trust proxy for Replit environment (required for secure cookies)
  app.set('trust proxy', 1);
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Initialize Redis client if REDIS_URL is provided
  let sessionStore;
  if (process.env.REDIS_URL) {
    try {
      const redisClient = createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      sessionStore = new RedisStore({ client: redisClient, prefix: "dealrush:" });
      console.log("✅ Redis session store initialized");
    } catch (error) {
      console.error("⚠️  Redis connection failed, falling back to MemoryStore:", error);
      sessionStore = new MemoryStoreSession({ checkPeriod: 86400000 });
    }
  } else {
    console.log("⚠️  No REDIS_URL found, using MemoryStore (not recommended for production)");
    sessionStore = new MemoryStoreSession({ checkPeriod: 86400000 });
  }
  
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "dealrush-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }));
  
  // Setup Social Auth (Google, Facebook)
  await setupSocialAuth(app);
  
  // Create admin user on startup
  await createAdminUser();
  
  // Create supplier user 'Dreamer' on startup
  await createSupplierUser();
  
  // Rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs (increased for development)
    message: { error: "יותר מדי נסיונות התחברות. נסה שוב בעוד 15 דקות" },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // General API rate limiter (more lenient)
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per minute
    message: { error: "יותר מדי בקשות. נסה שוב בעוד דקה" },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Apply general rate limiting to all API routes
  app.use("/api", apiLimiter);
  
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  // Supplier routes
  app.use("/api/suppliers", supplierRoutes);

  const registerSchema = z.object({
    email: z.string().email("כתובת מייל לא תקינה"),
    password: z.string().min(8, "הסיסמא חייבת להכיל לפחות 8 תווים"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  });

  app.post("/api/auth/register", authLimiter, async (req: Request, res: Response) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: validation.error.errors[0]?.message || "Validation failed" 
        });
      }

      const { email, password, firstName, lastName, phone } = validation.data;
      const result = await registerUser(email, password, firstName, lastName, phone);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      if (result.user && result.verificationToken) {
        try {
          await sendWelcomeEmail(
            email,
            firstName || "",
            result.verificationToken,
            result.user.id
          );
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          // Don't fail registration if email fails
        }
      }

      req.session.userId = result.user!.id;
      
      res.status(201).json({ 
        message: "נרשמת בהצלחה! נשלח אליך מייל לאימות",
        user: {
          id: result.user!.id,
          email: result.user!.email,
          firstName: result.user!.firstName,
          lastName: result.user!.lastName,
          isEmailVerified: result.user!.isEmailVerified,
          isAdmin: result.user!.isAdmin,
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "שגיאה בהרשמה" });
    }
  });

  const loginSchema = z.object({
    email: z.string().email("כתובת מייל לא תקינה"),
    password: z.string().min(1, "יש להזין סיסמא"),
  });

  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      console.log("🔵 Login attempt - req.body:", req.body);
      
      const validation = loginSchema.safeParse(req.body);
      console.log("🔵 Validation result:", validation.success ? "SUCCESS" : "FAILED", validation.success ? "" : validation.error.errors);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: validation.error.errors[0]?.message || "Validation failed" 
        });
      }

      const { email, password } = validation.data;
      console.log("🔵 Attempting login for email:", email);
      
      const result = await loginUser(email, password);
      console.log("🔵 Login result:", result.success ? "SUCCESS" : "FAILED", result.error || "");

      if (!result.success) {
        return res.status(401).json({ error: result.error });
      }

      req.session.userId = result.user!.id;
      console.log("🔵 Session userId set:", req.session.userId);
      
      // Save session before responding
      req.session.save((err) => {
        if (err) {
          console.error("❌ Session save error:", err);
        } else {
          console.log("✅ Session saved successfully");
        }
      });

      res.json({ 
        message: "התחברת בהצלחה!",
        user: {
          id: result.user!.id,
          email: result.user!.email,
          firstName: result.user!.firstName,
          lastName: result.user!.lastName,
          isEmailVerified: result.user!.isEmailVerified,
          isAdmin: result.user!.isAdmin,
          isSupplier: result.user!.isSupplier,
        }
      });
    } catch (error) {
      console.error("❌ Login error:", error);
      res.status(500).json({ error: "שגיאה בהתחברות" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "שגיאה בהתנתקות" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "התנתקת בהצלחה" });
    });
  });

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isAdmin: user.isAdmin,
        isSupplier: user.isSupplier,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token, userId } = req.body;
      if (!token || !userId) {
        return res.status(400).json({ error: "חסר קוד אימות או מזהה משתמש" });
      }

      const result = await verifyEmailByUserId(userId, token);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Auto-login the user after email verification
      req.session.userId = userId;
      
      const user = await storage.getUser(userId);

      res.json({ 
        message: "המייל אומת בהצלחה!",
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          isAdmin: user.isAdmin,
        } : undefined
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "שגיאה באימות המייל" });
    }
  });

  app.post("/api/auth/resend-verification", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const result = await resendVerificationEmail(userId);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      const user = await storage.getUser(userId);
      if (user && result.token) {
        const verificationUrl = `${req.protocol}://${req.get("host")}/verify-email?token=${result.token}&userId=${userId}`;
        
        await sendEmail({
          to: user.email,
          subject: "אימות כתובת המייל - DealRush",
          htmlBody: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #7c3aed;">אימות מייל</h1>
              <p>שלום ${user.firstName || ""},</p>
              <p>הנה קישור חדש לאימות המייל שלך:</p>
              <a href="${verificationUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                אמת את המייל שלי
              </a>
              <p>הקישור תקף ל-24 שעות.</p>
            </div>
          `,
        });
      }

      res.json({ message: "נשלח מייל אימות חדש" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "שגיאה בשליחת מייל אימות" });
    }
  });

  app.post("/api/auth/forgot-password", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "יש להזין כתובת מייל" });
      }

      const result = await requestPasswordReset(email);
      
      if (result.resetToken) {
        const user = await storage.getUserByEmail(email);
        if (user) {
          const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${result.resetToken}`;
          
          await sendEmail({
            to: email,
            subject: "איפוס סיסמא - DealRush",
            htmlBody: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #7c3aed;">איפוס סיסמא</h1>
                <p>שלום ${user.firstName || ""},</p>
                <p>קיבלנו בקשה לאיפוס הסיסמא שלך. לחץ על הכפתור למטה לאיפוס:</p>
                <a href="${resetUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                  אפס סיסמא
                </a>
                <p>הקישור תקף לשעה אחת בלבד.</p>
                <p style="color: #666; font-size: 12px;">אם לא ביקשת לאפס את הסיסמא, אנא התעלם מהודעה זו.</p>
              </div>
            `,
          });
        }
      }

      res.json({ message: "אם המייל קיים במערכת, נשלח אליו קישור לאיפוס הסיסמא" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "שגיאה בבקשת איפוס הסיסמא" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: "חסר קוד איפוס או סיסמא חדשה" });
      }

      const result = await resetPassword(token, password);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: "הסיסמא שונתה בהצלחה!" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "שגיאה באיפוס הסיסמא" });
    }
  });

  app.get("/api/user/purchases", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const purchases = await storage.getParticipantsByUser(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching user purchases:", error);
      res.status(500).json({ error: "Failed to fetch purchases" });
    }
  });

  // Get customer orders
  app.get("/api/user/orders", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(404).json({ error: "משתמש לא נמצא" });
      }

      const orders = await storage.getOrdersByCustomer(user.email);

      // Enrich orders with deal details
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const deal = await storage.getDeal(order.dealId);
          const participant = await storage.getParticipant(order.participantId);
          
          return {
            ...order,
            dealName: deal?.name || 'Unknown Deal',
            dealImage: deal?.images?.[0] || null,
            quantity: participant?.quantity || 1,
            pricePaid: participant?.pricePaid || 0,
            totalAmount: participant?.chargedAmount || participant?.pricePaid || 0,
          };
        })
      );

      res.json(enrichedOrders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: "שגיאה בטעינת ההזמנות" });
    }
  });

  // Get specific order details for customer
  app.get("/api/user/orders/:orderId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const { orderId } = req.params;

      if (!user || !user.email) {
        return res.status(404).json({ error: "משתמש לא נמצא" });
      }

      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "הזמנה לא נמצאה" });
      }

      if (order.customerEmail !== user.email) {
        return res.status(403).json({ error: "אין גישה להזמנה זו" });
      }

      // Get related data
      const deal = await storage.getDeal(order.dealId);
      const participant = await storage.getParticipant(order.participantId);
      const events = await storage.getFulfillmentEventsByOrder(orderId);

      const enrichedOrder = {
        ...order,
        dealName: deal?.name || 'Unknown Deal',
        dealImage: deal?.images?.[0] || null,
        dealDescription: deal?.description || '',
        quantity: participant?.quantity || 1,
        pricePaid: participant?.pricePaid || 0,
        totalAmount: participant?.chargedAmount || participant?.pricePaid || 0,
        events: events,
      };

      res.json(enrichedOrder);
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ error: "שגיאה בטעינת פרטי ההזמנה" });
    }
  });

  // עדכון כמות יחידות של משתתף
  app.patch("/api/participants/:id/quantity", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const userId = req.session.userId!;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: "כמות לא תקינה" });
      }

      const participant = await storage.getParticipant(id);
      if (!participant) {
        return res.status(404).json({ error: "רישום לא נמצא" });
      }

      if (participant.userId !== userId) {
        return res.status(403).json({ error: "אין הרשאה לעדכן רישום זה" });
      }

      const deal = await storage.getDeal(participant.dealId);
      if (!deal) {
        return res.status(404).json({ error: "דיל לא נמצא" });
      }

      // בדיקה אם הדיל עדיין פעיל
      const now = new Date();
      if (new Date(deal.endTime) <= now) {
        return res.status(400).json({ error: "לא ניתן לעדכן רישום לדיל שהסתיים" });
      }

      const updated = await storage.updateParticipant(id, { quantity });
      
      res.json({ success: true, participant: updated });
    } catch (error) {
      console.error("Error updating participant quantity:", error);
      res.status(500).json({ error: "שגיאה בעדכון כמות" });
    }
  });

  // ביטול רישום לדיל (מחיקת משתתף)
  app.delete("/api/participants/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId!;

      const participant = await storage.getParticipant(id);
      if (!participant) {
        return res.status(404).json({ error: "רישום לא נמצא" });
      }

      if (participant.userId !== userId) {
        return res.status(403).json({ error: "אין הרשאה למחוק רישום זה" });
      }

      const deal = await storage.getDeal(participant.dealId);
      if (!deal) {
        return res.status(404).json({ error: "דיל לא נמצא" });
      }

      // בדיקה אם הדיל עדיין פעיל
      const now = new Date();
      if (new Date(deal.endTime) <= now) {
        return res.status(400).json({ error: "לא ניתן לבטל רישום לדיל שהסתיים" });
      }

      // מחיקת המשתתף
      const deleted = await storage.deleteParticipant(id);
      if (!deleted) {
        return res.status(500).json({ error: "שגיאה במחיקת הרישום" });
      }

      // עדכון מספר המשתתפים בדיל
      const remainingParticipants = await storage.getParticipantsByDeal(deal.id);
      const totalQuantity = remainingParticipants.reduce((sum, p) => sum + p.quantity, 0);
      
      await storage.updateDeal(deal.id, {
        participants: totalQuantity,
      });

      res.json({ success: true, message: "הרישום בוטל בהצלחה" });
    } catch (error) {
      console.error("Error deleting participant:", error);
      res.status(500).json({ error: "שגיאה בביטול הרישום" });
    }
  });

  app.get("/api/stripe/publishable-key", async (_req: Request, res: Response) => {
    try {
      const publishableKey = await getStripePublishableKey();
      if (!publishableKey) {
        console.warn("⚠️  Stripe not configured - PayPal only mode");
        return res.json({ publishableKey: null, paypalOnly: true });
      }
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error fetching Stripe publishable key:", error);
      // Return paypalOnly mode instead of error
      res.json({ publishableKey: null, paypalOnly: true });
    }
  });

  app.post("/api/stripe/create-setup-intent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const customer = await stripeService.getOrCreateCustomer(
        userId, 
        user.email, 
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined
      );
      
      const setupIntent = await stripeService.createSetupIntent(customer.id);
      
      res.json({ 
        clientSecret: setupIntent.client_secret,
        customerId: customer.id,
      });
    } catch (error) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({ error: "Failed to create setup intent" });
    }
  });

  app.post("/api/stripe/validate-card", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { paymentMethodId } = req.body;
      
      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method ID required" });
      }
      
      const validation = await stripeService.validateCard(paymentMethodId);
      res.json(validation);
    } catch (error) {
      console.error("Error validating card:", error);
      res.status(500).json({ error: "Failed to validate card" });
    }
  });

  app.post("/api/stripe/attach-payment-method", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      const { paymentMethodId } = req.body;
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method ID required" });
      }
      
      const customer = await stripeService.getOrCreateCustomer(
        userId, 
        user.email
      );
      
      const paymentMethod = await stripeService.attachPaymentMethod(paymentMethodId, customer.id);
      await stripeService.setDefaultPaymentMethod(customer.id, paymentMethodId);
      
      res.json({ 
        success: true,
        paymentMethod: {
          id: paymentMethod.id,
          last4: paymentMethod.card?.last4,
          brand: paymentMethod.card?.brand,
        }
      });
    } catch (error: any) {
      console.error("Error attaching payment method:", error);
      res.status(500).json({ error: error.message || "Failed to attach payment method" });
    }
  });

  app.get("/api/stripe/payment-methods", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.json({ paymentMethods: [] });
      }
      
      const result = await stripeService.listPaymentMethods(user.stripeCustomerId);
      
      res.json({ 
        paymentMethods: result.data.map(pm => ({
          id: pm.id,
          last4: pm.card?.last4,
          brand: pm.card?.brand,
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
        }))
      });
    } catch (error) {
      console.error("Error listing payment methods:", error);
      res.status(500).json({ error: "Failed to list payment methods" });
    }
  });

  app.get("/api/deals", async (_req: Request, res: Response) => {
    try {
      const deals = await storage.getDeals();
      // Only return active deals for the public marketplace
      const activeDeals = deals.filter(d => d.status === "active");
      
      // Add current tier info
      const dealsWithTierInfo = activeDeals.map(deal => {
        const participants = deal.participants || 0;
        let currentTier = 0;
        
        // Find which tier the deal is currently in
        if (deal.tiers && Array.isArray(deal.tiers)) {
          for (let i = deal.tiers.length - 1; i >= 0; i--) {
            const tier = deal.tiers[i];
            if (participants >= tier.minParticipants) {
              currentTier = i + 1;
              break;
            }
          }
        }
        
        return {
          ...deal,
          currentTierDiscount: currentTier > 0 ? currentTier : undefined,
        };
      });
      
      res.json(dealsWithTierInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/:id", async (req: Request, res: Response) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deal" });
    }
  });

  app.get("/api/deals/category/:category", async (req: Request, res: Response) => {
    try {
      const deals = await storage.getDealsByCategory(req.params.category);
      // Only return active deals for the public marketplace
      const activeDeals = deals.filter(d => d.status === "active");
      res.json(activeDeals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.post("/api/upload", upload.array("images", 10), (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const urls = files.map(file => `/uploads/${file.filename}`);
      res.json({ urls });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  app.post("/api/deals", isAdmin, async (req: Request, res: Response) => {
    try {
      const body = {
        ...req.body,
        originalPrice: Number(req.body.originalPrice),
        currentPrice: Number(req.body.currentPrice),
        participants: Number(req.body.participants || 0),
        targetParticipants: Number(req.body.targetParticipants),
        minParticipants: Number(req.body.minParticipants || 1),
        endTime: parseIsraelTimeToUTC(req.body.endTime),
        tiers: req.body.tiers.map((t: any) => ({
          minParticipants: Number(t.minParticipants),
          maxParticipants: Number(t.maxParticipants),
          discount: Number(t.discount),
          price: t.price ? Number(t.price) : undefined,
        })),
      };
      
      const validated = insertDealSchema.parse(body);
      const deal = await storage.createDeal(validated);
      
      dealClosureService.scheduleDealClosure(deal);
      
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  app.patch("/api/deals/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const body: any = { ...req.body };
      if (body.originalPrice) body.originalPrice = Number(body.originalPrice);
      if (body.currentPrice) body.currentPrice = Number(body.currentPrice);
      if (body.participants) body.participants = Number(body.participants);
      if (body.targetParticipants) body.targetParticipants = Number(body.targetParticipants);
      if (body.minParticipants) body.minParticipants = Number(body.minParticipants);
      if (body.endTime) body.endTime = parseIsraelTimeToUTC(body.endTime);
      if (body.tiers) {
        body.tiers = body.tiers.map((t: any) => ({
          minParticipants: Number(t.minParticipants),
          maxParticipants: Number(t.maxParticipants),
          discount: Number(t.discount),
          price: t.price ? Number(t.price) : undefined,
        }));
      }

      const deal = await storage.updateDeal(req.params.id, body);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      
      dealClosureService.scheduleDealClosure(deal);
      
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  // Admin approve deal endpoint
  app.post("/api/admin/deals/:dealId/approve", isAdmin, async (req: Request, res: Response) => {
    try {
      const { dealId } = req.params;
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: "דיל לא נמצא" });
      }
      
      if (deal.status !== "pending") {
        return res.status(400).json({ error: "רק דיל בסטטוס ממתין יכול להיות מאושר" });
      }
      
      // Update deal status to approved
      const updatedDeal = await storage.updateDeal(dealId, { 
        status: "approved",
        isActive: "true"
      });
      
      // Schedule deal closure
      dealClosureService.scheduleDealClosure(updatedDeal!);
      
      // Notify supplier via WebSocket about deal approval
      notificationService.broadcast({
        type: "deal_approved" as any,
        dealId: dealId,
        dealName: deal.name,
        supplierId: deal.supplierId
      });
      
      res.json({ success: true, deal: updatedDeal });
    } catch (error) {
      console.error("Error approving deal:", error);
      res.status(500).json({ error: "שגיאה באישור הדיל" });
    }
  });
  
  // Admin reject deal endpoint
  app.post("/api/admin/deals/:dealId/reject", isAdmin, async (req: Request, res: Response) => {
    try {
      const { dealId } = req.params;
      const { rejectionReason, adminNotes } = req.body;
      
      if (!rejectionReason) {
        return res.status(400).json({ error: "יש לציין סיבת דחייה" });
      }
      
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: "דיל לא נמצא" });
      }
      
      if (deal.status !== "pending") {
        return res.status(400).json({ error: "רק דיל בסטטוס ממתין יכול להידחות" });
      }
      
      // Update deal status back to draft with rejection details
      const updatedDeal = await storage.updateDeal(dealId, { 
        status: "draft",
        rejectedAt: new Date(),
        rejectionReason,
        adminNotes
      });
      
      // Notify supplier via WebSocket about deal rejection
      notificationService.broadcast({
        type: "deal_rejected" as any,
        dealId: dealId,
        dealName: deal.name,
        supplierId: deal.supplierId,
        rejectionReason,
        adminNotes
      });
      
      res.json({ success: true, deal: updatedDeal });
    } catch (error) {
      console.error("Error rejecting deal:", error);
      res.status(500).json({ error: "שגיאה בדחיית הדיל" });
    }
  });

  app.delete("/api/deals/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      dealClosureService.cancelScheduledClosure(req.params.id);
      
      const success = await storage.deleteDeal(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  app.get("/api/deals/:id/participants", async (req: Request, res: Response) => {
    try {
      const participants = await storage.getParticipantsByDeal(req.params.id);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // Get shipping cost for a city
  app.get("/api/deals/:id/shipping-cost", async (req: Request, res: Response) => {
    try {
      const { city } = req.query;
      
      if (!city || typeof city !== 'string') {
        return res.status(400).json({ error: "City parameter is required" });
      }
      
      const dealId = req.params.id;
      const rate = await storage.getShippingRateForCity(dealId, city);
      
      res.json(rate?.cost || 0);
    } catch (error) {
      console.error("Error fetching shipping cost:", error);
      res.status(500).json({ error: "Failed to fetch shipping cost" });
    }
  });

  // Get user's active deals (deals they're participating in)
  app.get("/api/user/active-deals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Get all participants records for this user
      const allParticipants = await storage.getAllParticipants();
      const userParticipants = allParticipants.filter(p => p.userId === userId);
      
      // Get unique deal IDs
      const dealIds = [...new Set(userParticipants.map(p => p.dealId))];
      
      // Get deal details for each deal
      const deals = await Promise.all(
        dealIds.map(async (dealId) => {
          const deal = await storage.getDeal(dealId);
          if (!deal) return null;
          
          // Get user's participants for this deal
          const userDealsParticipants = userParticipants.filter(p => p.dealId === dealId);
          const totalQuantity = userDealsParticipants.reduce((sum, p) => sum + (p.quantity || 0), 0);
          const totalPaid = userDealsParticipants.reduce((sum, p) => sum + p.pricePaid, 0);
          
          return {
            ...deal,
            userParticipation: {
              quantity: totalQuantity,
              totalPaid,
              participants: userDealsParticipants,
            }
          };
        })
      );
      
      // Filter out nulls and only active deals
      const activeDeals = deals.filter(d => d && d.isActive === "true");
      
      res.json(activeDeals);
    } catch (error) {
      console.error("Error fetching user active deals:", error);
      res.status(500).json({ error: "Failed to fetch active deals" });
    }
  });

  const joinDealSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    userId: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    paymentMethodId: z.string().optional(),
    quantity: z.number().int().min(1).max(10).optional().default(1),
  });

  app.post("/api/deals/:id/join", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const dealId = req.params.id;
      const sessionUserId = req.session.userId!;
      
      console.log(`[JOIN DEAL] User ${sessionUserId} attempting to join deal ${dealId}`);
      
      const validationResult = joinDealSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("[JOIN DEAL] Validation failed:", validationResult.error.errors);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { name, email, phone, paymentMethodId, quantity } = validationResult.data;
      
      const user = await storage.getUser(sessionUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!paymentMethodId && !user.stripeCustomerId) {
        return res.status(400).json({ error: "יש להוסיף כרטיס אשראי לפני ההצטרפות לדיל" });
      }

      let pmId = paymentMethodId;
      
      if (!pmId) {
        const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId!);
        if (paymentMethods.data.length === 0) {
          return res.status(400).json({ error: "יש להוסיף כרטיס אשראי לפני ההצטרפות לדיל" });
        }
        pmId = paymentMethods.data[0].id;
      }

      const cardValidation = await stripeService.validateCard(pmId);
      if (!cardValidation.valid) {
        return res.status(400).json({ error: cardValidation.error || "הכרטיס אינו תקין" });
      }
      
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }

      if (deal.isActive !== "true") {
        return res.status(400).json({ error: "הדיל כבר נסגר" });
      }

      const existingParticipants = await storage.getParticipantsByDeal(dealId);
      const oldParticipantCount = existingParticipants.length;
      
      const participantName = name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "משתתף אנונימי";
      const participantEmail = email || user.email;
      const participantPhone = phone || user.phone || null;
      
      // בדיקה האם נדרש עדכון מחירים (עברנו מדרגה)
      const needsPriceUpdate = shouldUpdatePrices(
        oldParticipantCount,
        oldParticipantCount + quantity,
        deal.tiers as any
      );
      
      const createdParticipants = [];
      let firstParticipant = null;
      
      for (let i = 0; i < quantity; i++) {
        const newPosition = existingParticipants.length + createdParticipants.length + 1;
        const totalParticipantsAtThisPoint = oldParticipantCount + createdParticipants.length + 1;
        
        // חישוב מחיר דינמי
        const currentTier = getCurrentTier(deal.tiers as any, totalParticipantsAtThisPoint);
        const priceCalc = calculateDynamicPrice(
          deal.originalPrice,
          newPosition,
          totalParticipantsAtThisPoint,
          currentTier,
          deal.priceDeltaPercentage || 4
        );
        
        const tierIndex = deal.tiers.findIndex(t => 
          totalParticipantsAtThisPoint >= t.minParticipants && totalParticipantsAtThisPoint <= t.maxParticipants
        );
        
        const participantData = {
          dealId,
          name: quantity > 1 ? `${participantName} (יחידה ${i + 1}/${quantity})` : participantName,
          userId: sessionUserId,
          email: participantEmail,
          phone: participantPhone,
          pricePaid: priceCalc.dynamicPrice,
          initialPrice: priceCalc.dynamicPrice,
          position: newPosition,
          paymentStatus: "card_validated",
          stripePaymentMethodId: pmId,
          tierAtJoin: tierIndex !== -1 ? tierIndex : deal.tiers.length - 1,
          cardLast4: cardValidation.last4 || null,
          cardBrand: cardValidation.brand || null,
        };
        
        const participant = await storage.addParticipant(participantData);
        createdParticipants.push(participant);
        
        if (i === 0) {
          firstParticipant = participant;
        }
      }
      
      const updatedParticipants = await storage.getParticipantsByDeal(dealId);
      const newParticipantCount = updatedParticipants.length;
      
      // עדכון מחירים רטרואקטיבי אם עברנו מדרגה
      if (needsPriceUpdate) {
        const allPrices = calculateAllParticipantPrices(
          deal as any,
          updatedParticipants.map(p => ({ position: p.position, quantity: 1 }))
        );
        
        // עדכון כל המשתתפים עם המחירים החדשים
        for (const participant of updatedParticipants) {
          const newPriceCalc = allPrices.get(participant.position);
          if (newPriceCalc && participant.pricePaid !== newPriceCalc.dynamicPrice) {
            await storage.updateParticipant(participant.id, {
              pricePaid: newPriceCalc.dynamicPrice,
            });
          }
        }
      }
      
      const newTierIndex = deal.tiers.findIndex(t => 
        newParticipantCount >= t.minParticipants && newParticipantCount <= t.maxParticipants
      );
      const currentTier = deal.tiers[newTierIndex !== -1 ? newTierIndex : deal.tiers.length - 1];
      
      const newCurrentPrice = currentTier.price || Math.round(deal.originalPrice * (1 - currentTier.discount / 100));
      
      await storage.updateDeal(dealId, { 
        participants: newParticipantCount,
        currentPrice: newCurrentPrice,
      });

      notificationService.notifyParticipantJoined(
        dealId,
        deal.name,
        participantName,
        newParticipantCount,
        newCurrentPrice
      );

      const previousCount = existingParticipants.length;
      const previousTierIndex = previousCount > 0 
        ? deal.tiers.findIndex(t => previousCount >= t.minParticipants && previousCount <= t.maxParticipants)
        : -1;
      
      if (newTierIndex !== -1 && newTierIndex > previousTierIndex) {
        const oldPrice = previousTierIndex >= 0 
          ? (deal.tiers[previousTierIndex].price || Math.round(deal.originalPrice * (1 - deal.tiers[previousTierIndex].discount / 100)))
          : deal.originalPrice;
        
        dealClosureService.notifyTierUnlocked(deal, newTierIndex, oldPrice, newCurrentPrice).catch(err => {
          console.error("Failed to notify tier unlock:", err);
        });
      }

      if (participantEmail) {
        const totalPaid = createdParticipants.reduce((sum, p) => sum + p.pricePaid, 0);
        const firstPosition = firstParticipant?.position || 1;
        console.log(`[EMAIL] Attempting to send join notification to ${participantEmail} for deal ${deal.name}`);
        sendDealJoinNotification(
          participantEmail, 
          deal.name, 
          totalPaid, 
          firstPosition,
          quantity
        )
          .then(() => {
            console.log(`[EMAIL][SUCCESS] Join notification sent to ${participantEmail} for deal ${deal.name}`);
          })
          .catch(err => {
            console.error(`[EMAIL][FAIL] Failed to send join notification email to ${participantEmail}:`, err);
          });
      } else {
        console.warn(`[EMAIL][SKIP] No email address for participant joining deal ${deal.name}`);
      }

      res.status(201).json({ 
        participant: firstParticipant,
        participants: createdParticipants,
        quantity,
        newParticipantCount,
        newPrice: newCurrentPrice,
      });
    } catch (error) {
      console.error("[JOIN DEAL] Error joining deal:", error);
      console.error("[JOIN DEAL] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: "Failed to join deal",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const registerWithoutPaymentSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    quantity: z.number().int().min(1).max(10).optional().default(1),
    needsShipping: z.boolean().optional().default(false),
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingZipCode: z.string().optional(),
  });

  app.post("/api/deals/:id/register-without-payment", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const dealId = req.params.id;
      const sessionUserId = req.session.userId!;
      
      console.log(`[REGISTER] User ${sessionUserId} attempting to register for deal ${dealId}`);
      
      const validationResult = registerWithoutPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("[REGISTER] Validation failed:", validationResult.error.errors);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { name, email, phone, quantity, needsShipping, shippingAddress, shippingCity, shippingZipCode } = validationResult.data;
      
      const user = await storage.getUser(sessionUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }

      if (deal.isActive !== "true") {
        return res.status(400).json({ error: "הדיל כבר נסגר" });
      }

      const existingParticipants = await storage.getParticipantsByDeal(dealId);
      const oldParticipantCount = existingParticipants.length;
      
      const existingUserParticipation = existingParticipants.find(p => p.userId === sessionUserId);
      if (existingUserParticipation) {
        return res.status(400).json({ error: "כבר נרשמת לדיל זה" });
      }
      
      const participantName = name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "משתתף אנונימי";
      const participantEmail = email || user.email;
      const participantPhone = phone || user.phone || null;
      
      // Calculate shipping cost if needed
      let shippingCost = 0;
      if (needsShipping && shippingCity) {
        const rate = await storage.getShippingRateForCity(dealId, shippingCity);
        shippingCost = rate?.cost || 0;
      }
      
      // בדיקה האם נדרש עדכון מחירים (עברנו מדרגה)
      const needsPriceUpdate = shouldUpdatePrices(
        oldParticipantCount,
        oldParticipantCount + quantity,
        deal.tiers as any
      );
      
      const createdParticipants = [];
      let firstParticipant = null;
      
      // Create separate participant record for each unit
      for (let i = 0; i < quantity; i++) {
        const newPosition = existingParticipants.length + createdParticipants.length + 1;
        const totalParticipantsAtThisPoint = oldParticipantCount + createdParticipants.length + 1;
        
        // חישוב מחיר דינמי
        const currentTier = getCurrentTier(deal.tiers as any, totalParticipantsAtThisPoint);
        const priceCalc = calculateDynamicPrice(
          deal.originalPrice,
          newPosition,
          totalParticipantsAtThisPoint,
          currentTier,
          deal.priceDeltaPercentage || 4
        );
        
        const tierIndex = deal.tiers.findIndex(t => 
          totalParticipantsAtThisPoint >= t.minParticipants && totalParticipantsAtThisPoint <= t.maxParticipants
        );
        
        const participantData = {
          dealId,
          name: quantity > 1 ? `${participantName} (יחידה ${i + 1}/${quantity})` : participantName,
          userId: sessionUserId,
          email: participantEmail,
          phone: participantPhone,
          quantity: 1,
          pricePaid: priceCalc.dynamicPrice,
          initialPrice: priceCalc.dynamicPrice,
          position: newPosition,
          paymentStatus: "pending_paypal",
          tierAtJoin: tierIndex !== -1 ? tierIndex : 0,
          needsShipping: needsShipping || false,
          shippingAddress: needsShipping ? shippingAddress : null,
          shippingCity: needsShipping ? shippingCity : null,
          shippingZipCode: needsShipping ? shippingZipCode : null,
          shippingCost: i === 0 ? shippingCost : 0,
        };
        
        const participant = await storage.addParticipant(participantData);
        createdParticipants.push(participant);
        if (i === 0) {
          firstParticipant = participant;
        }
      }
      
      const updatedParticipants = await storage.getParticipantsByDeal(dealId);
      const newParticipantCount = updatedParticipants.length;
      
      // עדכון מחירים רטרואקטיבי אם עברנו מדרגה
      if (needsPriceUpdate) {
        const allPrices = calculateAllParticipantPrices(
          deal as any,
          updatedParticipants.map(p => ({ position: p.position, quantity: 1 }))
        );
        
        // עדכון כל המשתתפים עם המחירים החדשים
        for (const participant of updatedParticipants) {
          const newPriceCalc = allPrices.get(participant.position);
          if (newPriceCalc && participant.pricePaid !== newPriceCalc.dynamicPrice) {
            await storage.updateParticipant(participant.id, {
              pricePaid: newPriceCalc.dynamicPrice,
            });
          }
        }
      }
      
      const newTierIndex = deal.tiers.findIndex(t => 
        newParticipantCount >= t.minParticipants && newParticipantCount <= t.maxParticipants
      );
      
      let newCurrentPrice = deal.originalPrice;
      if (newTierIndex !== -1) {
        const currentTier = deal.tiers[newTierIndex];
        newCurrentPrice = currentTier.price || Math.round(deal.originalPrice * (1 - currentTier.discount / 100));
      }
      
      await storage.updateDeal(dealId, { 
        participants: newParticipantCount,
        currentPrice: newCurrentPrice,
      });

      notificationService.notifyParticipantJoined(
        dealId,
        deal.name,
        participantName,
        newParticipantCount,
        newCurrentPrice
      );

      const previousTierIndex = oldParticipantCount > 0 
        ? deal.tiers.findIndex(t => oldParticipantCount >= t.minParticipants && oldParticipantCount <= t.maxParticipants)
        : -1;
      
      if (newTierIndex !== -1 && newTierIndex > previousTierIndex) {
        const oldPrice = previousTierIndex >= 0 
          ? (deal.tiers[previousTierIndex].price || Math.round(deal.originalPrice * (1 - deal.tiers[previousTierIndex].discount / 100)))
          : deal.originalPrice;
        
        dealClosureService.notifyTierUnlocked(deal, newTierIndex, oldPrice, newCurrentPrice).catch(err => {
          console.error("Failed to notify tier unlock:", err);
        });
      }

      if (participantEmail) {
        // Calculate total price from all created participants
        const productsTotalPrice = createdParticipants.reduce((sum, p) => sum + p.pricePaid, 0);
        const totalPrice = productsTotalPrice + shippingCost;
        const avgUnitPrice = Math.round(productsTotalPrice / quantity);
        
        // Send ONE consolidated email for all units purchased by this customer
        sendDealJoinNotification(
          participantEmail, 
          deal.name, 
          totalPrice, 
          firstParticipant?.position || 1,
          quantity,
          avgUnitPrice, // Send current average price per unit
          shippingCost > 0 ? {
            address: shippingAddress || '',
            city: shippingCity || '',
            zipCode: shippingZipCode || '',
            cost: shippingCost
          } : undefined
        ).catch(err => {
          console.error("Failed to send join notification email:", err);
        });
      }

      res.status(201).json({ 
        participant: firstParticipant,
        quantity,
        newParticipantCount,
        newPrice: newCurrentPrice,
        message: "נרשמת בהצלחה! קישור לתשלום יישלח לאימייל שלך"
      });
    } catch (error) {
      console.error("[REGISTER] Error registering for deal:", error);
      console.error("[REGISTER] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: "Failed to register for deal",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin Analytics API
  app.get("/api/admin/analytics", isAdmin, async (req: Request, res: Response) => {
    try {
      const range = req.query.range as string || '30d';
      
      // Calculate date range
      let fromDate = new Date();
      const toDate = new Date();
      
      switch (range) {
        case 'today':
          fromDate.setHours(0, 0, 0, 0);
          break;
        case '7d':
          fromDate.setDate(fromDate.getDate() - 7);
          break;
        case '30d':
        default:
          fromDate.setDate(fromDate.getDate() - 30);
          break;
      }

      // Get all data for analytics
      const allDeals = await storage.getDeals();
      const allUsers = await db.select().from(users);
      
      // Get all participants with deal info
      const allParticipants: Participant[] = [];
      for (const deal of allDeals) {
        const dealParticipants = await storage.getParticipantsByDeal(deal.id);
        allParticipants.push(...dealParticipants);
      }

      // Filter by date range
      const usersInRange = allUsers.filter(u => 
        u.createdAt && new Date(u.createdAt) >= fromDate && new Date(u.createdAt) <= toDate
      );

      const participantsInRange = allParticipants.filter(p => 
        p.joinedAt && new Date(p.joinedAt) >= fromDate && new Date(p.joinedAt) <= toDate
      );

      // Calculate metrics
      const activeDeals = allDeals.filter(d => d.status === 'active' && d.isActive === 'true');
      const closedDeals = allDeals.filter(d => d.status === 'closed' || d.status === 'completed');
      
      const totalRevenue = participantsInRange
        .filter(p => p.paymentStatus === 'charged')
        .reduce((sum, p) => sum + (p.chargedAmount || p.pricePaid), 0);

      const platformProfit = allDeals.reduce((sum, deal) => {
        const dealParticipants = allParticipants.filter(p => 
          p.dealId === deal.id && 
          p.paymentStatus === 'charged' &&
          p.joinedAt && new Date(p.joinedAt) >= fromDate
        );
        const dealRevenue = dealParticipants.reduce((s, p) => s + (p.chargedAmount || p.pricePaid), 0);
        const commission = deal.platformCommission || 5;
        return sum + Math.round(dealRevenue * (commission / 100));
      }, 0);

      // Vendor payouts
      const vendorPayouts = allDeals
        .filter(d => d.supplierName && (d.status === 'closed' || d.status === 'completed'))
        .map(deal => {
          const dealParticipants = allParticipants.filter(p => 
            p.dealId === deal.id && p.paymentStatus === 'charged'
          );
          const dealRevenue = dealParticipants.reduce((s, p) => s + (p.chargedAmount || p.pricePaid), 0);
          const commission = deal.platformCommission || 5;
          const vendorAmount = dealRevenue - Math.round(dealRevenue * (commission / 100));
          
          return {
            dealId: deal.id,
            dealName: deal.name,
            supplierName: deal.supplierName,
            totalRevenue: dealRevenue,
            platformCommission: Math.round(dealRevenue * (commission / 100)),
            vendorAmount,
            participantCount: dealParticipants.length,
            status: 'pending' as const,
          };
        });

      // Daily stats for chart
      const dailyStats: Array<{
        date: string;
        registrations: number;
        participants: number;
        revenue: number;
      }> = [];
      
      const currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayRegs = allUsers.filter(u => {
          if (!u.createdAt) return false;
          const created = new Date(u.createdAt);
          return created >= dayStart && created <= dayEnd;
        }).length;
        
        const dayParticipants = allParticipants.filter(p => {
          if (!p.joinedAt) return false;
          const joined = new Date(p.joinedAt);
          return joined >= dayStart && joined <= dayEnd;
        });
        
        const dayRevenue = dayParticipants
          .filter(p => p.paymentStatus === 'charged')
          .reduce((sum, p) => sum + (p.chargedAmount || p.pricePaid), 0);
        
        dailyStats.push({
          date: dateStr,
          registrations: dayRegs,
          participants: dayParticipants.length,
          revenue: dayRevenue,
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      res.json({
        summary: {
          activeDeals: activeDeals.length,
          closedDeals: closedDeals.length,
          totalDeals: allDeals.length,
          newRegistrations: usersInRange.length,
          totalUsers: allUsers.length,
          unitsSold: participantsInRange.filter(p => p.paymentStatus === 'charged').length,
          totalParticipants: participantsInRange.length,
          totalRevenue,
          platformProfit,
        },
        vendorPayouts,
        dailyStats,
        range,
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Get all participants for admin
  app.get("/api/admin/participants", isAdmin, async (req: Request, res: Response) => {
    try {
      const allDeals = await storage.getDeals();
      const allParticipants: Array<Participant & { dealName: string }> = [];
      
      for (const deal of allDeals) {
        const dealParticipants = await storage.getParticipantsByDeal(deal.id);
        allParticipants.push(...dealParticipants.map(p => ({
          ...p,
          dealName: deal.name,
        })));
      }
      
      res.json(allParticipants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // Get all deals (including closed)
  app.get("/api/admin/all-deals", isAdmin, async (req: Request, res: Response) => {
    try {
      const allDeals = await storage.getAllDeals();
      res.json(allDeals);
    } catch (error) {
      console.error("Error fetching all deals:", error);
      res.status(500).json({ error: "Failed to fetch all deals" });
    }
  });

  // Get all participants
  app.get("/api/admin/all-participants", isAdmin, async (req: Request, res: Response) => {
    try {
      const allDeals = await storage.getAllDeals();
      const allParticipants: any[] = [];
      
      for (const deal of allDeals) {
        const dealParticipants = await storage.getParticipantsByDeal(deal.id);
        allParticipants.push(...dealParticipants);
      }
      
      res.json(allParticipants);
    } catch (error) {
      console.error("Error fetching all participants:", error);
      res.status(500).json({ error: "Failed to fetch all participants" });
    }
  });

  // Get closed deals with comprehensive statistics
  app.get("/api/admin/closed-deals", isAdmin, async (req: Request, res: Response) => {
    try {
      const allDeals = await storage.getAllDeals();
      const closedDeals = allDeals.filter(d => 
        d.status === 'closed' || d.status === 'completed' || d.status === 'cancelled'
      );
      
      const closedDealsWithStats = await Promise.all(closedDeals.map(async (deal) => {
        const dealParticipants = await storage.getParticipantsByDeal(deal.id);
        const chargedParticipants = dealParticipants.filter(p => 
          p.paymentStatus === 'charged' || p.paymentStatus === 'card_validated'
        );
        
        const totalRevenue = chargedParticipants.reduce((sum, p) => sum + (p.chargedAmount || p.pricePaid), 0);
        const avgDiscount = deal.originalPrice > 0 && chargedParticipants.length > 0
          ? Math.round((1 - (totalRevenue / chargedParticipants.length / deal.originalPrice)) * 100)
          : 0;
        
        const totalOriginalValue = deal.originalPrice * chargedParticipants.length;
        const totalSavings = totalOriginalValue - totalRevenue;
        
        const commissionRate = deal.platformCommission || 5;
        const platformProfit = Math.round(totalRevenue * (commissionRate / 100));
        
        // Calculate duration from creation to completion
        const createdAt = deal.createdAt ? new Date(deal.createdAt) : new Date();
        const closedAt = deal.closedAt ? new Date(deal.closedAt) : new Date(deal.endTime);
        const durationHours = Math.abs(closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        // Calculate average units per customer (quantity field if available)
        const totalQuantity = chargedParticipants.reduce((sum, p) => sum + (p.quantity || 1), 0);
        const avgUnitsPerCustomer = chargedParticipants.length > 0 
          ? totalQuantity / chargedParticipants.length 
          : 0;
        
        // Calculate completion rate
        const completionRate = deal.targetParticipants > 0
          ? Math.round((chargedParticipants.length / deal.targetParticipants) * 100)
          : 0;
        
        return {
          id: deal.id,
          name: deal.name,
          category: deal.category,
          image: deal.images[0],
          originalPrice: deal.originalPrice,
          finalPrice: chargedParticipants.length > 0 
            ? Math.round(totalRevenue / chargedParticipants.length)
            : deal.currentPrice,
          status: deal.status,
          closedAt: deal.closedAt,
          createdAt: deal.createdAt,
          endTime: deal.endTime,
          supplierName: deal.supplierName,
          tiers: deal.tiers,
          
          unitsSold: totalQuantity,
          totalParticipants: chargedParticipants.length,
          targetParticipants: deal.targetParticipants,
          minParticipants: deal.minParticipants,
          completionRate,
          
          totalRevenue,
          totalOriginalValue,
          totalSavings,
          avgDiscount,
          avgPrice: chargedParticipants.length > 0 ? totalRevenue / chargedParticipants.length : 0,
          avgUnitsPerCustomer,
          duration: durationHours,
          
          platformCommission: commissionRate,
          platformProfit,
          vendorPayout: totalRevenue - platformProfit,
          
          participants: dealParticipants.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            position: p.position,
            quantity: p.quantity || 1,
            pricePaid: p.pricePaid,
            chargedAmount: p.chargedAmount,
            paymentStatus: p.paymentStatus,
            tierAtJoin: p.tierAtJoin,
            finalTier: p.finalTier,
            joinedAt: p.joinedAt,
            chargedAt: p.chargedAt,
            cardLast4: p.cardLast4,
            cardBrand: p.cardBrand,
            discount: deal.originalPrice > 0 
              ? Math.round((1 - ((p.chargedAmount || p.pricePaid) / deal.originalPrice)) * 100)
              : 0,
          })),
        };
      }));
      
      res.json(closedDealsWithStats);
    } catch (error) {
      console.error("Error fetching closed deals:", error);
      res.status(500).json({ error: "Failed to fetch closed deals" });
    }
  });

  // Get supplier's closed deals with comprehensive statistics
  app.get("/api/suppliers/closed-deals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || user.isSupplier !== 'true') {
        return res.status(403).json({ error: "Not a supplier" });
      }
      
      const allDeals = await storage.getAllDeals();
      const supplierDeals = allDeals.filter(d => 
        d.supplierId === userId && 
        (d.status === 'closed' || d.status === 'completed' || d.status === 'cancelled')
      );
      
      const closedDealsWithStats = await Promise.all(supplierDeals.map(async (deal) => {
        const dealParticipants = await storage.getParticipantsByDeal(deal.id);
        const chargedParticipants = dealParticipants.filter(p => 
          p.paymentStatus === 'charged' || p.paymentStatus === 'card_validated'
        );
        
        const totalRevenue = chargedParticipants.reduce((sum, p) => sum + (p.chargedAmount || p.pricePaid), 0);
        const commissionRate = deal.platformCommission || 5;
        const platformProfit = Math.round(totalRevenue * (commissionRate / 100));
        
        const createdAt = deal.createdAt ? new Date(deal.createdAt) : new Date();
        const closedAt = deal.closedAt ? new Date(deal.closedAt) : new Date(deal.endTime);
        const durationHours = Math.abs(closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        const totalQuantity = chargedParticipants.reduce((sum, p) => sum + (p.quantity || 1), 0);
        const avgUnitsPerCustomer = chargedParticipants.length > 0 
          ? totalQuantity / chargedParticipants.length 
          : 0;
        
        const completionRate = deal.targetParticipants > 0
          ? Math.round((chargedParticipants.length / deal.targetParticipants) * 100)
          : 0;
        
        return {
          id: deal.id,
          name: deal.name,
          category: deal.category,
          unitsSold: totalQuantity,
          totalParticipants: chargedParticipants.length,
          totalRevenue,
          avgPrice: chargedParticipants.length > 0 ? totalRevenue / chargedParticipants.length : 0,
          avgUnitsPerCustomer,
          duration: durationHours,
          completionRate,
          platformCommission: platformProfit,
          netRevenue: totalRevenue - platformProfit,
        };
      }));
      
      res.json(closedDealsWithStats);
    } catch (error) {
      console.error("Error fetching supplier closed deals:", error);
      res.status(500).json({ error: "Failed to fetch closed deals" });
    }
  });

  app.post("/api/email/test", isAdmin, async (req: Request, res: Response) => {
    try {
      const { to, subject, body } = req.body;
      
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields: to, subject, body" });
      }
      
      const success = await sendEmail({
        to,
        subject,
        htmlBody: body,
      });
      
      if (success) {
        res.json({ message: "Email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });

  app.get("/api/admin/users", isAdmin, async (_req: Request, res: Response) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        isAdmin: u.isAdmin,
        isSupplier: u.isSupplier,
        supplierCompanyName: u.supplierCompanyName,
        createdAt: u.createdAt,
      })));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/suppliers", isAdmin, async (_req: Request, res: Response) => {
    try {
      const allUsers = await db.select().from(users);
      const suppliers = allUsers.filter(u => u.isSupplier === "true");
      res.json(suppliers.map(s => ({
        id: s.id,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        companyName: s.supplierCompanyName,
        createdAt: s.createdAt,
      })));
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/admin/suppliers-with-deals", isAdmin, async (_req: Request, res: Response) => {
    try {
      const allUsers = await db.select().from(users);
      const suppliers = allUsers.filter(u => u.isSupplier === "true");
      const allDeals = await storage.getDeals();
      
      const suppliersWithDeals = suppliers.map(s => ({
        id: s.id,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        supplierCompanyName: s.supplierCompanyName,
        deals: allDeals.filter(d => d.supplierId === s.id),
      }));
      
      res.json(suppliersWithDeals);
    } catch (error) {
      console.error("Error fetching suppliers with deals:", error);
      res.status(500).json({ error: "Failed to fetch suppliers with deals" });
    }
  });

  app.post("/api/admin/users/:userId/toggle-supplier", isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { companyName } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const isCurrentlySupplier = user.isSupplier === "true";
      
      await storage.updateUser(userId, {
        isSupplier: isCurrentlySupplier ? null : "true",
        supplierCompanyName: isCurrentlySupplier ? null : (companyName || user.supplierCompanyName || null),
      });
      
      res.json({ 
        message: isCurrentlySupplier ? "User is no longer a supplier" : "User is now a supplier",
        isSupplier: !isCurrentlySupplier
      });
    } catch (error) {
      console.error("Error toggling supplier status:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/:userId/make-supplier", isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { companyName } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.updateUser(userId, {
        isSupplier: "true",
        supplierCompanyName: companyName || null,
      });
      
      res.json({ message: "User is now a supplier" });
    } catch (error) {
      console.error("Error making user supplier:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/admin/pending-deals", isAdmin, async (_req: Request, res: Response) => {
    try {
      // Query database directly to get ALL deals including inactive ones
      const { deals: dealsTable } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const pendingDeals = await db.select().from(dealsTable).where(eq(dealsTable.status, "pending"));
      res.json(pendingDeals);
    } catch (error) {
      console.error("Error fetching pending deals:", error);
      res.status(500).json({ error: "Failed to fetch pending deals" });
    }
  });

  app.post("/api/admin/deals/:dealId/approve", isAdmin, async (req: Request, res: Response) => {
    try {
      const { dealId } = req.params;
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      
      if (deal.status !== "pending") {
        return res.status(400).json({ error: "Can only approve pending deals" });
      }
      
      const updatedDeal = await storage.updateDeal(dealId, {
        status: "active",
        isActive: "true",
        approvedAt: new Date(),
      });
      
      if (updatedDeal) {
        dealClosureService.scheduleDealClosure(updatedDeal);
      }
      
      res.json(updatedDeal);
    } catch (error) {
      console.error("Error approving deal:", error);
      res.status(500).json({ error: "Failed to approve deal" });
    }
  });

  app.post("/api/admin/deals/:dealId/reject", isAdmin, async (req: Request, res: Response) => {
    try {
      const { dealId } = req.params;
      const { reason } = req.body;
      
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      
      if (deal.status !== "pending") {
        return res.status(400).json({ error: "Can only reject pending deals" });
      }
      
      const updatedDeal = await storage.updateDeal(dealId, {
        status: "draft",
      });
      
      res.json({ message: "Deal rejected and returned to draft", deal: updatedDeal });
    } catch (error) {
      console.error("Error rejecting deal:", error);
      res.status(500).json({ error: "Failed to reject deal" });
    }
  });

  app.get("/api/supplier/settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.isSupplier !== "true") {
        return res.status(403).json({ error: "Not a supplier" });
      }
      
      res.json({
        companyName: user.supplierCompanyName || "",
        bankDetails: user.supplierBankDetails || "",
        stripeAccountId: user.supplierStripeAccountId || "",
      });
    } catch (error) {
      console.error("Error fetching supplier settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/supplier/settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.isSupplier !== "true") {
        return res.status(403).json({ error: "Not a supplier" });
      }
      
      const { companyName, bankDetails, stripeAccountId } = req.body;
      
      await storage.updateUser(userId, {
        supplierCompanyName: companyName || null,
        supplierBankDetails: bankDetails || null,
        supplierStripeAccountId: stripeAccountId || null,
      });
      
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating supplier settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  return httpServer;
}
