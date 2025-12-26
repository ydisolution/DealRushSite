import { Router, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { insertDealSchema, DealStatus } from "@shared/schema";
import type { Deal, Participant } from "@shared/schema";
import { z } from "zod";
import { notificationService } from "./websocket";
import { whatsappService } from "./whatsappService";

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
    // Query database directly to get ALL supplier deals including pending/draft
    const { deals: dealsTable } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    const { db } = await import("./db");
    const supplierDeals = await db.select().from(dealsTable).where(eq(dealsTable.supplierId, supplierId));
    
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
    
    // Group participants by email to show consolidated customer orders
    const customerMap = new Map<string, any>();
    
    for (const p of participants) {
      const email = p.email || p.id;
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          unitsPurchased: 0,
          unitPricePaid: p.pricePaid,
          totalPaid: 0,
          purchasedAt: p.joinedAt,
          paymentStatus: p.paymentStatus,
          chargedAmount: p.chargedAmount,
          needsShipping: p.needsShipping,
          shippingAddress: p.shippingAddress,
          shippingCity: p.shippingCity,
          shippingZipCode: p.shippingZipCode,
          shippingCost: p.shippingCost || 0,
          units: [],
        });
      }
      
      const customer = customerMap.get(email);
      customer.unitsPurchased += (p.quantity || 1);
      customer.totalPaid += (p.chargedAmount || p.pricePaid);
      customer.units.push({
        id: p.id,
        position: p.position,
        pricePaid: p.pricePaid,
        quantity: p.quantity || 1,
      });
    }
    
    const customers = Array.from(customerMap.values());
    
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
      status: DealStatus.PENDING,
      supplierId,
      supplierName: user?.supplierCompanyName || `${user?.firstName} ${user?.lastName}`,
      supplierStripeKey: user?.supplierStripeAccountId || null,
      supplierBankAccount: user?.supplierBankDetails || null,
      platformCommission: 5,
    });
    
    // Notify admin via WebSocket about new deal pending approval
    notificationService.broadcast({
      type: "deal_pending_approval" as any,
      dealId: newDeal.id,
      dealName: newDeal.name,
      supplierName: newDeal.supplierName,
      supplierId: supplierId
    });
    
    // Send confirmation email to supplier
    if (user?.email) {
      const { sendEmail } = await import("./email");
      try {
        await sendEmail({
          to: user.email,
          subject: `הדיל "${newDeal.name}" נוצר בהצלחה ונשלח לאישור`,
          htmlBody: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #7c3aed;">הדיל נוצר בהצלחה! 🎉</h1>
              <p>שלום ${user.firstName || ""},</p>
              <p>הדיל <strong>${newDeal.name}</strong> נוצר בהצלחה ונשלח לאישור המנהל.</p>
              <p>תקבל הודעה ברגע שהדיל יאושר ויעלה לאוויר.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
              <p style="color: #666; font-size: 12px;">תודה ששותף ב-DealRush!</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error("Error sending deal creation email:", emailError);
      }
    }
    
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
    
    // Notify admin via WebSocket about new deal pending approval
    notificationService.broadcast({
      type: "deal_pending_approval" as any,
      dealId: deal.id,
      dealName: deal.name,
      supplierName: deal.supplierName,
      supplierId: supplierId
    });
    
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

// Analytics endpoint
router.get("/analytics", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const user = await storage.getUser(supplierId);
    
    // Get all supplier deals
    const supplierDeals = await storage.getDeals();
    const dealIds = supplierDeals
      .filter(d => d.supplierId === supplierId)
      .map(d => d.id);

    // Import analytics service dynamically to avoid circular dependencies
    const { analyticsService } = await import('./analyticsService');
    const analytics = await analyticsService.getSupplierAnalytics(supplierId, dealIds);

    res.json(analytics);
  } catch (error) {
    console.error("Error fetching supplier analytics:", error);
    res.status(500).json({ error: "שגיאה בטעינת הסטטיסטיקות" });
  }
});

// ==================== ORDER MANAGEMENT ROUTES ====================

// Get all orders for supplier
router.get("/orders", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { status, dealId, search } = req.query;

    const filters = {
      status: status as string | undefined,
      dealId: dealId as string | undefined,
      search: search as string | undefined,
    };

    const orders = await storage.getOrdersBySupplier(supplierId, filters);

    // Enrich orders with deal and participant details
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
          initialPrice: participant?.initialPrice || participant?.pricePaid || 0,
          position: participant?.position || 0,
          totalAmount: participant?.chargedAmount || participant?.pricePaid || 0,
        };
      })
    );

    res.json(enrichedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "שגיאה בטעינת ההזמנות" });
  }
});

// Get specific order details
router.get("/orders/:orderId", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { orderId } = req.params;

    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "הזמנה לא נמצאה" });
    }

    if (order.supplierId !== supplierId) {
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

// Update order status
router.patch("/orders/:orderId/status", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "סטטוס הוא שדה חובה" });
    }

    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "הזמנה לא נמצאה" });
    }

    if (order.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה להזמנה זו" });
    }

    // Update order
    const updatedOrder = await storage.updateOrder(orderId, { status });

    // Create event
    const eventMessages: Record<string, string> = {
      verified: 'ההזמנה אומתה על ידי הספק',
      scheduled: 'המשלוח תוזמן',
      out_for_delivery: 'המוצר יצא למשלוח',
      delivered: 'המוצר נמסר ללקוח',
      cancelled: 'ההזמנה בוטלה',
    };

    await storage.createFulfillmentEvent({
      orderId,
      type: `status_${status}`,
      message: eventMessages[status] || `הסטטוס שונה ל-${status}`,
      createdBySupplierId: supplierId,
    });

    // Send notifications to customer
    if (order.customerEmail) {
      const { sendOrderStatusUpdateEmail } = await import('./email');
      sendOrderStatusUpdateEmail(
        order.customerEmail,
        order.customerName,
        status,
        eventMessages[status] || `הסטטוס שונה ל-${status}`
      ).catch(err => console.error('Failed to send email:', err));
    }

    // Send WhatsApp notification
    if (order.customerPhone && whatsappService.isEnabled()) {
      const statusEmojiMap: Record<string, string> = {
        verified: '✅',
        needs_coordination: '📞',
        scheduled: '📅',
        out_for_delivery: '🚚',
        delivered: '✅',
        cancelled: '❌',
      };

      const statusTextMap: Record<string, string> = {
        verified: 'תשלום אומת',
        needs_coordination: 'דרוש תיאום',
        scheduled: 'משלוח תוזמן',
        out_for_delivery: 'יצא למשלוח',
        delivered: 'נמסר ללקוח',
        cancelled: 'בוטל',
      };

      whatsappService.sendOrderStatusUpdate(
        order.customerPhone,
        order.customerName,
        orderId,
        order.dealName,
        status,
        statusEmojiMap[status] || '📦',
        statusTextMap[status] || status
      ).catch(err => console.error('Failed to send WhatsApp:', err));
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "שגיאה בעדכון סטטוס ההזמנה" });
  }
});

// Schedule delivery
router.patch("/orders/:orderId/schedule", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { orderId } = req.params;
    const { deliveryDate, note } = req.body;

    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "הזמנה לא נמצאה" });
    }

    if (order.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה להזמנה זו" });
    }

    const updatedOrder = await storage.updateOrder(orderId, {
      scheduledDeliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      status: 'scheduled',
    });

    await storage.createFulfillmentEvent({
      orderId,
      type: 'delivery_scheduled',
      message: `משלוח תוזמן ל-${new Date(deliveryDate).toLocaleDateString('he-IL')}${note ? ': ' + note : ''}`,
      createdBySupplierId: supplierId,
    });

    // Send WhatsApp notification
    if (order.customerPhone && whatsappService.isEnabled() && deliveryDate) {
      const scheduledDate = new Date(deliveryDate).toLocaleDateString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      whatsappService.sendOrderStatusUpdate(
        order.customerPhone,
        order.customerName,
        orderId,
        order.dealName,
        'scheduled',
        '📅',
        `משלוח תוזמן ל-${scheduledDate}`
      ).catch(err => console.error('Failed to send WhatsApp:', err));
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error scheduling delivery:", error);
    res.status(500).json({ error: "שגיאה בתזמון המשלוח" });
  }
});

// Mark as out for delivery
router.patch("/orders/:orderId/out-for-delivery", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { orderId } = req.params;
    const { shippingMethod, carrier, trackingNumber, note } = req.body;

    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "הזמנה לא נמצאה" });
    }

    if (order.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה להזמנה זו" });
    }

    const updatedOrder = await storage.updateOrder(orderId, {
      status: 'out_for_delivery',
      outForDeliveryDate: new Date(),
      trackingNumber: trackingNumber || null,
      carrier: carrier || null,
      shippingMethod: shippingMethod || null,
    });

    let message = 'המשלוח יצא לדרך';
    if (carrier) message += ` דרך ${carrier}`;
    if (trackingNumber) message += ` - מספר מעקב: ${trackingNumber}`;
    if (note) message += `. ${note}`;

    await storage.createFulfillmentEvent({
      orderId,
      type: 'shipped',
      message,
      createdBySupplierId: supplierId,
    });

    // Send email notification
    if (order.customerEmail) {
      const { sendOrderStatusUpdateEmail } = await import('./email');
      sendOrderStatusUpdateEmail(
        order.customerEmail,
        order.customerName,
        'out_for_delivery',
        message
      ).catch(err => console.error('Failed to send email:', err));
    }

    // Send WhatsApp notification
    if (order.customerPhone && whatsappService.isEnabled() && trackingNumber) {
      const estimatedDelivery = order.expectedDeliveryDate 
        ? new Date(order.expectedDeliveryDate).toLocaleDateString('he-IL')
        : undefined;
      
      whatsappService.sendShipmentNotification(
        order.customerPhone,
        order.customerName,
        order.dealName,
        trackingNumber,
        carrier || 'חברת שילוח',
        estimatedDelivery
      ).catch(err => console.error('Failed to send WhatsApp:', err));
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error marking order as shipped:", error);
    res.status(500).json({ error: "שגיאה בעדכון משלוח" });
  }
});

// Mark as delivered
router.patch("/orders/:orderId/delivered", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { orderId } = req.params;
    const { deliveredDate, note } = req.body;

    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "הזמנה לא נמצאה" });
    }

    if (order.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה להזמנה זו" });
    }

    const updatedOrder = await storage.updateOrder(orderId, {
      status: 'delivered',
      deliveredDate: deliveredDate ? new Date(deliveredDate) : new Date(),
    });

    await storage.createFulfillmentEvent({
      orderId,
      type: 'delivered',
      message: `המוצר נמסר בהצלחה${note ? ': ' + note : ''}`,
      createdBySupplierId: supplierId,
    });

    // Send notification
    if (order.customerEmail) {
      const { sendOrderStatusUpdateEmail } = await import('./email');
      sendOrderStatusUpdateEmail(
        order.customerEmail,
        order.customerName,
        'delivered',
        `המוצר נמסר בהצלחה${note ? ': ' + note : ''}`
      ).catch(err => console.error('Failed to send email:', err));
    }

    // Send WhatsApp notification
    if (order.customerPhone && whatsappService.isEnabled()) {
      whatsappService.sendDeliveryConfirmation(
        order.customerPhone,
        order.customerName,
        orderId,
        order.dealName
      ).catch(err => console.error('Failed to send WhatsApp:', err));
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error marking order as delivered:", error);
    res.status(500).json({ error: "שגיאה בעדכון מסירה" });
  }
});

// Add/update supplier notes
router.patch("/orders/:orderId/notes", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "הזמנה לא נמצאה" });
    }

    if (order.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה להזמנה זו" });
    }

    const updatedOrder = await storage.updateOrder(orderId, {
      supplierNotes: notes,
    });

    await storage.createFulfillmentEvent({
      orderId,
      type: 'note',
      message: `הספק הוסיף הערה ללקוח`,
      createdBySupplierId: supplierId,
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order notes:", error);
    res.status(500).json({ error: "שגיאה בעדכון הערות" });
  }
});

// Update order details (priority, dates, shipping info, internal notes)
router.patch("/orders/:orderId/details", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { orderId } = req.params;
    const { priority, expectedDeliveryDate, carrier, shippingMethod, internalNotes } = req.body;

    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "הזמנה לא נמצאה" });
    }

    if (order.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה להזמנה זו" });
    }

    const updateData: any = {};
    if (priority !== undefined) updateData.priority = priority;
    if (expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = expectedDeliveryDate;
    if (carrier !== undefined) updateData.carrier = carrier;
    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;

    const updatedOrder = await storage.updateOrder(orderId, updateData);

    // Log activity
    const changes = [];
    if (priority !== undefined && priority !== order.priority) changes.push(`עדיפות שונתה ל-${priority}`);
    if (expectedDeliveryDate !== undefined) changes.push(`תאריך משלוח צפוי עודכן`);
    if (carrier !== undefined) changes.push(`חברת שילוח: ${carrier}`);
    if (shippingMethod !== undefined) changes.push(`שיטת משלוח: ${shippingMethod}`);

    if (changes.length > 0) {
      await storage.createFulfillmentEvent({
        orderId,
        type: 'details_updated',
        message: `פרטי ההזמנה עודכנו: ${changes.join(', ')}`,
        createdBySupplierId: supplierId,
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order details:", error);
    res.status(500).json({ error: "שגיאה בעדכון פרטי ההזמנה" });
  }
});

// Bulk update orders status
router.patch("/orders/bulk-update", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: "מזהי הזמנות חסרים" });
    }

    if (!status) {
      return res.status(400).json({ error: "סטטוס הוא שדה חובה" });
    }

    // Verify all orders belong to this supplier
    const orders = await Promise.all(orderIds.map(id => storage.getOrder(id)));
    const invalidOrders = orders.filter(o => !o || o.supplierId !== supplierId);
    
    if (invalidOrders.length > 0) {
      return res.status(403).json({ error: "חלק מההזמנות אינן שייכות לספק זה" });
    }

    // Update all orders
    await Promise.all(orderIds.map(async (orderId) => {
      const order = await storage.getOrder(orderId);
      await storage.updateOrder(orderId, { status });
      await storage.createFulfillmentEvent({
        orderId,
        type: `status_${status}`,
        message: `הסטטוס שונה ל-${status} (עדכון קבוצתי)`,
        createdBySupplierId: supplierId,
      });

      // Send WhatsApp notification for each order
      if (order && order.customerPhone && whatsappService.isEnabled()) {
        const statusEmojiMap: Record<string, string> = {
          verified: '✅',
          needs_coordination: '📞',
          scheduled: '📅',
          out_for_delivery: '🚚',
          delivered: '✅',
          cancelled: '❌',
        };

        const statusTextMap: Record<string, string> = {
          verified: 'תשלום אומת',
          needs_coordination: 'דרוש תיאום',
          scheduled: 'משלוח תוזמן',
          out_for_delivery: 'יצא למשלוח',
          delivered: 'נמסר ללקוח',
          cancelled: 'בוטל',
        };

        whatsappService.sendOrderStatusUpdate(
          order.customerPhone,
          order.customerName,
          orderId,
          order.dealName,
          status,
          statusEmojiMap[status] || '📦',
          statusTextMap[status] || status
        ).catch(err => console.error(`Failed to send WhatsApp for order ${orderId}:`, err));
      }
    }));

    res.json({ success: true, updatedCount: orderIds.length });
  } catch (error) {
    console.error("Error bulk updating orders:", error);
    res.status(500).json({ error: "שגיאה בעדכון קבוצתי" });
  }
});

// ==================== WHATSAPP MESSAGING ====================

// Send custom WhatsApp message to customer
router.post("/orders/:orderId/send-whatsapp", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { orderId } = req.params;
    const { message, includeOrderDetails } = req.body;

    if (!message) {
      return res.status(400).json({ error: "תוכן ההודעה חסר" });
    }

    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "הזמנה לא נמצאה" });
    }

    if (order.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה להזמנה זו" });
    }

    if (!order.customerPhone) {
      return res.status(400).json({ error: "ללקוח אין מספר טלפון" });
    }

    if (!whatsappService.isEnabled()) {
      return res.status(503).json({ error: "שירות WhatsApp לא זמין" });
    }

    // Build message
    let fullMessage = message;
    
    if (includeOrderDetails) {
      fullMessage = `📦 *עדכון הזמנה*

שלום ${order.customerName},

${message}

*פרטי ההזמנה:*
📦 ${order.dealName}
🔢 מספר הזמנה: ${orderId.slice(0, 8)}
📍 סטטוס: ${order.status}

*DealRush* 💜`;
    }

    const success = await whatsappService.sendCustomMessage(order.customerPhone, fullMessage);

    if (success) {
      // Log event
      await storage.createFulfillmentEvent({
        orderId,
        type: 'whatsapp_sent',
        message: `נשלחה הודעת WhatsApp: ${message.substring(0, 50)}...`,
        createdBySupplierId: supplierId,
      });

      res.json({ success: true, message: 'הודעה נשלחה בהצלחה' });
    } else {
      res.status(500).json({ error: 'שליחת ההודעה נכשלה' });
    }
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    res.status(500).json({ error: "שגיאה בשליחת הודעה" });
  }
});

// Check WhatsApp service status
router.get("/whatsapp/status", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  res.json({ 
    enabled: whatsappService.isEnabled(),
    service: 'Twilio WhatsApp'
  });
});

// Send coordination request via WhatsApp
router.post("/orders/:orderId/request-coordination", isAuthenticated, isSupplier, async (req: Request, res: Response) => {
  try {
    const supplierId = req.session!.userId!;
    const { orderId } = req.params;

    const order = await storage.getOrder(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "הזמנה לא נמצאה" });
    }

    if (order.supplierId !== supplierId) {
      return res.status(403).json({ error: "אין גישה להזמנה זו" });
    }

    if (!order.customerPhone) {
      return res.status(400).json({ error: "ללקוח אין מספר טלפון" });
    }

    if (!whatsappService.isEnabled()) {
      return res.status(503).json({ error: "שירות WhatsApp לא זמין" });
    }

    // Get supplier details
    const supplier = await storage.getUser(supplierId);

    const success = await whatsappService.sendCoordinationRequest(
      order.customerPhone,
      order.customerName,
      order.dealName,
      orderId,
      supplier?.phone || undefined
    );

    if (success) {
      // Update order status
      await storage.updateOrder(orderId, { status: 'needs_coordination' });

      // Log event
      await storage.createFulfillmentEvent({
        orderId,
        type: 'coordination_requested',
        message: 'נשלחה בקשת תיאום ללקוח',
        createdBySupplierId: supplierId,
      });

      res.json({ success: true, message: 'בקשת תיאום נשלחה' });
    } else {
      res.status(500).json({ error: 'שליחת הבקשה נכשלה' });
    }
  } catch (error) {
    console.error("Error sending coordination request:", error);
    res.status(500).json({ error: "שגיאה בשליחת בקשת תיאום" });
  }
});

export default router;
