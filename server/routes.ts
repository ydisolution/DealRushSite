import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDealSchema, insertParticipantSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { notificationService } from "./websocket";

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
  limits: { fileSize: 5 * 1024 * 1024 },
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);
  
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/user/purchases", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const purchases = await storage.getParticipantsByUser(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching user purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
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

  app.post("/api/deals", async (req: Request, res: Response) => {
    try {
      const body = {
        ...req.body,
        originalPrice: Number(req.body.originalPrice),
        currentPrice: Number(req.body.currentPrice),
        participants: Number(req.body.participants || 0),
        targetParticipants: Number(req.body.targetParticipants),
        endTime: new Date(req.body.endTime),
        tiers: req.body.tiers.map((t: any) => ({
          minParticipants: Number(t.minParticipants),
          maxParticipants: Number(t.maxParticipants),
          discount: Number(t.discount),
          price: t.price ? Number(t.price) : undefined,
        })),
      };
      
      const validated = insertDealSchema.parse(body);
      const deal = await storage.createDeal(validated);
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  app.patch("/api/deals/:id", async (req: Request, res: Response) => {
    try {
      const body: any = { ...req.body };
      if (body.originalPrice) body.originalPrice = Number(body.originalPrice);
      if (body.currentPrice) body.currentPrice = Number(body.currentPrice);
      if (body.participants) body.participants = Number(body.participants);
      if (body.targetParticipants) body.targetParticipants = Number(body.targetParticipants);
      if (body.endTime) body.endTime = new Date(body.endTime);
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
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  app.delete("/api/deals/:id", async (req: Request, res: Response) => {
    try {
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
  });

  app.post("/api/deals/:id/join", async (req: Request, res: Response) => {
    try {
      const dealId = req.params.id;
      
      const validationResult = joinDealSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { name, userId } = validationResult.data;
      
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }

      const existingParticipants = await storage.getParticipantsByDeal(dealId);
      const newPosition = existingParticipants.length + 1;
      
      const tier = deal.tiers.find(t => 
        newPosition >= t.minParticipants && newPosition <= t.maxParticipants
      ) || deal.tiers[deal.tiers.length - 1];
      
      const positionInTier = newPosition - tier.minParticipants;
      const tierRange = tier.maxParticipants - tier.minParticipants + 1;
      const positionRatio = positionInTier / tierRange;
      const priceVariance = (positionRatio - 0.5) * 0.05;
      const basePrice = tier.price || deal.originalPrice * (1 - tier.discount / 100);
      const pricePaid = Math.round(basePrice * (1 + priceVariance));
      
      const participantData = {
        dealId,
        name: name || "משתתף אנונימי",
        userId: userId || null,
        pricePaid,
        position: newPosition,
      };
      
      const participant = await storage.addParticipant(participantData);
      
      const updatedParticipants = await storage.getParticipantsByDeal(dealId);
      const newParticipantCount = updatedParticipants.length;
      
      const currentTier = deal.tiers.find(t => 
        newParticipantCount >= t.minParticipants && newParticipantCount <= t.maxParticipants
      ) || deal.tiers[deal.tiers.length - 1];
      
      const newCurrentPrice = currentTier.price || Math.round(deal.originalPrice * (1 - currentTier.discount / 100));
      
      await storage.updateDeal(dealId, { 
        participants: newParticipantCount,
        currentPrice: newCurrentPrice,
      });

      notificationService.notifyParticipantJoined(
        dealId,
        deal.name,
        participantData.name,
        newParticipantCount,
        newCurrentPrice
      );

      res.status(201).json({ 
        participant,
        newParticipantCount,
        newPrice: newCurrentPrice,
      });
    } catch (error) {
      console.error("Error joining deal:", error);
      res.status(500).json({ error: "Failed to join deal" });
    }
  });

  return httpServer;
}
