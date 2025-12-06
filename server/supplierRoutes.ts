import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { insertDealSchema, DealStatus } from "@shared/schema";
import type { Deal, Participant } from "@shared/schema";
import { z } from "zod";

const router = Router();

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ error: "לא מחובר" });
  }
}

async function isSupplier(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "לא מחובר" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (user?.isSupplier === "true") {
      next();
    } else {
      res.status(403).json({ error: "גישה לספקים בלבד" });
    }
  } catch {
    res.status(500).json({ error: "שגיאה בבדיקת הרשאות" });
  }
}

interface DealAggregates {
  totalUnits: number;
  grossRevenue: number;
  commission: number;
  netRevenue: number;
  avgUnitPrice: number;
  customerCount: number;
}

function calculateDealAggregates(deal: Deal, participants: Participant[]): DealAggregates {
  const totalUnits = participants.reduce((sum, p) => sum + (p.quantity || 1), 0);
  const grossRevenue = participants.reduce((sum, p) => sum + (p.chargedAmount || p.pricePaid), 0);
  const commissionRate = (deal.platformCommission || 5) / 100;
  const commission = grossRevenue * commissionRate;
  const netRevenue = grossRevenue - commission;
  const avgUnitPrice = totalUnits > 0 ? grossRevenue / totalUnits : 0;
  
  return {
    totalUnits,
    grossRevenue,
    commission,
    netRevenue,
    avgUnitPrice,
    customerCount: participants.length,
  };
}

router.get("/deals", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const allDeals = await storage.getDeals();
    const supplierDeals = allDeals.filter((d: Deal) => d.supplierId === supplierId);
    
    const dealsWithAggregates = await Promise.all(
      supplierDeals.map(async (deal) => {
        const participants = await storage.getParticipantsByDeal(deal.id);
        const aggregates = calculateDealAggregates(deal, participants);
        return { ...deal, aggregates };
      })
    );
    
    res.json(dealsWithAggregates);
  } catch (error) {
    console.error("Error fetching supplier deals:", error);
    res.status(500).json({ error: "שגיאה בטעינת הדילים" });
  }
});

router.get("/deals/:id", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const deal = await storage.getDeal(req.params.id);
    
    if (!deal) {
      return res.status(404).json({ error: "דיל לא נמצא" });
    }
    
    if (deal.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה לדיל זה" });
    }
    
    const participants = await storage.getParticipantsByDeal(deal.id);
    const aggregates = calculateDealAggregates(deal, participants);
    
    const customers = participants.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      unitsPurchased: p.quantity || 1,
      unitPricePaid: p.pricePaid,
      purchasedAt: p.joinedAt,
      paymentStatus: p.paymentStatus,
      chargedAmount: p.chargedAmount,
    }));
    
    res.json({ ...deal, aggregates, customers });
  } catch (error) {
    console.error("Error fetching deal details:", error);
    res.status(500).json({ error: "שגיאה בטעינת פרטי הדיל" });
  }
});

const createDealSchema = z.object({
  name: z.string().min(1, "שם הדיל הוא שדה חובה"),
  description: z.string().optional(),
  category: z.string().min(1, "קטגוריה היא שדה חובה"),
  originalPrice: z.number().positive("מחיר חייב להיות חיובי"),
  costPrice: z.number().positive("מחיר עלות חייב להיות חיובי").optional(),
  targetParticipants: z.number().int().positive(),
  minParticipants: z.number().int().positive().optional(),
  endTime: z.string(),
  tiers: z.array(z.object({
    minParticipants: z.number().min(0),
    maxParticipants: z.number().min(1),
    discount: z.number().min(0).max(100),
    price: z.number().optional(),
    commission: z.number().min(0).max(100).optional(),
  })).min(1, "יש להגדיר לפחות מדרגה אחת"),
  images: z.array(z.string()).optional(),
  specs: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
});

router.post("/deals", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const user = await storage.getUser(supplierId);
    
    const parsed = createDealSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "נתונים לא תקינים", 
        details: parsed.error.errors 
      });
    }
    
    const data = parsed.data;
    const endTime = new Date(data.endTime);
    
    const currentPrice = data.tiers[0]?.price || 
      Math.round(data.originalPrice * (1 - (data.tiers[0]?.discount || 0) / 100));
    
    const newDeal = await storage.createDeal({
      name: data.name,
      description: data.description || "",
      category: data.category,
      images: data.images || [],
      originalPrice: data.originalPrice,
      currentPrice,
      costPrice: data.costPrice,
      targetParticipants: data.targetParticipants,
      minParticipants: data.minParticipants || 1,
      endTime,
      tiers: data.tiers,
      specs: data.specs || [],
      isActive: "false",
      status: DealStatus.DRAFT,
      supplierId,
      supplierName: user?.supplierCompanyName || `${user?.firstName} ${user?.lastName}`,
      supplierStripeKey: user?.supplierStripeAccountId || null,
      supplierBankAccount: user?.supplierBankDetails || null,
      platformCommission: 5,
    });
    
    res.status(201).json(newDeal);
  } catch (error) {
    console.error("Error creating supplier deal:", error);
    res.status(500).json({ error: "שגיאה ביצירת הדיל" });
  }
});

router.patch("/deals/:id", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const deal = await storage.getDeal(req.params.id);
    
    if (!deal) {
      return res.status(404).json({ error: "דיל לא נמצא" });
    }
    
    if (deal.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה לדיל זה" });
    }
    
    if (deal.status !== DealStatus.DRAFT) {
      return res.status(400).json({ error: "אפשר לערוך רק דילים בטיוטה" });
    }
    
    const updatedDeal = await storage.updateDeal(deal.id, req.body);
    res.json(updatedDeal);
  } catch (error) {
    console.error("Error updating supplier deal:", error);
    res.status(500).json({ error: "שגיאה בעדכון הדיל" });
  }
});

router.post("/deals/:id/submit", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const deal = await storage.getDeal(req.params.id);
    
    if (!deal) {
      return res.status(404).json({ error: "דיל לא נמצא" });
    }
    
    if (deal.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה לדיל זה" });
    }
    
    if (deal.status !== DealStatus.DRAFT) {
      return res.status(400).json({ error: "אפשר לשלוח לאישור רק דיל בסטטוס טיוטה" });
    }
    
    const updatedDeal = await storage.updateDeal(deal.id, { status: DealStatus.PENDING });
    res.json(updatedDeal);
  } catch (error) {
    console.error("Error submitting deal for approval:", error);
    res.status(500).json({ error: "שגיאה בשליחה לאישור" });
  }
});

router.get("/stats", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const allDeals = await storage.getDeals();
    const supplierDeals = allDeals.filter((d: Deal) => d.supplierId === supplierId);
    
    let totalUnits = 0;
    let grossRevenue = 0;
    let totalCommission = 0;
    let netRevenue = 0;
    
    for (const deal of supplierDeals) {
      const participants = await storage.getParticipantsByDeal(deal.id);
      const aggregates = calculateDealAggregates(deal, participants);
      totalUnits += aggregates.totalUnits;
      grossRevenue += aggregates.grossRevenue;
      totalCommission += aggregates.commission;
      netRevenue += aggregates.netRevenue;
    }
    
    const activeDeals = supplierDeals.filter((d: Deal) => d.status === "active" || d.status === "live").length;
    const pendingDeals = supplierDeals.filter((d: Deal) => d.status === "pending").length;
    const draftDeals = supplierDeals.filter((d: Deal) => d.status === "draft").length;
    const closedDeals = supplierDeals.filter((d: Deal) => d.status === "closed").length;
    
    res.json({
      totalDeals: supplierDeals.length,
      activeDeals,
      pendingDeals,
      draftDeals,
      closedDeals,
      totalUnits,
      grossRevenue,
      totalCommission,
      netRevenue,
    });
  } catch (error) {
    console.error("Error fetching supplier stats:", error);
    res.status(500).json({ error: "שגיאה בטעינת הסטטיסטיקות" });
  }
});

export default router;
