import "dotenv/config";
import { db } from "../server/db";
import { users, deals, participants, orders, fulfillmentEvents } from "../shared/schema";
import type { InsertOrder, InsertFulfillmentEvent } from "../shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// Israeli names pool
const firstNames = [
  "נועם", "תמר", "יואב", "שירה", "אורי", "מיכל", "ניר", "רונית", "עומר", "דנה",
  "אייל", "שני", "גיא", "ליאת", "יובל", "מור", "דור", "עדי", "רועי", "הדר",
  "עידו", "נטע", "אסף", "יעל", "אלון", "קרן", "גל", "ענת", "טל", "רות",
  "שלומי", "אילנה", "דוד", "שרון", "משה", "רחל", "אבי", "סיגל", "חיים", "דפנה"
];

const lastNames = [
  "כהן", "לוי", "מזרחי", "פרץ", "ביטון", "דהן", "אברהם", "שלום", "חיים", "יוסף",
  "בן דוד", "אזולאי", "אוחנה", "אלון", "ברק", "גולן", "דן", "הרץ", "ורד", "זהר",
  "חן", "טל", "ישראלי", "כץ", "לב", "מור", "נוי", "סער", "עוז", "פז",
  "צור", "קדם", "רון", "שמיר", "תמיר", "אדרי", "בוזגלו", "גבאי", "דיין", "הראל"
];

const cities = [
  { name: "תל אביב", zip: "61000" },
  { name: "חיפה", zip: "31000" },
  { name: "ראשון לציון", zip: "75000" },
  { name: "פתח תקווה", zip: "49000" },
  { name: "באר שבע", zip: "84000" },
  { name: "נתניה", zip: "42000" },
  { name: "חולון", zip: "58000" },
  { name: "בני ברק", zip: "51000" },
  { name: "רמת גן", zip: "52000" },
  { name: "אשדוד", zip: "77000" },
  { name: "רחובות", zip: "76000" },
  { name: "הרצליה", zip: "46000" },
  { name: "כפר סבא", zip: "44000" },
  { name: "מודיעין", zip: "71700" },
  { name: "ירושלים", zip: "91000" }
];

const streets = [
  "הרצל", "רוטשילד", "ויצמן", "בן גוריון", "דיזנגוף", "אלנבי", "יהודה הלוי",
  "שנקר", "בזל", "ז'בוטינסקי", "הנשיא", "הרב קוק", "סוקולוף", "ביאלק",
  "קפלן", "פינסקר", "אחד העם", "נורדאו", "מונטיפיורי", "המלך ג'ורג'"
];

const carriers = [
  "חברת הדואר", "DHL", "UPS", "FedEx", "חלוצי המשלוחים", "זמן אמת", "בלדר"
];

const shippingMethods = [
  "משלוח רגיל", "משלוח אקספרס", "איסוף עצמי", "שליח עד הבית"
];

// Deal templates for closed deals
const closedDeals = [
  {
    name: "iPhone 15 Pro - דיל קבוצתי",
    description: "iPhone 15 Pro 256GB בצבעים שונים במחיר מיוחד",
    category: "אלקטרוניקה",
    originalPrice: 5499,
    finalPrice: 4299,
    participants: 18,
    specs: [
      { label: "נפח", value: "256GB" },
      { label: "צבעים", value: "טיטניום כחול, שחור, לבן" },
      { label: "מצלמה", value: "48MP ראשית" }
    ]
  },
  {
    name: "מארז ספא זוגי - ים המלח",
    description: "חבילת ספא מפנקת במלון 5 כוכבים בים המלח",
    category: "בריאות וספא",
    originalPrice: 2800,
    finalPrice: 1699,
    participants: 24,
    specs: [
      { label: "משך", value: "יום מלא" },
      { label: "כולל", value: "טיפולים + ארוחת בוקר" },
      { label: "תוקף", value: "6 חודשים" }
    ]
  },
  {
    name: "רובוט שואב ושוטף Dreametech",
    description: "רובוט שואב ושוטף חכם עם ניווט לייזר",
    category: "מוצרי חשמל",
    originalPrice: 3200,
    finalPrice: 2199,
    participants: 15,
    specs: [
      { label: "ניווט", value: "לייזר LDS" },
      { label: "סוללה", value: "5200mAh" },
      { label: "כוח שאיבה", value: "4000Pa" }
    ]
  },
  {
    name: "סט כלי מטבח פרימיום 24 חלקים",
    description: "סט כלי בישול ואפייה מנירוסטה איכותית",
    category: "מטבח ובית",
    originalPrice: 1850,
    finalPrice: 1199,
    participants: 22,
    specs: [
      { label: "חומר", value: "נירוסטה 18/10" },
      { label: "כמות", value: "24 חלקים" },
      { label: "מתאים ל", value: "אינדוקציה" }
    ]
  },
  {
    name: "אוזניות Sony WH-1000XM5",
    description: "אוזניות אלחוטיות עם ביטול רעשים מתקדם",
    category: "אלקטרוניקה",
    originalPrice: 1599,
    finalPrice: 1199,
    participants: 20,
    specs: [
      { label: "טכנולוגיה", value: "ANC מתקדם" },
      { label: "סוללה", value: "עד 30 שעות" },
      { label: "אלחוטי", value: "Bluetooth 5.2" }
    ]
  }
];

const customerNotes = [
  "בבקשה להתקשר לפני הגעה",
  "ניתן להשאיר ליד הדלת",
  "אנא להעביר דרך השכן בדירה 12",
  "מעדיף משלוח בשעות הצהריים",
  "לא להשאיר בחוץ - אזור גשום",
  null,
  null,
  "קומה 3 ללא מעלית",
  "יש אינטרקום - דירה 5",
  null
];

const supplierNotes = [
  "חבילה ארוזה ומוכנה למשלוח",
  "לקוח ביקש לדחות ליום רביעי",
  "חבילה יצאה עם שליח מס' 147",
  "מוצר נבדק לפני האריזה - הכל תקין",
  "שליח ניסה להגיע - הלקוח לא ענה",
  null,
  "חבילה נמסרה לשכן לפי בקשה",
  null,
  "משלוח דחוף - אקספרס",
  "מוצר רגיש - ארזנו בתוספת בועות"
];

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateIsraeliPhone(): string {
  const prefixes = ["050", "052", "053", "054", "055", "058"];
  const prefix = randomFromArray(prefixes);
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}-${number.toString().slice(0, 7)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "walla.co.il", "hotmail.com", "yahoo.com"];
  const clean = (str: string) => str.toLowerCase().replace(/[^\w]/g, '');
  return `${clean(firstName)}.${clean(lastName)}@${randomFromArray(domains)}`;
}

function generateTrackingNumber(): string {
  const prefix = randomFromArray(["IL", "DR", "HFD"]);
  const number = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}${number}`;
}

async function seedOrders() {
  console.log("🚚 Starting order seeding...");

  try {
    // Clear existing orders and events
    console.log("🗑️  Clearing existing orders and events...");
    await db.delete(fulfillmentEvents);
    await db.delete(orders);

    // Get or create supplier
    let supplier = await db.select().from(users).where(eq(users.email, "dreamer@dealrush.co.il")).limit(1);
    
    if (!supplier || supplier.length === 0) {
      console.log("📦 Creating supplier user...");
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash("Dreamer2024!", 10);
      
      [supplier[0]] = await db.insert(users).values({
        id: randomUUID(),
        email: "dreamer@dealrush.co.il",
        passwordHash: hashedPassword,
        firstName: "Dreamer",
        lastName: "Supplier",
        phone: "050-2222222",
        isAdmin: "false",
        isSupplier: "true",
        supplierCompanyName: "Dreamer Supplies",
        isEmailVerified: "true",
      }).returning();
    }

    const supplierId = supplier[0].id;

    // Create closed deals
    console.log("📦 Creating closed deals...");
    const createdDeals = [];
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    for (const dealTemplate of closedDeals) {
      const dealId = randomUUID();
      const createdAt = randomDate(sixMonthsAgo, new Date());
      const endTime = new Date(createdAt);
      endTime.setDate(endTime.getDate() + 14); // Deal ran for 14 days
      const closedAt = new Date(endTime.getTime() + 1000 * 60 * 60); // Closed 1 hour after end
      
      const [deal] = await db.insert(deals).values({
        id: dealId,
        name: dealTemplate.name,
        description: dealTemplate.description,
        category: dealTemplate.category,
        images: [`/uploads/deal-${dealId.slice(0, 8)}.jpg`],
        originalPrice: dealTemplate.originalPrice,
        currentPrice: dealTemplate.finalPrice,
        costPrice: Math.floor(dealTemplate.finalPrice * 0.7),
        participants: dealTemplate.participants,
        targetParticipants: dealTemplate.participants,
        minParticipants: Math.floor(dealTemplate.participants * 0.5),
        endTime: endTime,
        tiers: [
          { minParticipants: 0, maxParticipants: 10, discount: 15, price: Math.floor(dealTemplate.originalPrice * 0.85) },
          { minParticipants: 11, maxParticipants: 20, discount: 22, price: dealTemplate.finalPrice },
          { minParticipants: 21, maxParticipants: 50, discount: 28, price: Math.floor(dealTemplate.finalPrice * 0.95) }
        ],
        specs: dealTemplate.specs,
        isActive: "false",
        status: "closed",
        createdAt: createdAt,
        closedAt: closedAt,
        supplierId: supplierId,
        supplierName: "Dreamer Supplies",
        platformCommission: 5,
      }).returning();
      
      createdDeals.push({ deal, template: dealTemplate });
      console.log(`✅ Created deal: ${deal.name}`);
    }

    // Generate orders for each deal
    console.log("📋 Creating orders...");
    let totalOrders = 0;
    const orderStatuses = ["delivered", "out_for_delivery", "scheduled", "verified", "pending", "cancelled"];
    
    for (const { deal, template } of createdDeals) {
      const orderCount = template.participants;
      
      for (let i = 0; i < orderCount; i++) {
        const participantId = randomUUID();
        const firstName = randomFromArray(firstNames);
        const lastName = randomFromArray(lastNames);
        const customerName = `${firstName} ${lastName}`;
        const city = randomFromArray(cities);
        const street = randomFromArray(streets);
        const streetNumber = Math.floor(1 + Math.random() * 150);
        const quantity = Math.random() > 0.7 ? 2 : 1; // 30% chance for 2 units
        
        // Create participant first
        const joinedAt = randomDate(new Date(deal.createdAt), new Date(deal.endTime));
        
        await db.insert(participants).values({
          id: participantId,
          dealId: deal.id,
          userId: null,
          name: customerName,
          email: generateEmail(firstName, lastName),
          phone: generateIsraeliPhone(),
          quantity: quantity,
          pricePaid: deal.currentPrice,
          initialPrice: deal.currentPrice,
          position: i + 1,
          joinedAt: joinedAt,
          paymentStatus: "paid",
          chargedAt: deal.closedAt ? new Date(deal.closedAt) : new Date(),
          chargedAmount: deal.currentPrice * quantity,
          tierAtJoin: 1,
          finalTier: 2,
          needsShipping: true,
          shippingAddress: `${street} ${streetNumber}`,
          shippingCity: city.name,
          shippingZipCode: city.zip,
          shippingCost: 0,
        });

        // Determine order status (weighted towards delivered for older orders)
        const closedDate = deal.closedAt ? new Date(deal.closedAt) : new Date();
        const daysSinceClose = (Date.now() - closedDate.getTime()) / (1000 * 60 * 60 * 24);
        let status: string;
        
        if (daysSinceClose > 30) {
          // Old orders - mostly delivered
          const rand = Math.random();
          if (rand < 0.85) status = "delivered";
          else if (rand < 0.95) status = "out_for_delivery";
          else status = "cancelled";
        } else if (daysSinceClose > 14) {
          // Medium age - mix
          const rand = Math.random();
          if (rand < 0.6) status = "delivered";
          else if (rand < 0.8) status = "out_for_delivery";
          else if (rand < 0.9) status = "scheduled";
          else status = "verified";
        } else {
          // Recent - more in progress
          const rand = Math.random();
          if (rand < 0.3) status = "delivered";
          else if (rand < 0.5) status = "out_for_delivery";
          else if (rand < 0.7) status = "scheduled";
          else if (rand < 0.85) status = "verified";
          else status = "pending";
        }

        // Generate timeline dates based on status
        const orderCreatedAt = deal.closedAt ? new Date(deal.closedAt) : new Date();
        orderCreatedAt.setHours(orderCreatedAt.getHours() + Math.random() * 12);
        
        let scheduledDate: Date | null = null;
        let outForDeliveryDate: Date | null = null;
        let deliveredDate: Date | null = null;
        let trackingNumber: string | null = null;
        let carrier: string | null = null;
        let shippingMethod: string | null = null;
        
        if (status !== "pending" && status !== "cancelled") {
          scheduledDate = new Date(orderCreatedAt);
          scheduledDate.setDate(scheduledDate.getDate() + Math.floor(1 + Math.random() * 3));
        }
        
        if (status === "out_for_delivery" || status === "delivered") {
          outForDeliveryDate = new Date(scheduledDate || orderCreatedAt);
          outForDeliveryDate.setDate(outForDeliveryDate.getDate() + Math.floor(1 + Math.random() * 2));
          trackingNumber = generateTrackingNumber();
          carrier = randomFromArray(carriers);
          shippingMethod = randomFromArray(shippingMethods);
        }
        
        if (status === "delivered") {
          deliveredDate = new Date(outForDeliveryDate!);
          deliveredDate.setHours(deliveredDate.getHours() + Math.floor(4 + Math.random() * 20));
        }

        // Create order
        const orderId = randomUUID();
        const orderData: InsertOrder = {
          participantId: participantId,
          dealId: deal.id,
          supplierId: supplierId,
          customerName: customerName,
          customerEmail: generateEmail(firstName, lastName),
          customerPhone: generateIsraeliPhone(),
          shippingAddress: `${street} ${streetNumber}`,
          shippingCity: city.name,
          shippingZip: city.zip,
          notesFromCustomer: Math.random() > 0.6 ? randomFromArray(customerNotes) : null,
          status: status,
          supplierNotes: Math.random() > 0.5 ? randomFromArray(supplierNotes) : null,
          scheduledDeliveryDate: scheduledDate,
          outForDeliveryDate: outForDeliveryDate,
          deliveredDate: deliveredDate,
          trackingNumber: trackingNumber,
          carrier: carrier,
          shippingMethod: shippingMethod,
        };

        const [order] = await db.insert(orders).values(orderData).returning();

        // Create timeline events
        const events: InsertFulfillmentEvent[] = [
          {
            orderId: order.id,
            type: "purchase_received",
            message: `הזמנה נקלטה במערכת - ${quantity} יחידות`,
            createdBySupplierId: supplierId,
          }
        ];

        if (status === "verified" || status === "scheduled" || status === "out_for_delivery" || status === "delivered") {
          events.push({
            orderId: order.id,
            type: "verified",
            message: "ההזמנה אומתה על ידי הספק",
            createdBySupplierId: supplierId,
          });
        }

        if (status === "scheduled" || status === "out_for_delivery" || status === "delivered") {
          events.push({
            orderId: order.id,
            type: "delivery_scheduled",
            message: `משלוח תוזמן ל-${scheduledDate?.toLocaleDateString('he-IL')}`,
            createdBySupplierId: supplierId,
          });
        }

        if (status === "out_for_delivery" || status === "delivered") {
          events.push({
            orderId: order.id,
            type: "shipped",
            message: `המשלוח יצא לדרך דרך ${carrier} - מספר מעקב: ${trackingNumber}`,
            createdBySupplierId: supplierId,
          });
        }

        if (status === "delivered") {
          events.push({
            orderId: order.id,
            type: "delivered",
            message: `המוצר נמסר בהצלחה ב-${deliveredDate?.toLocaleDateString('he-IL')}`,
            createdBySupplierId: supplierId,
          });
        }

        if (status === "cancelled") {
          events.push({
            orderId: order.id,
            type: "cancelled",
            message: "ההזמנה בוטלה לפי בקשת הלקוח",
            createdBySupplierId: supplierId,
          });
        }

        // Add random notes occasionally
        if (Math.random() > 0.7) {
          events.push({
            orderId: order.id,
            type: "note",
            message: randomFromArray([
              "הלקוח שאל על זמן אספקה",
              "עדכון: החבילה בדרך",
              "שליח ניסה להגיע - יחזור מחר",
              "לקוח ביקש לדחות למחרת",
              "המוצר נבדק והוא תקין"
            ]),
            createdBySupplierId: supplierId,
          });
        }

        // Insert all events
        for (const event of events) {
          await db.insert(fulfillmentEvents).values(event);
        }

        totalOrders++;
      }
      
      console.log(`✅ Created ${orderCount} orders for deal: ${deal.name}`);
    }

    console.log("\n✨ Order seeding completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Deals created: ${createdDeals.length}`);
    console.log(`   - Total orders: ${totalOrders}`);
    console.log(`   - Average orders per deal: ${Math.round(totalOrders / createdDeals.length)}`);
    
    // Status breakdown
    const statusCounts = await db.select().from(orders);
    const breakdown = statusCounts.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n📈 Order Status Breakdown:`);
    Object.entries(breakdown).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} (${Math.round(count / totalOrders * 100)}%)`);
    });

  } catch (error) {
    console.error("❌ Error seeding orders:", error);
    throw error;
  }
}

// Run the seeder
seedOrders()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
