import { type Express, Request, Response } from "express";
import { db } from "./db";
import { 
  developers, 
  realEstateProjects, 
  projectTiers, 
  projectRegistrations,
  insertDeveloperSchema,
  insertRealEstateProjectSchema,
  insertProjectTierSchema,
  insertProjectRegistrationSchema
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

// Middleware to check if user is admin or developer
const isDeveloperOrAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Check if user is admin or has developer role
  // This should be enhanced based on your auth system
  next();
};

const isAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Check if user is admin - enhance this based on your auth
  next();
};

export function registerRealEstateRoutes(app: Express) {
  
  // ==================== PUBLIC ENDPOINTS ====================
  
  // Get all projects with filters
  app.get("/api/real-estate/projects", async (req: Request, res: Response) => {
    try {
      const {
        city,
        region,
        minPrice,
        maxPrice,
        propertyType,
        status,
        developerId,
        hasActiveTiers,
        page = "1",
        limit = "20"
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build query conditions
      const conditions: any[] = [];
      
      if (city) conditions.push(eq(realEstateProjects.city, city as string));
      if (region) conditions.push(eq(realEstateProjects.region, region as string));
      if (status) conditions.push(eq(realEstateProjects.status, status as string));
      if (developerId) conditions.push(eq(realEstateProjects.developerId, developerId as string));
      
      if (minPrice || maxPrice) {
        if (minPrice) {
          conditions.push(gte(realEstateProjects.marketPriceBaseline, parseInt(minPrice as string)));
        }
        if (maxPrice) {
          conditions.push(lte(realEstateProjects.marketPriceBaseline, parseInt(maxPrice as string)));
        }
      }

      const query = db
        .select()
        .from(realEstateProjects)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(realEstateProjects.createdAt))
        .limit(limitNum)
        .offset(offset);

      const projects = await query;

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(realEstateProjects)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Get registrant counts and tiers for each project
      const projectsWithDetails = await Promise.all(
        projects.map(async (project) => {
          const [{ registrantCount }] = await db
            .select({ registrantCount: sql<number>`count(*)` })
            .from(projectRegistrations)
            .where(eq(projectRegistrations.projectId, project.id));

          const tiers = await db
            .select()
            .from(projectTiers)
            .where(and(
              eq(projectTiers.projectId, project.id),
              eq(projectTiers.isActive, "true")
            ))
            .orderBy(projectTiers.sortOrder);

          // Get developer info
          const [developer] = await db
            .select()
            .from(developers)
            .where(eq(developers.id, project.developerId))
            .limit(1);

          // Calculate current tier
          let currentTier = null;
          let nextTier = null;
          for (let i = 0; i < tiers.length; i++) {
            if (registrantCount >= tiers[i].thresholdRegistrants) {
              currentTier = tiers[i];
            } else if (!nextTier) {
              nextTier = tiers[i];
              break;
            }
          }

          return {
            ...project,
            developer,
            registrantCount,
            tiers,
            currentTier,
            nextTier,
            currentPrice: currentTier?.fromPrice || tiers[0]?.fromPrice || project.marketPriceBaseline,
          };
        })
      );

      res.json({
        projects: projectsWithDetails,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: Number(count),
          totalPages: Math.ceil(Number(count) / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Get project by slug
  app.get("/api/real-estate/projects/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.slug, slug))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Get developer
      const [developer] = await db
        .select()
        .from(developers)
        .where(eq(developers.id, project.developerId))
        .limit(1);

      // Get tiers
      const tiers = await db
        .select()
        .from(projectTiers)
        .where(and(
          eq(projectTiers.projectId, project.id),
          eq(projectTiers.isActive, "true")
        ))
        .orderBy(projectTiers.sortOrder);

      // Get registrant count
      const [{ registrantCount }] = await db
        .select({ registrantCount: sql<number>`count(*)` })
        .from(projectRegistrations)
        .where(eq(projectRegistrations.projectId, project.id));

      // Calculate current tier
      let currentTier = null;
      let nextTier = null;
      for (let i = 0; i < tiers.length; i++) {
        if (registrantCount >= tiers[i].thresholdRegistrants) {
          currentTier = tiers[i];
        } else if (!nextTier) {
          nextTier = tiers[i];
          break;
        }
      }

      res.json({
        ...project,
        developer,
        tiers,
        registrantCount,
        currentTier,
        nextTier,
        currentPrice: currentTier?.fromPrice || tiers[0]?.fromPrice || project.marketPriceBaseline,
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Register for a project (lead submission)
  app.post("/api/real-estate/projects/:id/register", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId || null;

      // Validate project exists
      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.id, id))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const validationResult = insertProjectRegistrationSchema.safeParse({
        ...req.body,
        projectId: id,
        developerId: project.developerId,
        userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }

      const [registration] = await db
        .insert(projectRegistrations)
        .values(validationResult.data)
        .returning();

      // TODO: Send confirmation email/WhatsApp
      // TODO: Notify developer

      res.status(201).json(registration);
    } catch (error) {
      console.error("Error registering to project:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  // Get cities list
  app.get("/api/real-estate/cities", async (_req: Request, res: Response) => {
    try {
      const cities = await db
        .selectDistinct({ city: realEstateProjects.city })
        .from(realEstateProjects)
        .orderBy(realEstateProjects.city);

      res.json(cities.map(c => c.city));
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  // ==================== ADMIN/DEVELOPER ENDPOINTS ====================

  // Get all developers (admin only)
  app.get("/api/admin/developers", isAdmin, async (_req: Request, res: Response) => {
    try {
      const allDevelopers = await db
        .select()
        .from(developers)
        .orderBy(desc(developers.createdAt));

      res.json(allDevelopers);
    } catch (error) {
      console.error("Error fetching developers:", error);
      res.status(500).json({ error: "Failed to fetch developers" });
    }
  });

  // Create developer (admin only)
  app.post("/api/admin/developers", isAdmin, async (req: Request, res: Response) => {
    try {
      const validationResult = insertDeveloperSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }

      const [developer] = await db
        .insert(developers)
        .values(validationResult.data)
        .returning();

      res.status(201).json(developer);
    } catch (error) {
      console.error("Error creating developer:", error);
      res.status(500).json({ error: "Failed to create developer" });
    }
  });

  // Update developer
  app.put("/api/admin/developers/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validationResult = insertDeveloperSchema.partial().safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }

      const [updated] = await db
        .update(developers)
        .set({ ...validationResult.data, updatedAt: sql`now()` })
        .where(eq(developers.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Developer not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating developer:", error);
      res.status(500).json({ error: "Failed to update developer" });
    }
  });

  // Create project
  app.post("/api/admin/projects", isDeveloperOrAdmin, async (req: Request, res: Response) => {
    try {
      const validationResult = insertRealEstateProjectSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }

      const [project] = await db
        .insert(realEstateProjects)
        .values(validationResult.data)
        .returning();

      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Update project
  app.put("/api/admin/projects/:id", isDeveloperOrAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validationResult = insertRealEstateProjectSchema.partial().safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }

      const [updated] = await db
        .update(realEstateProjects)
        .set({ ...validationResult.data, updatedAt: sql`now()` })
        .where(eq(realEstateProjects.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // Create tier for project
  app.post("/api/admin/projects/:projectId/tiers", isDeveloperOrAdmin, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      
      const validationResult = insertProjectTierSchema.safeParse({
        ...req.body,
        projectId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }

      const [tier] = await db
        .insert(projectTiers)
        .values(validationResult.data)
        .returning();

      res.status(201).json(tier);
    } catch (error) {
      console.error("Error creating tier:", error);
      res.status(500).json({ error: "Failed to create tier" });
    }
  });

  // Get registrations for a project
  app.get("/api/admin/projects/:id/registrations", isDeveloperOrAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const registrations = await db
        .select()
        .from(projectRegistrations)
        .where(eq(projectRegistrations.projectId, id))
        .orderBy(desc(projectRegistrations.createdAt));

      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ error: "Failed to fetch registrations" });
    }
  });

  // Update registration status
  app.patch("/api/admin/registrations/:id/status", isDeveloperOrAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { funnelStatus } = req.body;

      if (!funnelStatus) {
        return res.status(400).json({ error: "Funnel status is required" });
      }

      const [updated] = await db
        .update(projectRegistrations)
        .set({ funnelStatus, updatedAt: sql`now()` })
        .where(eq(projectRegistrations.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating registration status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // ==================== MULTI-STAGE REGISTRATION FLOW ====================

  // Stage 1: Early Registration (רישום מוקדם)
  app.post("/api/real-estate/projects/:id/early-registration", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId || null;

      // Validate project exists and is in early registration stage
      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.id, id))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "פרויקט לא נמצא" });
      }

      // Check if user already registered
      if (userId) {
        const existing = await db
          .select()
          .from(projectRegistrations)
          .where(and(
            eq(projectRegistrations.projectId, id),
            eq(projectRegistrations.userId, userId)
          ))
          .limit(1);

        if (existing.length > 0) {
          return res.status(400).json({ error: "כבר נרשמת לפרויקט זה" });
        }
      }

      // Create registration
      const [registration] = await db
        .insert(projectRegistrations)
        .values({
          projectId: id,
          developerId: project.developerId,
          userId,
          fullName: req.body.fullName,
          phone: req.body.phone,
          email: req.body.email,
          unitTypeInterests: req.body.unitTypeInterests || [],
          budgetMin: req.body.budgetMin,
          budgetMax: req.body.budgetMax,
          equityEstimate: req.body.equityEstimate,
          hasMortgagePreApproval: req.body.hasMortgagePreApproval || "false",
          notes: req.body.notes,
          funnelStatus: "EARLY_REGISTERED",
          earlyRegisteredAt: sql`now()`,
          consentMarketing: req.body.consentMarketing || "false",
        })
        .returning();

      // TODO: Send confirmation email
      console.log("✅ Early registration created:", registration.id);

      res.status(201).json({ 
        message: "הרישום המוקדם התקבל בהצלחה",
        registration 
      });
    } catch (error) {
      console.error("Error in early registration:", error);
      res.status(500).json({ error: "שגיאה בשמירת הרישום" });
    }
  });

  // Stage 2: Event RSVP (אישור הגעה למצגת)
  app.post("/api/real-estate/projects/:id/event-rsvp", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      const { registrationId } = req.body;

      if (!userId && !registrationId) {
        return res.status(400).json({ error: "נדרש מזהה משתמש או רישום" });
      }

      // Find registration
      const conditions: any[] = [eq(projectRegistrations.projectId, id)];
      if (registrationId) {
        conditions.push(eq(projectRegistrations.id, registrationId));
      } else if (userId) {
        conditions.push(eq(projectRegistrations.userId, userId));
      }

      const [registration] = await db
        .select()
        .from(projectRegistrations)
        .where(and(...conditions))
        .limit(1);

      if (!registration) {
        return res.status(404).json({ error: "רישום לא נמצא" });
      }

      // Update to EVENT_RSVP
      const [updated] = await db
        .update(projectRegistrations)
        .set({
          funnelStatus: "EVENT_RSVP",
          eventRsvpAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(eq(projectRegistrations.id, registration.id))
        .returning();

      // TODO: Send calendar invite + reminder email
      console.log("✅ Event RSVP confirmed:", updated.id);

      res.json({ 
        message: "אישור הגעה נרשם בהצלחה",
        registration: updated 
      });
    } catch (error) {
      console.error("Error in event RSVP:", error);
      res.status(500).json({ error: "שגיאה באישור הגעה" });
    }
  });

  // Stage 3: Final Registration (רישום לרכישה - FOMO)
  app.post("/api/real-estate/projects/:id/final-registration", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;
      const { registrationId, consentDataTransfer, confirmedBudget, confirmedUnitTypes } = req.body;

      if (!userId && !registrationId) {
        return res.status(400).json({ error: "נדרש מזהה משתמש או רישום" });
      }

      if (!consentDataTransfer) {
        return res.status(400).json({ error: "נדרשת הסכמה להעברת מידע" });
      }

      // Validate project and check final registration window
      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.id, id))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "פרויקט לא נמצא" });
      }

      // Check if within final registration window
      const now = new Date();
      if (project.finalRegistrationStart && project.finalRegistrationEnd) {
        const start = new Date(project.finalRegistrationStart);
        const end = new Date(project.finalRegistrationEnd);

        if (now < start) {
          return res.status(400).json({ error: "חלון הרישום טרם נפתח" });
        }
        if (now > end) {
          return res.status(400).json({ error: "חלון הרישום נסגר" });
        }
      }

      // Find registration
      const conditions: any[] = [eq(projectRegistrations.projectId, id)];
      if (registrationId) {
        conditions.push(eq(projectRegistrations.id, registrationId));
      } else if (userId) {
        conditions.push(eq(projectRegistrations.userId, userId));
      }

      const [registration] = await db
        .select()
        .from(projectRegistrations)
        .where(and(...conditions))
        .limit(1);

      if (!registration) {
        return res.status(404).json({ error: "רישום לא נמצא. יש להירשם תחילה לרישום מוקדם" });
      }

      // Update to FINAL_REGISTERED
      const [updated] = await db
        .update(projectRegistrations)
        .set({
          funnelStatus: "FINAL_REGISTERED",
          finalRegisteredAt: sql`now()`,
          consentDataTransfer: "true",
          budgetMin: confirmedBudget?.min || registration.budgetMin,
          budgetMax: confirmedBudget?.max || registration.budgetMax,
          unitTypeInterests: confirmedUnitTypes || registration.unitTypeInterests,
          updatedAt: sql`now()`,
        })
        .where(eq(projectRegistrations.id, registration.id))
        .returning();

      // TODO: Send confirmation email
      // TODO: Notify developer and attorney
      console.log("✅ Final registration completed:", updated.id);

      res.json({ 
        message: "הרישום הסופי הושלם בהצלחה! נעביר את פרטיך לקבלן ולעו\"ד ספיר",
        registration: updated 
      });
    } catch (error) {
      console.error("Error in final registration:", error);
      res.status(500).json({ error: "שגיאה ברישום הסופי" });
    }
  });

  // Get user's status in a project
  app.get("/api/real-estate/projects/:id/my-status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      if (!userId) {
        return res.json({ registered: false, status: null });
      }

      const [registration] = await db
        .select()
        .from(projectRegistrations)
        .where(and(
          eq(projectRegistrations.projectId, id),
          eq(projectRegistrations.userId, userId)
        ))
        .limit(1);

      if (!registration) {
        return res.json({ registered: false, status: null });
      }

      res.json({ 
        registered: true, 
        status: registration.funnelStatus,
        registration 
      });
    } catch (error) {
      console.error("Error getting user status:", error);
      res.status(500).json({ error: "שגיאה בטעינת סטטוס" });
    }
  });

  // Get project stage info (public)
  app.get("/api/real-estate/projects/:id/stage", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.id, id))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "פרויקט לא נמצא" });
      }

      const now = new Date();
      let currentStage = "EARLY_REGISTRATION";
      let nextDate = null;
      let countdown = null;

      // Determine current stage based on dates
      if (project.finalRegistrationStart && project.finalRegistrationEnd) {
        const finalStart = new Date(project.finalRegistrationStart);
        const finalEnd = new Date(project.finalRegistrationEnd);

        if (now >= finalStart && now <= finalEnd) {
          currentStage = "FINAL_REGISTRATION";
          countdown = Math.floor((finalEnd.getTime() - now.getTime()) / 1000); // seconds
          nextDate = finalEnd;
        } else if (now > finalEnd) {
          currentStage = "POST_REGISTRATION";
        } else if (project.presentationEventDate) {
          const eventDate = new Date(project.presentationEventDate);
          if (now >= eventDate) {
            currentStage = "PRESENTATION";
            nextDate = finalStart;
          } else {
            currentStage = "EARLY_REGISTRATION";
            nextDate = eventDate;
          }
        }
      }

      res.json({
        currentStage,
        nextDate,
        countdown,
        earlyRegistrationStart: project.earlyRegistrationStart,
        presentationEventDate: project.presentationEventDate,
        finalRegistrationStart: project.finalRegistrationStart,
        finalRegistrationEnd: project.finalRegistrationEnd,
      });
    } catch (error) {
      console.error("Error getting project stage:", error);
      res.status(500).json({ error: "שגיאה בטעינת שלב הפרויקט" });
    }
  });

  // ==================== AI ASSISTANT ====================

  app.post("/api/ai/assistant", async (req: Request, res: Response) => {
    try {
      const { getAssistantResponse } = await import("./aiAssistant");
      
      const context = {
        userId: typeof req.session.userId === "string" ? req.session.userId : undefined, // Allow guest access
        sessionId: req.sessionID,
        projectId: req.body.projectId,
        pageContext: req.body.pageContext,
        userQuestion: req.body.question,
      };

      console.log("🤖 AI Assistant request:", {
        userId: context.userId,
        projectId: context.projectId,
        question: context.userQuestion?.substring(0, 50) + "..."
      });

      const response = await getAssistantResponse(context);

      console.log("✅ AI Assistant response:", {
        answerLength: response.answer?.length || 0,
        tokensUsed: response.tokensUsed
      });

      res.json(response);
    } catch (error) {
      console.error("❌ Error in AI assistant route:", error);
      res.status(500).json({ 
        error: "שגיאה בעוזר הוירטואלי",
        answer: "מצטער, נתקלתי בבעיה טכנית. ייתכן שחבילת OpenAI לא מותקנת. אנא הרץ: npm install openai"
      });
    }
  });

  // Quick help (micro-help tooltips)
  app.get("/api/ai/quick-help/:topic", async (req: Request, res: Response) => {
    try {
      const { getQuickHelp } = await import("./aiAssistant");
      const { topic } = req.params;

      const help = getQuickHelp(topic);

      res.json({ help });
    } catch (error) {
      console.error("Error in quick help:", error);
      res.status(500).json({ error: "שגיאה בטעינת עזרה" });
    }
  });

  // ==================== NEW REAL ESTATE FLOW ====================

  /**
   * Pre-Registration (Stage 1)
   * Any visitor can register before webinar
   */
  app.post("/api/real-estate/projects/:slug/pre-register", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { firstName, lastName, phone, email } = req.body;

      // Validate input
      if (!firstName || !lastName || !phone || !email) {
        return res.status(400).json({ error: "כל השדות נדרשים" });
      }

      // Get project
      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.slug, slug))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "פרויקט לא נמצא" });
      }

      // Check if already registered
      const [existing] = await db
        .select()
        .from(projectRegistrations)
        .where(and(
          eq(projectRegistrations.projectId, project.id),
          eq(projectRegistrations.email, email)
        ))
        .limit(1);

      if (existing) {
        return res.status(400).json({ error: "כבר נרשמת לפרויקט זה" });
      }

      // Create registration
      const [registration] = await db
        .insert(projectRegistrations)
        .values({
          projectId: project.id,
          developerId: project.developerId,
          userId: req.session.userId,
          fullName: `${firstName} ${lastName}`,
          firstName: firstName,
          lastName: lastName,
          phone,
          email,
          funnelStatus: "PRE_REGISTERED",
          earlyRegisteredAt: new Date(),
        })
        .returning();

      // Send welcome notifications
      const { sendWelcomeNotification } = await import("./notificationService");
      await sendWelcomeNotification(
        { firstName, lastName, phone, email },
        project.title
      );

      res.json({
        success: true,
        registration,
        message: "נרשמת בהצלחה! נעדכן אותך לגבי מועד המצגת.",
      });
    } catch (error) {
      console.error("Error in pre-registration:", error);
      res.status(500).json({ error: "שגיאה ביצירת הרשמה" });
    }
  });

  /**
   * Confirmation Window Registration (Stage 3 - FOMO)
   * After webinar, users confirm participation and select apartment type
   */
  app.post("/api/real-estate/projects/:slug/confirm-participation", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { firstName, lastName, phone, email, apartmentType } = req.body;

      // Validate input
      if (!firstName || !lastName || !phone || !email || !apartmentType) {
        return res.status(400).json({ error: "כל השדות נדרשים" });
      }

      // Get project
      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.slug, slug))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "פרויקט לא נמצא" });
      }

      // Check if confirmation window is open
      if (project.currentStage !== "FINAL_REGISTRATION") {
        return res.status(400).json({ error: "חלון אישור ההשתתפות לא פתוח כרגע" });
      }

      // Check capacity
      const totalCapacity = project.totalCapacity || 0;
      const waitingListCapacity = project.waitingListCapacity || Math.ceil(totalCapacity * 0.2);
      const maxTotal = totalCapacity + waitingListCapacity;

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projectRegistrations)
        .where(and(
          eq(projectRegistrations.projectId, project.id),
          sql`${projectRegistrations.funnelStatus} IN ('CONFIRMED_PARTICIPANT', 'WAITING_LIST')`
        ));

      if (count >= maxTotal) {
        return res.status(400).json({ error: "ההרשמה נסגרה - הושג מכסת המשתתפים" });
      }

      // Determine status and queue position
      const isWaitingList = count >= totalCapacity;
      const status = isWaitingList ? "WAITING_LIST" : "CONFIRMED_PARTICIPANT";
      const queuePosition = Number(count) + 1;

      // Check if user already confirmed
      const [existing] = await db
        .select()
        .from(projectRegistrations)
        .where(and(
          eq(projectRegistrations.projectId, project.id),
          eq(projectRegistrations.email, email)
        ))
        .limit(1);

      let registration;

      if (existing) {
        // Update existing registration
        [registration] = await db
          .update(projectRegistrations)
          .set({
            funnelStatus: status,
            selectedApartmentType: apartmentType,
            queuePosition,
            finalRegisteredAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(projectRegistrations.id, existing.id))
          .returning();
      } else {
        // Create new registration
        [registration] = await db
          .insert(projectRegistrations)
          .values({
            projectId: project.id,
            developerId: project.developerId,
            userId: req.session.userId,
            fullName: `${firstName} ${lastName}`,
            firstName,
            lastName,
            phone,
            email,
            funnelStatus: status,
            selectedApartmentType: apartmentType,
            queuePosition,
            finalRegisteredAt: new Date(),
          })
          .returning();
      }

      // Update project counts
      await db
        .update(realEstateProjects)
        .set({
          currentRegistrantCount: isWaitingList 
            ? project.currentRegistrantCount 
            : (project.currentRegistrantCount || 0) + 1,
          currentWaitingListCount: isWaitingList
            ? (project.currentWaitingListCount || 0) + 1
            : project.currentWaitingListCount,
          updatedAt: new Date(),
        })
        .where(eq(realEstateProjects.id, project.id));

      res.json({
        success: true,
        registration,
        queuePosition,
        isWaitingList,
        message: isWaitingList 
          ? `נרשמת לרשימת המתנה. מיקום בתור: ${queuePosition}`
          : `אישור השתתפות התקבל! מיקום בתור: ${queuePosition}`,
      });
    } catch (error) {
      console.error("Error in confirmation:", error);
      res.status(500).json({ error: "שגיאה באישור השתתפות" });
    }
  });

  /**
   * Get user's own registration for a project
   */
  app.get("/api/real-estate/projects/:slug/my-registration", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.slug, slug))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "פרויקט לא נמצא" });
      }

      const [registration] = await db
        .select()
        .from(projectRegistrations)
        .where(and(
          eq(projectRegistrations.projectId, project.id),
          eq(projectRegistrations.userId, userId)
        ))
        .limit(1);

      if (!registration) {
        return res.json(null);
      }

      res.json(registration);
    } catch (error) {
      console.error("Error getting user registration:", error);
      res.status(500).json({ error: "שגיאה בשליפת נתוני הרשמה" });
    }
  });

  /**
   * Get participants list (public display - initials + last 4 of phone)
   */
  app.get("/api/real-estate/projects/:slug/participants", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.slug, slug))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "פרויקט לא נמצא" });
      }

      const participants = await db
        .select({
          id: projectRegistrations.id,
          queuePosition: projectRegistrations.queuePosition,
          selectedApartmentType: projectRegistrations.selectedApartmentType,
          funnelStatus: projectRegistrations.funnelStatus,
          firstName: projectRegistrations.firstName,
          lastName: projectRegistrations.lastName,
          phone: projectRegistrations.phone,
          finalRegisteredAt: projectRegistrations.finalRegisteredAt,
          earlyRegisteredAt: projectRegistrations.earlyRegisteredAt,
          createdAt: projectRegistrations.createdAt,
        })
        .from(projectRegistrations)
        .where(and(
          eq(projectRegistrations.projectId, project.id),
          sql`${projectRegistrations.funnelStatus} IN ('PRE_REGISTERED', 'CONFIRMED_PARTICIPANT', 'WAITING_LIST')`
        ))
        .orderBy(projectRegistrations.createdAt);

      // Format for public display
      const publicParticipants = participants.map(p => ({
        queuePosition: p.queuePosition,
        initials: `${p.firstName?.charAt(0) || ''}${p.lastName?.charAt(0) || ''}`,
        phoneLast4: p.phone?.slice(-4) || '****',
        apartmentType: p.selectedApartmentType,
        status: p.funnelStatus,
        registeredAt: p.finalRegisteredAt || p.earlyRegisteredAt || p.createdAt,
      }));

      res.json({
        participants: publicParticipants,
        totalConfirmed: publicParticipants.filter(p => p.status === 'CONFIRMED_PARTICIPANT').length,
        totalWaitingList: publicParticipants.filter(p => p.status === 'WAITING_LIST').length,
        capacity: project.totalCapacity,
        waitingListCapacity: project.waitingListCapacity,
      });
    } catch (error) {
      console.error("Error getting participants:", error);
      res.status(500).json({ error: "שגיאה בטעינת רשימת משתתפים" });
    }
  });

  /**
   * Admin: Send webinar invitations
   */
  app.post("/api/real-estate/projects/:slug/send-webinar-invitations", isAdmin, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { webinarDate, webinarLink } = req.body;

      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.slug, slug))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "פרויקט לא נמצא" });
      }

      // Get all pre-registered users
      const preRegistered = await db
        .select()
        .from(projectRegistrations)
        .where(and(
          eq(projectRegistrations.projectId, project.id),
          eq(projectRegistrations.funnelStatus, "PRE_REGISTERED")
        ));

      // Send invitations
      const { notificationService } = await import("./notificationService");
      const { sendWebinarInvitation } = await import("./notificationService");

      for (const reg of preRegistered) {
        await sendWebinarInvitation(
          {
            firstName: reg.firstName || '',
            lastName: reg.lastName || '',
            email: reg.email,
            phone: reg.phone,
          },
          project.title,
          new Date(webinarDate),
          webinarLink
        );

        // Mark as sent
        await db
          .update(projectRegistrations)
          .set({
            webinarInviteSent: "true",
            webinarInviteSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(projectRegistrations.id, reg.id));
      }

      res.json({
        success: true,
        sent: preRegistered.length,
        message: `נשלחו ${preRegistered.length} הזמנות`,
      });
    } catch (error) {
      console.error("Error sending invitations:", error);
      res.status(500).json({ error: "שגיאה בשליחת הזמנות" });
    }
  });

  /**
   * Admin: Close registration and notify all
   */
  app.post("/api/real-estate/projects/:slug/close-registration", isAdmin, async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const [project] = await db
        .select()
        .from(realEstateProjects)
        .where(eq(realEstateProjects.slug, slug))
        .limit(1);

      if (!project) {
        return res.status(404).json({ error: "פרויקט לא נמצא" });
      }

      // Update project status
      await db
        .update(realEstateProjects)
        .set({
          currentStage: "POST_REGISTRATION",
          status: "closed",
          updatedAt: new Date(),
        })
        .where(eq(realEstateProjects.id, project.id));

      // Get all confirmed participants
      const participants = await db
        .select()
        .from(projectRegistrations)
        .where(and(
          eq(projectRegistrations.projectId, project.id),
          sql`${projectRegistrations.funnelStatus} IN ('CONFIRMED_PARTICIPANT', 'WAITING_LIST')`
        ));

      // Send closure notifications
      const { sendRegistrationClosureNotification } = await import("./notificationService");

      for (const reg of participants) {
        await sendRegistrationClosureNotification(
          {
            firstName: reg.firstName || '',
            lastName: reg.lastName || '',
            email: reg.email,
            phone: reg.phone,
          },
          project.title,
          reg.queuePosition || 0,
          reg.selectedApartmentType || '',
          reg.funnelStatus === 'WAITING_LIST'
        );
      }

      res.json({
        success: true,
        notified: participants.length,
        message: "ההרשמה נסגרה והודעות נשלחו לכל המשתתפים",
      });
    } catch (error) {
      console.error("Error closing registration:", error);
      res.status(500).json({ error: "שגיאה בסגירת ההרשמה" });
    }
  });
}
