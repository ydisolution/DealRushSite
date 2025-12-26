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
  console.log("🌱 Starting database seed...");

  try {
    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await db.delete(participants);
    await db.delete(deals);
    await db.delete(users);

    // Create Users
    console.log("👥 Creating users...");
    
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
    console.log("✅ Admin created:", admin.email);

    const supplierPassword = await hashPassword("Dreamer2024!");
    const [supplier] = await db.insert(users).values({
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
    console.log("✅ Supplier created:", supplier.email);

    const nirPassword = await hashPassword("Aa123456!");
    const [nir] = await db.insert(users).values({
      id: randomUUID(),
      email: "nir@example.com",
      passwordHash: nirPassword,
      firstName: "ניר",
      lastName: "",
      phone: "050-1234567",
      isAdmin: "false",
      isSupplier: "false",
      isEmailVerified: "true",
    }).returning();
    console.log("✅ Customer created:", nir.email);

    const shlomiPassword = await hashPassword("Aa123456!");
    const [shlomi] = await db.insert(users).values({
      id: randomUUID(),
      email: "shlomi@example.com",
      passwordHash: shlomiPassword,
      firstName: "שלומי",
      lastName: "לוי",
      phone: "052-9876543",
      isAdmin: "false",
      isSupplier: "false",
      isEmailVerified: "true",
    }).returning();
    console.log("✅ Customer created:", shlomi.email);

    // Create additional supplier with gmail
    const dreamerGmailPassword = await hashPassword("Aa123456!");
    const [dreamerGmail] = await db.insert(users).values({
      id: randomUUID(),
      email: "Dreamer@gmail.com",
      passwordHash: dreamerGmailPassword,
      firstName: "Dreamer",
      lastName: "Gmail",
      isAdmin: "false",
      isSupplier: "true",
      supplierCompanyName: "Dreamer Gmail Store",
      isEmailVerified: "true",
    }).returning();
    console.log("✅ Gmail Supplier created:", dreamerGmail.email);

    // Create Deals
    console.log("🎯 Creating deals (30 products with variety)...");
    const now = new Date();

    // Helper function to create random past dates
    const getPastDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const getFutureDate = (hoursAhead: number) => new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // COMPLETED DEALS (for statistics - 10 deals)
    // === COMPLETED DEALS (10) - for statistics ===
    const completedDeals = [];
    
    completedDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מקרר Samsung דלתות כפולות",
      description: "מקרר משפחתי מתקדם עם טכנולוגיית Twin Cooling",
      category: "electrical",
      images: ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400"],
      originalPrice: 5000,
      currentPrice: 3750,
      costPrice: 2500,
      participants: 10,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getPastDate(5),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 4250, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 4000, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 3750, commission: 10 },
      ],
      specs: [{ label: "נפח", value: "500 ליטר" }],
      isActive: "false",
      status: "completed",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    completedDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: 'מחשב נייד Dell XPS 13"',
      description: "מחשב נייד עסקי מתקדם, מעבד Intel i7, 16GB RAM",
      category: "electronics",
      images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"],
      originalPrice: 6000,
      currentPrice: 4500,
      costPrice: 3000,
      participants: 8,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getPastDate(10),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 5100, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 4800, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 4500, commission: 10 },
      ],
      specs: [{ label: "מעבד", value: "Intel i7" }],
      isActive: "false",
      status: "completed",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    completedDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "אוזניות Bose QuietComfort",
      description: "אוזניות עם ביטול רעשים אקטיבי מתקדם",
      category: "electronics",
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"],
      originalPrice: 1500,
      currentPrice: 1125,
      costPrice: 750,
      participants: 7,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getPastDate(3),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 1275, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 1200, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 1125, commission: 10 },
      ],
      specs: [{ label: "סוג", value: "Over-ear" }],
      isActive: "false",
      status: "completed",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    completedDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "שואב אבק רובוטי Xiaomi",
      description: "שואב אבק חכם עם ניווט לייזר ושטיפה",
      category: "electrical",
      images: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400"],
      originalPrice: 2000,
      currentPrice: 1500,
      costPrice: 1000,
      participants: 10,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getPastDate(7),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 1700, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 1600, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 1500, commission: 10 },
      ],
      specs: [{ label: "קיבולת", value: "0.5L" }],
      isActive: "false",
      status: "completed",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    completedDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "ספה תלת מושבית מעוצבת",
      description: "ספה נוחה עם ריפוד בד איכותי",
      category: "furniture",
      images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400"],
      originalPrice: 4000,
      currentPrice: 3000,
      costPrice: 2000,
      participants: 6,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getPastDate(4),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 3400, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 3200, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 3000, commission: 10 },
      ],
      specs: [{ label: "מידות", value: "200x90 ס\"מ" }],
      isActive: "false",
      status: "completed",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    completedDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מיקסר KitchenAid מקצועי",
      description: "מיקסר עומד חזק במיוחד לאפייה מקצועית",
      category: "electrical",
      images: ["https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?w=400"],
      originalPrice: 3000,
      currentPrice: 2250,
      costPrice: 1500,
      participants: 9,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getPastDate(6),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 2550, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 2400, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 2250, commission: 10 },
      ],
      specs: [{ label: "הספק", value: "300W" }],
      isActive: "false",
      status: "completed",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    completedDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "ארון הזזה 3 דלתות",
      description: "ארון הזזה מעוצב עם תאורת LED",
      category: "furniture",
      images: ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400"],
      originalPrice: 5000,
      currentPrice: 3750,
      costPrice: 2500,
      participants: 5,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getPastDate(8),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 4250, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 4000, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 3750, commission: 10 },
      ],
      specs: [{ label: "מידות", value: "240x220 ס\"מ" }],
      isActive: "false",
      status: "completed",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    completedDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "טאבלט Samsung Galaxy Tab",
      description: "טאבלט אנדרואיד מתקדם 10.5 אינץ'",
      category: "electronics",
      images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"],
      originalPrice: 2500,
      currentPrice: 1875,
      costPrice: 1250,
      participants: 10,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getPastDate(2),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 2125, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 2000, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 1875, commission: 10 },
      ],
      specs: [{ label: "מסך", value: '10.5"' }],
      isActive: "false",
      status: "completed",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    completedDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "נעלי ריצה Nike Air Zoom",
      description: "נעלי ריצה מקצועיות עם ספוג מתקדם",
      category: "sports",
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"],
      originalPrice: 600,
      currentPrice: 450,
      costPrice: 300,
      participants: 8,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getPastDate(9),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 510, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 480, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 450, commission: 10 },
      ],
      specs: [{ label: "מידה", value: "42" }],
      isActive: "false",
      status: "completed",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    completedDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מזרן אורטופדי Queen",
      description: "מזרן זיכרון צורה עם ציפוי אנטי-בקטריאלי",
      category: "home",
      images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"],
      originalPrice: 3000,
      currentPrice: 2250,
      costPrice: 1500,
      participants: 7,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getPastDate(1),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 2550, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 2400, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 2250, commission: 10 },
      ],
      specs: [{ label: "מידה", value: "160x200" }],
      isActive: "false",
      status: "completed",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    console.log(`✅ Created ${completedDeals.length} completed deals`);

    // === ACTIVE DEALS (20) - for testing ===
    const activeDeals = [];

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: 'טלוויזיה LG OLED 65"',
      description: "טלוויזיה חכמה 4K עם טכנולוגיית OLED",
      category: "electrical",
      images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400"],
      originalPrice: 8000,
      currentPrice: 6000,
      costPrice: 4000,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(24),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 6800, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 6400, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 6000, commission: 10 },
      ],
      specs: [{ label: "גודל", value: '65"' }],
      isActive: "true",
      status: "active",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מזגן Tadiran 1.5 כ\"ס",
      description: "מזגן אינוורטר חסכוני באנרגיה",
      category: "electrical",
      images: ["https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?w=400"],
      originalPrice: 3500,
      currentPrice: 2625,
      costPrice: 1750,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(48),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 2975, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 2800, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 2625, commission: 10 },
      ],
      specs: [{ label: "הספק", value: '1.5 כ"ס' }],
      isActive: "true",
      status: "active",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "שולחן אוכל עץ מלא",
      description: "שולחן אוכל מעץ אלון ל-8 סועדים",
      category: "furniture",
      images: ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400"],
      originalPrice: 4500,
      currentPrice: 3375,
      costPrice: 2250,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(72),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 3825, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 3600, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 3375, commission: 10 },
      ],
      specs: [{ label: "מידות", value: "200x100" }],
      isActive: "true",
      status: "active",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מכונת קפה Nespresso",
      description: "מכונת קפה אוטומטית עם מקציף חלב",
      category: "electrical",
      images: ["https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400"],
      originalPrice: 1200,
      currentPrice: 900,
      costPrice: 600,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(36),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 1020, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 960, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 900, commission: 10 },
      ],
      specs: [{ label: "לחץ", value: "19 בר" }],
      isActive: "true",
      status: "active",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "כיסא גיימינג מקצועי",
      description: "כיסא ארגונומי עם תמיכה מלאה לגב",
      category: "furniture",
      images: ["https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400"],
      originalPrice: 2000,
      currentPrice: 1500,
      costPrice: 1000,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(60),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 1700, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 1600, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 1500, commission: 10 },
      ],
      specs: [{ label: "גובה מקסימלי", value: "135 ס\"מ" }],
      isActive: "true",
      status: "active",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מייבש כביסה Bosch",
      description: "מייבש משאבת חום 8 ק\"ג",
      category: "electrical",
      images: ["https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=400"],
      originalPrice: 4000,
      currentPrice: 3000,
      costPrice: 2000,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(84),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 3400, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 3200, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 3000, commission: 10 },
      ],
      specs: [{ label: "קיבולת", value: "8 ק\"ג" }],
      isActive: "true",
      status: "active",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מנורת תקרה מעוצבת",
      description: "מנורת LED חכמה עם שלט",
      category: "home",
      images: ["https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400"],
      originalPrice: 800,
      currentPrice: 600,
      costPrice: 400,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(96),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 680, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 640, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 600, commission: 10 },
      ],
      specs: [{ label: "סוג", value: "LED חכמה" }],
      isActive: "true",
      status: "active",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מקלט Sony Soundbar",
      description: "מערכת סאונד 5.1 עם סאבוופר",
      category: "electronics",
      images: ["https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400"],
      originalPrice: 3000,
      currentPrice: 2250,
      costPrice: 1500,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(108),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 2550, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 2400, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 2250, commission: 10 },
      ],
      specs: [{ label: "ערוצים", value: "5.1" }],
      isActive: "true",
      status: "active",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מנגל גז Weber",
      description: "מנגל 3 מבערים עם כיסוי",
      category: "home",
      images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400"],
      originalPrice: 2500,
      currentPrice: 1875,
      costPrice: 1250,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(120),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 2125, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 2000, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 1875, commission: 10 },
      ],
      specs: [{ label: "מבערים", value: "3" }],
      isActive: "true",
      status: "active",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מצלמת GoPro Hero 11",
      description: "מצלמת אקסטרים 4K עמידה למים",
      category: "electronics",
      images: ["https://images.unsplash.com/photo-1606941973649-a686528c2197?w=400"],
      originalPrice: 2000,
      currentPrice: 1500,
      costPrice: 1000,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(132),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 1700, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 1600, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 1500, commission: 10 },
      ],
      specs: [{ label: "רזולוציה", value: "4K60" }],
      isActive: "true",
      status: "active",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "סט סכו\"ם 72 חלקים",
      description: "סט סכו\"ם נירוסטה במזוודה",
      category: "home",
      images: ["https://images.unsplash.com/photo-1578390403960-78fe9a7e2e1f?w=400"],
      originalPrice: 1000,
      currentPrice: 750,
      costPrice: 500,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(144),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 850, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 800, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 750, commission: 10 },
      ],
      specs: [{ label: "חלקים", value: "72" }],
      isActive: "true",
      status: "active",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "אופני הרים Giant",
      description: "אופניים 29 אינץ' עם 21 הילוכים",
      category: "sports",
      images: ["https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400"],
      originalPrice: 3500,
      currentPrice: 2625,
      costPrice: 1750,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(156),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 2975, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 2800, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 2625, commission: 10 },
      ],
      specs: [{ label: "גודל", value: '29"' }],
      isActive: "true",
      status: "active",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מדפסת HP LaserJet",
      description: "מדפסת לייזר צבעונית רב-תכליתית",
      category: "electronics",
      images: ["https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400"],
      originalPrice: 1500,
      currentPrice: 1125,
      costPrice: 750,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(168),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 1275, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 1200, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 1125, commission: 10 },
      ],
      specs: [{ label: "סוג", value: "לייזר צבע" }],
      isActive: "true",
      status: "active",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "שעון חכם Apple Watch 8",
      description: "שעון חכם עם GPS וחיישני בריאות",
      category: "electronics",
      images: ["https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400"],
      originalPrice: 2500,
      currentPrice: 1875,
      costPrice: 1250,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(180),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 2125, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 2000, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 1875, commission: 10 },
      ],
      specs: [{ label: "גודל", value: "44mm" }],
      isActive: "true",
      status: "active",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מזוודה קשיחה 28 אינץ'",
      description: "מזוודה עמידה עם 4 גלגלים",
      category: "other",
      images: ["https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400"],
      originalPrice: 800,
      currentPrice: 600,
      costPrice: 400,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(192),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 680, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 640, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 600, commission: 10 },
      ],
      specs: [{ label: "גודל", value: '28"' }],
      isActive: "true",
      status: "active",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מזרן יוגה מקצועי",
      description: "מזרן 6 מ\"מ עם רצועת נשיאה",
      category: "sports",
      images: ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400"],
      originalPrice: 300,
      currentPrice: 225,
      costPrice: 150,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(204),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 255, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 240, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 225, commission: 10 },
      ],
      specs: [{ label: "עובי", value: "6 מ\"מ" }],
      isActive: "true",
      status: "active",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מעבד מזון Philips",
      description: "מעבד רב תכליתי עם 10 אביזרים",
      category: "electrical",
      images: ["https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400"],
      originalPrice: 1200,
      currentPrice: 900,
      costPrice: 600,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(216),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 1020, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 960, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 900, commission: 10 },
      ],
      specs: [{ label: "הספק", value: "1000W" }],
      isActive: "true",
      status: "active",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "ספריית קיר מודולרית",
      description: "ספרייה 5 מדפים בעיצוב נקי",
      category: "furniture",
      images: ["https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400"],
      originalPrice: 1800,
      currentPrice: 1350,
      costPrice: 900,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(228),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 1530, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 1440, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 1350, commission: 10 },
      ],
      specs: [{ label: "מדפים", value: "5" }],
      isActive: "true",
      status: "active",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "מסך מחשב Dell 27 אינץ'",
      description: "מסך 4K IPS עם HDR",
      category: "electronics",
      images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400"],
      originalPrice: 2000,
      currentPrice: 1500,
      costPrice: 1000,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(240),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 1700, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 1600, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 1500, commission: 10 },
      ],
      specs: [{ label: "רזולוציה", value: "4K" }],
      isActive: "true",
      status: "active",
      supplierId: supplier.id,
      supplierName: supplier.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    activeDeals.push(await db.insert(deals).values({
      id: randomUUID(),
      name: "סיר לחץ חשמלי Instant Pot",
      description: "סיר רב-תכליתי 6 ליטר",
      category: "electrical",
      images: ["https://images.unsplash.com/photo-1585937369544-37e3c0b16f24?w=400"],
      originalPrice: 600,
      currentPrice: 450,
      costPrice: 300,
      participants: 0,
      targetParticipants: 10,
      minParticipants: 2,
      endTime: getFutureDate(252),
      tiers: [
        { minParticipants: 0, maxParticipants: 2, discount: 15, price: 510, commission: 10 },
        { minParticipants: 3, maxParticipants: 4, discount: 20, price: 480, commission: 10 },
        { minParticipants: 5, maxParticipants: 10, discount: 25, price: 450, commission: 10 },
      ],
      specs: [{ label: "נפח", value: "6 ליטר" }],
      isActive: "true",
      status: "active",
      supplierId: dreamerGmail.id,
      supplierName: dreamerGmail.supplierCompanyName,
      platformCommission: 10,
    }).returning());

    console.log(`✅ Created ${activeDeals.length} active deals`);
    console.log(`✅ Total: ${completedDeals.length + activeDeals.length} deals created`);

    // Create Participants (Purchases) for completed deals only
    console.log("🛒 Creating participant purchases for completed deals...");
    
    let participantCount = 0;
    
    // Add participants to each completed deal
    for (const [dealIndex, deal] of completedDeals.entries()) {
      const numParticipants = deal[0].participants;
      const dealTiers = deal[0].tiers;
      
      for (let i = 0; i < numParticipants; i++) {
        const position = i + 1;
        const user = (i % 2 === 0) ? nir : shlomi;
        
        // Determine which tier the participant is in
        let tierIndex = 0;
        let pricePaid = dealTiers[0].price;
        for (let t = dealTiers.length - 1; t >= 0; t--) {
          if (position >= dealTiers[t].minParticipants) {
            tierIndex = t;
            pricePaid = dealTiers[t].price;
            break;
          }
        }
        
        await db.insert(participants).values({
          dealId: deal[0].id,
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          quantity: 1,
          pricePaid: pricePaid || 0,
          position: position,
          paymentStatus: "charged",
          tierAtJoin: tierIndex,
          finalTier: tierIndex,
          stripePaymentMethodId: `pm_mock_${user.firstName}_${i}`,
          cardLast4: (i % 2 === 0) ? "4242" : "5555",
          cardBrand: (i % 2 === 0) ? "visa" : "mastercard",
          chargedAt: getPastDate(dealIndex + 1),
          chargedAmount: pricePaid,
        });
        
        participantCount++;
      }
    }

    console.log(`✅ Created ${participantCount} participants for ${completedDeals.length} completed deals`);
    
    // Add a few participants to some active deals
    console.log("🛒 Adding some participants to active deals...");
    
    const [firstActiveDeal] = activeDeals[0];
    await db.insert(participants).values({
      dealId: firstActiveDeal.id,
      userId: nir.id,
      name: `${nir.firstName} ${nir.lastName}`,
      email: nir.email,
      phone: nir.phone || '',
      quantity: 1,
      pricePaid: firstActiveDeal.tiers[0].price,
      position: 1,
      paymentStatus: "pending_paypal",
      tierAtJoin: 0,
      finalTier: 0,
    });
    
    const [secondActiveDeal] = activeDeals[1];
    await db.insert(participants).values({
      dealId: secondActiveDeal.id,
      userId: shlomi.id,
      name: `${shlomi.firstName} ${shlomi.lastName}`,
      email: shlomi.email,
      phone: shlomi.phone || '',
      quantity: 1,
      pricePaid: secondActiveDeal.tiers[0].price,
      position: 1,
      paymentStatus: "pending_paypal",
      tierAtJoin: 0,
      finalTier: 0,
    });
    
    // Update participant counts for active deals with purchases
    await db.update(deals).set({ participants: 1 }).where(eq(deals.id, firstActiveDeal.id));
    await db.update(deals).set({ participants: 1 }).where(eq(deals.id, secondActiveDeal.id));

    console.log("\n✨ Database seed completed successfully!\n");
    console.log("");
    console.log("📝 Summary:");
    console.log("   - Admin: admin@dealrush.co.il / Admin2024!");
    console.log("   - Supplier 1: dreamer@dealrush.co.il / Dreamer2024!");
    console.log("   - Supplier 2: Dreamer@gmail.com / Aa123456!");
    console.log("   - Customer 1: nir@example.com / Aa123456!");
    console.log("   - Customer 2: shlomi@example.com / Aa123456!");
    console.log("   - 30 deals created (10 completed with statistics, 20 active for testing)");
    console.log(`   - ${participantCount + 2} participant purchases created`);
    console.log("   - Tier structure: 0-2 (15% off), 3-4 (20% off), 5-10 (25% off)");
    console.log("");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();
