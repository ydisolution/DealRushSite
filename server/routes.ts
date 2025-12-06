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
import { sendDealJoinNotification, sendPriceDropNotification, sendDealClosedNotification, sendEmail } from "./email";
import supplierRoutes from "./supplierRoutes";
import { registerUser, loginUser, verifyEmailByUserId, requestPasswordReset, resetPassword, resendVerificationEmail } from "./auth";
import MemoryStore from "memorystore";
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
  
  app.use(session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000,
    }),
    secret: process.env.SESSION_SECRET || "dealrush-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }));
  
  // Setup Social Auth (Google, Facebook)
  await setupSocialAuth(app);
  
  // Create admin user on startup
  await createAdminUser();
  
  // Create supplier user 'Dreamer' on startup
  await createSupplierUser();
  
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

  app.post("/api/auth/register", async (req: Request, res: Response) => {
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
        const verificationUrl = `${req.protocol}://${req.get("host")}/verify-email?token=${result.verificationToken}&userId=${result.user.id}`;
        
        await sendEmail({
          to: email,
          subject: "אימות כתובת המייל - DealRush",
          htmlBody: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #7c3aed;">ברוכים הבאים ל-DealRush!</h1>
              <p>שלום ${firstName || ""},</p>
              <p>תודה שנרשמת לפלטפורמה שלנו. כדי להשלים את ההרשמה, אנא אמת את כתובת המייל שלך:</p>
              <a href="${verificationUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                אמת את המייל שלי
              </a>
              <p>או העתק את הקישור הבא:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p>הקישור תקף ל-24 שעות.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
              <p style="color: #666; font-size: 12px;">אם לא נרשמת ל-DealRush, אנא התעלם מהודעה זו.</p>
            </div>
          `,
        });
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

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: validation.error.errors[0]?.message || "Validation failed" 
        });
      }

      const { email, password } = validation.data;
      const result = await loginUser(email, password);

      if (!result.success) {
        return res.status(401).json({ error: result.error });
      }

      req.session.userId = result.user!.id;

      res.json({ 
        message: "התחברת בהצלחה!",
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
      console.error("Login error:", error);
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

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
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

  app.get("/api/stripe/publishable-key", async (_req: Request, res: Response) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error fetching Stripe publishable key:", error);
      res.status(500).json({ error: "Stripe not configured" });
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
      res.json(deals);
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
      res.json(deals);
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
      
      const validationResult = joinDealSchema.safeParse(req.body);
      if (!validationResult.success) {
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
      
      const participantName = name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "משתתף אנונימי";
      const participantEmail = email || user.email;
      const participantPhone = phone || user.phone || null;
      
      const createdParticipants = [];
      let firstParticipant = null;
      
      for (let i = 0; i < quantity; i++) {
        const newPosition = existingParticipants.length + createdParticipants.length + 1;
        
        const tierIndex = deal.tiers.findIndex(t => 
          newPosition >= t.minParticipants && newPosition <= t.maxParticipants
        );
        const tier = deal.tiers[tierIndex !== -1 ? tierIndex : deal.tiers.length - 1];
        
        const positionInTier = newPosition - tier.minParticipants;
        const tierRange = tier.maxParticipants - tier.minParticipants + 1;
        const positionRatio = positionInTier / tierRange;
        const priceVariance = (positionRatio - 0.5) * 0.05;
        const basePrice = tier.price || deal.originalPrice * (1 - tier.discount / 100);
        const pricePaid = Math.round(basePrice * (1 + priceVariance));
        
        const participantData = {
          dealId,
          name: quantity > 1 ? `${participantName} (יחידה ${i + 1}/${quantity})` : participantName,
          userId: sessionUserId,
          email: participantEmail,
          phone: participantPhone,
          pricePaid,
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
        sendDealJoinNotification(
          participantEmail, 
          deal.name, 
          totalPaid, 
          firstPosition,
          quantity
        ).catch(err => {
          console.error("Failed to send join notification email:", err);
        });
      }

      res.status(201).json({ 
        participant: firstParticipant,
        participants: createdParticipants,
        quantity,
        newParticipantCount,
        newPrice: newCurrentPrice,
      });
    } catch (error) {
      console.error("Error joining deal:", error);
      res.status(500).json({ error: "Failed to join deal" });
    }
  });

  const registerWithoutPaymentSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    quantity: z.number().int().min(1).max(10).optional().default(1),
  });

  app.post("/api/deals/:id/register-without-payment", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const dealId = req.params.id;
      const sessionUserId = req.session.userId!;
      
      const validationResult = registerWithoutPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { name, email, phone, quantity } = validationResult.data;
      
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
      
      const existingUserParticipation = existingParticipants.find(p => p.userId === sessionUserId);
      if (existingUserParticipation) {
        return res.status(400).json({ error: "כבר נרשמת לדיל זה" });
      }
      
      const participantName = name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "משתתף אנונימי";
      const participantEmail = email || user.email;
      const participantPhone = phone || user.phone || null;
      
      const totalUnitsSold = existingParticipants.reduce((sum, p) => sum + (p.quantity || 1), 0);
      
      const createdParticipants = [];
      let firstParticipant = null;
      
      for (let i = 0; i < quantity; i++) {
        const newUnitPosition = totalUnitsSold + i + 1;
        const newPosition = existingParticipants.length + (i === 0 ? 1 : 0);
        
        const tierIndex = deal.tiers.findIndex(t => 
          newUnitPosition >= t.minParticipants && newUnitPosition <= t.maxParticipants
        );
        
        let effectivePrice = deal.originalPrice;
        if (tierIndex !== -1) {
          const tier = deal.tiers[tierIndex];
          effectivePrice = tier.price || Math.round(deal.originalPrice * (1 - tier.discount / 100));
        } else if (newUnitPosition < deal.tiers[0]?.minParticipants) {
          effectivePrice = deal.originalPrice;
        }
        
        const participantData = {
          dealId,
          name: quantity > 1 ? `${participantName} (יחידה ${i + 1}/${quantity})` : participantName,
          userId: sessionUserId,
          email: participantEmail,
          phone: participantPhone,
          quantity: i === 0 ? quantity : 0,
          pricePaid: effectivePrice,
          position: newPosition,
          paymentStatus: "pending_paypal",
          tierAtJoin: tierIndex !== -1 ? tierIndex : null,
        };
        
        if (i === 0) {
          const participant = await storage.addParticipant(participantData);
          createdParticipants.push(participant);
          firstParticipant = participant;
        }
      }
      
      const newTotalUnits = totalUnitsSold + quantity;
      const newParticipantCount = existingParticipants.length + 1;
      
      const newTierIndex = deal.tiers.findIndex(t => 
        newTotalUnits >= t.minParticipants && newTotalUnits <= t.maxParticipants
      );
      
      let newCurrentPrice = deal.originalPrice;
      if (newTierIndex !== -1) {
        const currentTier = deal.tiers[newTierIndex];
        newCurrentPrice = currentTier.price || Math.round(deal.originalPrice * (1 - currentTier.discount / 100));
      } else if (newTotalUnits < deal.tiers[0]?.minParticipants) {
        newCurrentPrice = deal.originalPrice;
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

      const previousTierIndex = totalUnitsSold > 0 
        ? deal.tiers.findIndex(t => totalUnitsSold >= t.minParticipants && totalUnitsSold <= t.maxParticipants)
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
        const totalPrice = quantity * (firstParticipant?.pricePaid || deal.originalPrice);
        sendDealJoinNotification(
          participantEmail, 
          deal.name, 
          totalPrice, 
          firstParticipant?.position || 1,
          quantity
        ).catch(err => {
          console.error("Failed to send join notification email:", err);
        });
      }

      res.status(201).json({ 
        participant: firstParticipant,
        quantity,
        newParticipantCount,
        newTotalUnits,
        newPrice: newCurrentPrice,
        message: "נרשמת בהצלחה! קישור לתשלום יישלח לאימייל שלך"
      });
    } catch (error) {
      console.error("Error registering for deal:", error);
      res.status(500).json({ error: "Failed to register for deal" });
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

  // Get closed deals with comprehensive statistics
  app.get("/api/admin/closed-deals", isAdmin, async (req: Request, res: Response) => {
    try {
      const allDeals = await storage.getDeals();
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
          endTime: deal.endTime,
          supplierName: deal.supplierName,
          tiers: deal.tiers,
          
          unitsSold: chargedParticipants.length,
          totalParticipants: dealParticipants.length,
          targetParticipants: deal.targetParticipants,
          minParticipants: deal.minParticipants,
          
          totalRevenue,
          totalOriginalValue,
          totalSavings,
          avgDiscount,
          platformCommission: commissionRate,
          platformProfit,
          vendorPayout: totalRevenue - platformProfit,
          
          participants: dealParticipants.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            position: p.position,
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
      const allDeals = await storage.getDeals();
      const pendingDeals = allDeals.filter(d => d.status === "pending");
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

  return httpServer;
}
