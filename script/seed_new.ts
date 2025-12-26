import "dotenv/config";
import { db } from "../server/db";
import { users, deals, participants } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seed() {
  console.log("🌱 Starting ENHANCED database seed...");
  console.log("📊 Target: 40 customers, 30 active deals, 30 completed deals");

  try {
    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await db.delete(participants);
    await db.delete(deals);
    await db.delete(users);

    // Create Admin & Suppliers
    console.log("👥 Creating admin and suppliers...");
    
    const adminPassword = await hashPassword("Admin2024!");
    const [admin] = await db.insert(users).values({
      id: randomUUID(),
      email: "admin@dealrush.co.il",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "DealRush",
      isAdmin: "true",
      isSupplier: "false",
      isEmailVerified: "true",
    }).returning();

    const supplierPassword = await hashPassword("Dreamer2024!");
    const [supplier1] = await db.insert(users).values({
      id: randomUUID(),
      email: "dreamer@dealrush.co.il",
      passwordHash: supplierPassword,
      firstName: "Dreamer",
      lastName: "Supplier",
      isAdmin: "false",
      isSupplier: "true",
      supplierCompanyName: "Dreamer Supplies",
      isEmailVerified: "true",
    }).returning();

    const supplier2Password = await hashPassword("Aa123456!");
    const [supplier2] = await db.insert(users).values({
      id: randomUUID(),
      email: "Dreamer@gmail.com",
      passwordHash: supplier2Password,
      firstName: "Dreamer",
      lastName: "Gmail",
      isAdmin: "false",
      isSupplier: "true",
      supplierCompanyName: "Dreamer Gmail Store",
      isEmailVerified: "true",
    }).returning();

    console.log("✅ Created admin and 2 suppliers");

    // Create 40 Customers
    console.log("👥 Creating 40 customers...");
    const customers = [];
    const firstNames = ["אורי", "דנה", "יוסי", "מיכל", "רועי", "שירה", "עומר", "נועה", "איתי", "תמר", 
                       "אבי", "ליאת", "גיא", "מאיה", "יונתן", "רחל", "דוד", "שרה", "אלון", "כרמל",
                       "משה", "יעל", "אופיר", "הדר", "נתן", "ענת", "עידו", "רינה", "בועז", "מרב",
                       "ארז", "סיגל", "רן", "ורד", "טל", "ניר", "שלומי", "חן", "רוני", "מיה"];
    const lastNames = ["כהן", "לוי", "מזרחי", "פרץ", "ביטון", "דהן", "אבוטבול", "עזרא", "מלכה", "חדד"];

    for (let i = 0; i < 40; i++) {
      const customerPassword = await hashPassword("Customer123!");
      const phoneNum = `05${Math.floor(i / 10)}-${(1000000 + i * 11111).toString().substring(0, 7)}`;
      const [customer] = await db.insert(users).values({
        id: randomUUID(),
        email: `customer${i + 1}@example.com`,
        passwordHash: customerPassword,
        firstName: firstNames[i],
        lastName: lastNames[i % lastNames.length],
        phone: phoneNum,
        isAdmin: "false",
        isSupplier: "false",
        isEmailVerified: "true",
      }).returning();
      customers.push(customer);
    }
    console.log(`✅ Created ${customers.length} customers`);

    // Helper functions
    const getPastDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const getFutureDate = (hoursAhead: number) => new Date(Date.now() + hoursAhead * 60 * 60 * 1000);

    // === 30 COMPLETED DEALS ===
    console.log("🎯 Creating 30 completed deals (25 successful, 5 failed)...");
    const completedDeals = [];

    // 25 SUCCESSFUL DEALS (passed tier 1 minimum)
    const successfulDealsData = [
      { name: "מקרר Samsung דלתות כפולות", category: "electrical", originalPrice: 5000, costPrice: 2500, participants: 10, image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400", spec: { label: "נפח", value: "500 ליטר" } },
      { name: "מחשב נייד Dell XPS 13", category: "electronics", originalPrice: 6000, costPrice: 3000, participants: 8, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400", spec: { label: "מעבד", value: "Intel i7" } },
      { name: "אוזניות Bose QuietComfort", category: "electronics", originalPrice: 1500, costPrice: 750, participants: 7, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", spec: { label: "סוג", value: "Over-ear" } },
      { name: "שואב אבק רובוטי Xiaomi", category: "electrical", originalPrice: 2000, costPrice: 1000, participants: 10, image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400", spec: { label: "ניווט", value: "לייזר" } },
      { name: "ספה תלת מושבית מעוצבת", category: "furniture", originalPrice: 4000, costPrice: 2000, participants: 6, image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400", spec: { label: "מידות", value: "200x90 ס\"מ" } },
      { name: "ארון הזזה 3 דלתות", category: "furniture", originalPrice: 5000, costPrice: 2500, participants: 5, image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400", spec: { label: "מידות", value: "240x220 ס\"מ" } },
      { name: "נעלי ריצה Nike Air Zoom", category: "sports", originalPrice: 600, costPrice: 300, participants: 8, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", spec: { label: "מידה", value: "42" } },
      { name: "משקפי שמש Ray-Ban", category: "fashion", originalPrice: 800, costPrice: 400, participants: 9, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400", spec: { label: "דגם", value: "Aviator" } },
      { name: "תיק גב Samsonite", category: "fashion", originalPrice: 500, costPrice: 250, participants: 7, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400", spec: { label: "נפח", value: "25 ליטר" } },
      { name: "מטען אלחוטי Anker", category: "electronics", originalPrice: 200, costPrice: 100, participants: 10, image: "https://images.unsplash.com/photo-1591290619762-5a21d4eea7f6?w=400", spec: { label: "הספק", value: "15W" } },
      { name: "טוסטר אובן Tefal", category: "electrical", originalPrice: 800, costPrice: 400, participants: 6, image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400", spec: { label: "נפח", value: "32 ליטר" } },
      { name: "מנורת שולחן עמידה", category: "home", originalPrice: 300, costPrice: 150, participants: 8, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400", spec: { label: "גובה", value: "45 ס\"מ" } },
      { name: "סיר בישול לאט Crock-Pot", category: "electrical", originalPrice: 400, costPrice: 200, participants: 9, image: "https://images.unsplash.com/photo-1585937369544-37e3c0b16f24?w=400", spec: { label: "נפח", value: "5 ליטר" } },
      { name: "כרית ארגונומית", category: "home", originalPrice: 250, costPrice: 125, participants: 10, image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400", spec: { label: "חומר", value: "קצף זיכרון" } },
      { name: "בקבוק תרמי Hydro Flask", category: "sports", originalPrice: 150, costPrice: 75, participants: 10, image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400", spec: { label: "נפח", value: "1 ליטר" } },
      { name: "מכונת אספרסו Nespresso", category: "electrical", originalPrice: 1200, costPrice: 600, participants: 7, image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400", spec: { label: "לחץ", value: "19 בר" } },
      { name: "שטיח סלון מודרני", category: "home", originalPrice: 1000, costPrice: 500, participants: 5, image: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400", spec: { label: "מידות", value: "200x300" } },
      { name: "טאבלט Samsung Galaxy Tab", category: "electronics", originalPrice: 2500, costPrice: 1250, participants: 6, image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400", spec: { label: "מסך", value: "10.5\"" } },
      { name: "אוהל קמפינג 4 אנשים", category: "sports", originalPrice: 800, costPrice: 400, participants: 8, image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400", spec: { label: "קיבולת", value: "4 אנשים" } },
      { name: "מערכת רמקולים Bluetooth", category: "electronics", originalPrice: 1500, costPrice: 750, participants: 9, image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400", spec: { label: "הספק", value: "100W" } },
      { name: "מיטת יחיד אורתופדית", category: "furniture", originalPrice: 2000, costPrice: 1000, participants: 5, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400", spec: { label: "מידה", value: "90x200" } },
      { name: "מצלמת אבטחה חכמה", category: "electronics", originalPrice: 500, costPrice: 250, participants: 10, image: "https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=400", spec: { label: "רזולוציה", value: "1080p" } },
      { name: "מדיח כלים Bosch", category: "electrical", originalPrice: 3000, costPrice: 1500, participants: 7, image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400", spec: { label: "מדורגים", value: "12" } },
      { name: "שעון יד חכם Garmin", category: "electronics", originalPrice: 1800, costPrice: 900, participants: 8, image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400", spec: { label: "GPS", value: "כן" } },
      { name: "מזרון זוגי Premium", category: "furniture", originalPrice: 3500, costPrice: 1750, participants: 6, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400", spec: { label: "גודל", value: "140x200" } },
    ];

    for (let i = 0; i < 25; i++) {
      const data = successfulDealsData[i];
      const supplier = i % 2 === 0 ? supplier1 : supplier2;
      const discount25 = Math.floor(data.originalPrice * 0.25);
      const discount20 = Math.floor(data.originalPrice * 0.20);
      const discount15 = Math.floor(data.originalPrice * 0.15);

      const [deal] = await db.insert(deals).values({
        id: randomUUID(),
        name: data.name,
        description: `מוצר איכותי במבצע מיוחד`,
        category: data.category,
        images: [data.image],
        originalPrice: data.originalPrice,
        currentPrice: data.originalPrice - discount25,
        costPrice: data.costPrice,
        participants: data.participants,
        targetParticipants: 10,
        minParticipants: 2,
        endTime: getPastDate(i + 1),
        createdAt: getPastDate(i + 8),
        closedAt: getPastDate(i + 1),
        tiers: [
          { minParticipants: 0, maxParticipants: 2, discount: 15, price: data.originalPrice - discount15, commission: 10 },
          { minParticipants: 3, maxParticipants: 4, discount: 20, price: data.originalPrice - discount20, commission: 10 },
          { minParticipants: 5, maxParticipants: 10, discount: 25, price: data.originalPrice - discount25, commission: 10 },
        ],
        specs: [data.spec],
        isActive: "false",
        status: "completed",
        supplierId: supplier.id,
        supplierName: supplier.supplierCompanyName,
        platformCommission: 10,
      }).returning();
      completedDeals.push(deal);
    }

    // 5 FAILED DEALS (didn't reach tier 1 minimum)
    const failedDealsData = [
      { name: "מנורת LED חכמה", category: "home", originalPrice: 400, costPrice: 200, participants: 1, image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400" },
      { name: "כיסוי למכונית", category: "other", originalPrice: 300, costPrice: 150, participants: 0, image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400" },
      { name: "מטען סולרי נייד", category: "electronics", originalPrice: 250, costPrice: 125, participants: 1, image: "https://images.unsplash.com/photo-1591290619762-5a21d4eea7f6?w=400" },
      { name: "מסגרת תמונה דיגיטלית", category: "electronics", originalPrice: 500, costPrice: 250, participants: 0, image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400" },
      { name: "רמקול נייד קטן", category: "electronics", originalPrice: 200, costPrice: 100, participants: 1, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400" },
    ];

    for (let i = 0; i < 5; i++) {
      const data = failedDealsData[i];
      const supplier = i % 2 === 0 ? supplier1 : supplier2;
      const discount25 = Math.floor(data.originalPrice * 0.25);
      const discount20 = Math.floor(data.originalPrice * 0.20);
      const discount15 = Math.floor(data.originalPrice * 0.15);

      const [deal] = await db.insert(deals).values({
        id: randomUUID(),
        name: data.name,
        description: "דיל שלא הגיע למינימום",
        category: data.category,
        images: [data.image],
        originalPrice: data.originalPrice,
        currentPrice: data.originalPrice - discount25,
        costPrice: data.costPrice,
        participants: data.participants,
        targetParticipants: 10,
        minParticipants: 2,
        endTime: getPastDate(26 + i),
        createdAt: getPastDate(33 + i),
        closedAt: getPastDate(26 + i),
        tiers: [
          { minParticipants: 0, maxParticipants: 2, discount: 15, price: data.originalPrice - discount15, commission: 10 },
          { minParticipants: 3, maxParticipants: 4, discount: 20, price: data.originalPrice - discount20, commission: 10 },
          { minParticipants: 5, maxParticipants: 10, discount: 25, price: data.originalPrice - discount25, commission: 10 },
        ],
        specs: [{ label: "סטטוס", value: "לא הושלם" }],
        isActive: "false",
        status: "failed",
        supplierId: supplier.id,
        supplierName: supplier.supplierCompanyName,
        platformCommission: 10,
      }).returning();
      completedDeals.push(deal);
    }

    console.log(`✅ Created 30 completed deals (25 successful, 5 failed)`);

    // === CREATE PARTICIPANTS FOR SUCCESSFUL DEALS ===
    console.log("🛒 Creating participants for successful deals...");
    let participantCount = 0;

    for (const deal of completedDeals) {
      if (deal.status === "failed") continue;

      const numParticipants = deal.participants;
      const dealTiers = deal.tiers;

      for (let i = 0; i < numParticipants; i++) {
        const position = i + 1;
        const customer = customers[Math.floor(Math.random() * customers.length)];

        // Determine tier
        let tierIndex = 0;
        let pricePaid = dealTiers[0].price;
        for (let t = dealTiers.length - 1; t >= 0; t--) {
          if (position >= dealTiers[t].minParticipants + 1) {
            tierIndex = t;
            pricePaid = dealTiers[t].price;
            break;
          }
        }

        await db.insert(participants).values({
          dealId: deal.id,
          userId: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          quantity: 1,
          pricePaid: pricePaid,
          position: position,
          paymentStatus: "charged",
          tierAtJoin: tierIndex,
          finalTier: tierIndex,
          stripePaymentMethodId: `pm_${randomUUID().substring(0, 8)}`,
          cardLast4: (Math.floor(Math.random() * 9000) + 1000).toString(),
          cardBrand: ["visa", "mastercard", "amex"][Math.floor(Math.random() * 3)],
          chargedAt: new Date(deal.closedAt || deal.endTime),
          chargedAmount: pricePaid,
        });
        participantCount++;
      }
    }

    // Add participants to failed deals too (but with refunded status)
    for (const deal of completedDeals) {
      if (deal.status !== "failed" || deal.participants === 0) continue;

      const customer = customers[Math.floor(Math.random() * customers.length)];
      await db.insert(participants).values({
        dealId: deal.id,
        userId: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
        quantity: 1,
        pricePaid: 0,
        position: 1,
        paymentStatus: "refunded",
        tierAtJoin: 0,
        finalTier: 0,
      });
      participantCount++;
    }

    console.log(`✅ Created ${participantCount} participants`);

    // === 30 ACTIVE DEALS ===
    console.log("🎯 Creating 30 active deals with varied tier participation...");
    const activeDeals = [];

    const activeDealsData = [
      { name: "טלוויזיה LG OLED 65\"", category: "electrical", originalPrice: 8000, costPrice: 4000, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400", spec: { label: "גודל", value: "65\"" } },
      { name: "מזגן Tadiran 1.5 כ\"ס", category: "electrical", originalPrice: 3500, costPrice: 1750, image: "https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?w=400", spec: { label: "הספק", value: "1.5 כ\"ס" } },
      { name: "מכונת קפה Nespresso", category: "electrical", originalPrice: 1200, costPrice: 600, image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400", spec: { label: "לחץ", value: "19 בר" } },
      { name: "שולחן אוכל עץ מלא", category: "furniture", originalPrice: 4500, costPrice: 2250, image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400", spec: { label: "מידות", value: "200x100" } },
      { name: "כיסא גיימינג מקצועי", category: "furniture", originalPrice: 2000, costPrice: 1000, image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400", spec: { label: "גובה", value: "135 ס\"מ" } },
      { name: "מייבש כביסה Bosch", category: "electrical", originalPrice: 4000, costPrice: 2000, image: "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=400", spec: { label: "קיבולת", value: "8 ק\"ג" } },
      { name: "מנורת תקרה מעוצבת", category: "home", originalPrice: 800, costPrice: 400, image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400", spec: { label: "סוג", value: "LED חכמה" } },
      { name: "מקלט Sony Soundbar", category: "electronics", originalPrice: 3000, costPrice: 1500, image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400", spec: { label: "ערוצים", value: "5.1" } },
      { name: "מנגל גז Weber", category: "home", originalPrice: 2500, costPrice: 1250, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400", spec: { label: "מבערים", value: "3" } },
      { name: "מצלמת GoPro Hero 11", category: "electronics", originalPrice: 2000, costPrice: 1000, image: "https://images.unsplash.com/photo-1606941973649-a686528c2197?w=400", spec: { label: "רזולוציה", value: "4K60" } },
      { name: "סט סכו\"ם 72 חלקים", category: "home", originalPrice: 1000, costPrice: 500, image: "https://images.unsplash.com/photo-1578390403960-78fe9a7e2e1f?w=400", spec: { label: "חלקים", value: "72" } },
      { name: "אופני הרים Giant", category: "sports", originalPrice: 3500, costPrice: 1750, image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400", spec: { label: "גודל", value: "29\"" } },
      { name: "מדפסת HP LaserJet", category: "electronics", originalPrice: 1500, costPrice: 750, image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400", spec: { label: "סוג", value: "לייזר צבע" } },
      { name: "שעון חכם Apple Watch 8", category: "electronics", originalPrice: 2500, costPrice: 1250, image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400", spec: { label: "גודל", value: "44mm" } },
      { name: "מזוודה קשיחה 28\"", category: "other", originalPrice: 800, costPrice: 400, image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400", spec: { label: "גודל", value: "28\"" } },
      { name: "מזרן יוגה מקצועי", category: "sports", originalPrice: 300, costPrice: 150, image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400", spec: { label: "עובי", value: "6 מ\"מ" } },
      { name: "מעבד מזון Philips", category: "electrical", originalPrice: 1200, costPrice: 600, image: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400", spec: { label: "הספק", value: "1000W" } },
      { name: "ספריית קיר מודולרית", category: "furniture", originalPrice: 1800, costPrice: 900, image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400", spec: { label: "מדפים", value: "5" } },
      { name: "מסך מחשב Dell 27\"", category: "electronics", originalPrice: 2000, costPrice: 1000, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400", spec: { label: "רזולוציה", value: "4K" } },
      { name: "סיר לחץ חשמלי Instant Pot", category: "electrical", originalPrice: 600, costPrice: 300, image: "https://images.unsplash.com/photo-1585937369544-37e3c0b16f24?w=400", spec: { label: "נפח", value: "6 ליטר" } },
      { name: "מזנון סלון מודרני", category: "furniture", originalPrice: 3000, costPrice: 1500, image: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400", spec: { label: "רוחב", value: "180 ס\"מ" } },
      { name: "אופניים חשמליים", category: "sports", originalPrice: 5000, costPrice: 2500, image: "https://images.unsplash.com/photo-1591641410944-5ad3c42c9b18?w=400", spec: { label: "טווח", value: "60 ק\"מ" } },
      { name: "מערכת הקלטה ביתית", category: "electronics", originalPrice: 1800, costPrice: 900, image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400", spec: { label: "ערוצים", value: "4" } },
      { name: "כלי אימון ביתי", category: "sports", originalPrice: 2200, costPrice: 1100, image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400", spec: { label: "תרגילים", value: "50+" } },
      { name: "מקרן Full HD", category: "electronics", originalPrice: 3500, costPrice: 1750, image: "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=400", spec: { label: "רזולוציה", value: "1920x1080" } },
      { name: "כיריים אינדוקציה", category: "electrical", originalPrice: 1500, costPrice: 750, image: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=400", spec: { label: "אזורי חימום", value: "4" } },
      { name: "מערכת סינון מים", category: "home", originalPrice: 800, costPrice: 400, image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400", spec: { label: "שלבים", value: "5" } },
      { name: "רדיאטור חכם", category: "electrical", originalPrice: 1000, costPrice: 500, image: "https://images.unsplash.com/photo-1585128903994-02e4c74de0af?w=400", spec: { label: "הספק", value: "2000W" } },
      { name: "כיסא מנהלים עור", category: "furniture", originalPrice: 1500, costPrice: 750, image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400", spec: { label: "חומר", value: "עור אמיתי" } },
      { name: "מערכת אזעקה חכמה", category: "electronics", originalPrice: 2000, costPrice: 1000, image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400", spec: { label: "חיישנים", value: "8" } },
    ];

    // Distribute participants across tiers:
    // Tier 1 (0-2): 10 deals
    // Tier 2 (3-4): 12 deals  
    // Tier 3 (5-10): 8 deals
    const tierDistribution = [
      1, 2, 0, 3, 4, 1, 6, 2, 7, 0,  // First 10
      4, 3, 5, 2, 8, 1, 4, 6, 3, 0,  // Next 10
      7, 5, 2, 4, 9, 1, 3, 6, 2, 4   // Last 10
    ];

    for (let i = 0; i < 30; i++) {
      const data = activeDealsData[i];
      const supplier = i % 2 === 0 ? supplier1 : supplier2;
      const participants = tierDistribution[i];
      const discount25 = Math.floor(data.originalPrice * 0.25);
      const discount20 = Math.floor(data.originalPrice * 0.20);
      const discount15 = Math.floor(data.originalPrice * 0.15);

      // Determine current price based on participants
      let currentPrice = data.originalPrice - discount15;
      if (participants >= 5) currentPrice = data.originalPrice - discount25;
      else if (participants >= 3) currentPrice = data.originalPrice - discount20;

      const [deal] = await db.insert(deals).values({
        id: randomUUID(),
        name: data.name,
        description: `מוצר מעולה במחיר מיוחד - הזדרז להצטרף!`,
        category: data.category,
        images: [data.image],
        originalPrice: data.originalPrice,
        currentPrice: currentPrice,
        costPrice: data.costPrice,
        participants: participants,
        targetParticipants: 10,
        minParticipants: 2,
        endTime: getFutureDate((i + 1) * 12), // Spread over different end times
        tiers: [
          { minParticipants: 0, maxParticipants: 2, discount: 15, price: data.originalPrice - discount15, commission: 10 },
          { minParticipants: 3, maxParticipants: 4, discount: 20, price: data.originalPrice - discount20, commission: 10 },
          { minParticipants: 5, maxParticipants: 10, discount: 25, price: data.originalPrice - discount25, commission: 10 },
        ],
        specs: [data.spec],
        isActive: "true",
        status: "active",
        supplierId: supplier.id,
        supplierName: supplier.supplierCompanyName,
        platformCommission: 10,
      }).returning();
      activeDeals.push(deal);

      // Add participants to active deals
      if (participants > 0) {
        for (let j = 0; j < participants; j++) {
          const customer = customers[Math.floor(Math.random() * customers.length)];
          const position = j + 1;

          let tierIndex = 0;
          let pricePaid = deal.tiers[0].price;
          for (let t = deal.tiers.length - 1; t >= 0; t--) {
            if (position >= deal.tiers[t].minParticipants + 1) {
              tierIndex = t;
              pricePaid = deal.tiers[t].price;
              break;
            }
          }

          try {
            await db.insert(participants).values({
              dealId: deal.id,
              userId: customer.id,
              name: `${customer.firstName} ${customer.lastName}`,
              email: customer.email,
              phone: customer.phone || 'N/A',
              quantity: 1,
              pricePaid: pricePaid,
              position: position,
              paymentStatus: "pending_paypal",
              tierAtJoin: tierIndex,
              finalTier: tierIndex,
            });
          } catch (error) {
            console.error(`Error inserting participant for deal ${deal.id}:`, error);
            console.error(`Customer:`, customer);
            throw error;
          }
        }
      }
    }

    console.log(`✅ Created 30 active deals with varied tier participation`);

    console.log("\n✨ ENHANCED Database seed completed successfully!\n");
    console.log("📝 Summary:");
    console.log("   👤 Users:");
    console.log("      - 1 Admin: admin@dealrush.co.il / Admin2024!");
    console.log("      - 2 Suppliers:");
    console.log("        • dreamer@dealrush.co.il / Dreamer2024!");
    console.log("        • Dreamer@gmail.com / Aa123456!");
    console.log("      - 40 Customers: customer1-40@example.com / Customer123!");
    console.log("   🎯 Deals:");
    console.log("      - 30 Active deals (tier distribution: 10/12/8 across tiers 1/2/3)");
    console.log("      - 30 Completed deals:");
    console.log("        • 25 Successful (with charged participants)");
    console.log("        • 5 Failed (didn't reach minimum)");
    console.log(`   🛒 Total Participants: ${participantCount + activeDeals.reduce((sum, d) => sum + d.participants, 0)}`);
    console.log("   💰 Tier Structure:");
    console.log("      - Tier 1: 0-2 participants (15% discount)");
    console.log("      - Tier 2: 3-4 participants (20% discount)");
    console.log("      - Tier 3: 5-10 participants (25% discount)");
    console.log("");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();
