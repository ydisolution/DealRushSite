import { db } from "../server/db";
import { 
  developers, 
  realEstateProjects, 
  projectTiers 
} from "../shared/schema";

async function seedRealEstate() {
  console.log("🏗️  Seeding real estate data...");

  // Create developers
  const [developer1] = await db
    .insert(developers)
    .values({
      name: "אפריקה ישראל",
      logo: "https://placehold.co/200x200/purple/white?text=AI",
      description: "חברת בנייה מובילה בישראל עם ניסיון של למעלה מ-50 שנה",
      contactEmail: "info@africar.co.il",
      contactPhone: "03-7654321",
      website: "https://africar.co.il",
      isActive: "true",
    })
    .returning();

  const [developer2] = await db
    .insert(developers)
    .values({
      name: "רסקו נדל\"ן",
      logo: "https://placehold.co/200x200/blue/white?text=RASCO",
      description: "קבוצת רסקו - מובילה בתחום הנדל\"ן למגורים בישראל",
      contactEmail: "contact@rasco.co.il",
      contactPhone: "03-9876543",
      website: "https://rasco.co.il",
      isActive: "true",
    })
    .returning();

  console.log("✅ Created developers:", developer1.name, developer2.name);

  // Create projects
  const [project1] = await db
    .insert(realEstateProjects)
    .values({
      developerId: developer1.id,
      title: "פארק המגורים נתניה",
      slug: "park-hamagorim-netanya",
      city: "נתניה",
      region: "Center",
      latitude: "32.3215",
      longitude: "34.8532",
      addressText: "רחוב הרצל 45, נתניה (בקירוב)",
      coverImage: "https://placehold.co/800x600/667eea/ffffff?text=Park+Netanya",
      gallery: [
        "https://placehold.co/800x600/667eea/ffffff?text=Gallery+1",
        "https://placehold.co/800x600/764ba2/ffffff?text=Gallery+2",
        "https://placehold.co/800x600/f093fb/ffffff?text=Gallery+3",
      ],
      description: "פרויקט יוקרה חדש בלב נתניה, הכולל 200 יחידות דיור איכותיות עם נוף לים התיכון. הפרויקט כולל מתחם מסחרי, גן משחקים, חדר כושר וחניה תת קרקעית.",
      highlights: [
        "נוף לים התיכון",
        "5 דקות הליכה מהחוף",
        "חניה כפולה לכל דירה",
        "גימור ברמה גבוהה",
        "מעלית שבת בכל בניין",
      ],
      propertyTypes: [
        { type: "3 חדרים", count: 80, marketPrice: 1800000 },
        { type: "4 חדרים", count: 70, marketPrice: 2200000 },
        { type: "5 חדרים", count: 40, marketPrice: 2800000 },
        { type: "פנטהאוז", count: 10, marketPrice: 3500000 },
      ],
      expectedDeliveryDate: new Date("2026-12-31"),
      earlyRegistrationStart: new Date("2025-01-01"),
      marketPriceBaseline: 2000000,
      status: "open",
      legalDisclaimer: "המחירים כוללים מע\"ם. התמונות להמחשה בלבד. הזכות שמורה לקבלן לשנות.",
    })
    .returning();

  const [project2] = await db
    .insert(realEstateProjects)
    .values({
      developerId: developer2.id,
      title: "רסקו סיטי תל אביב",
      slug: "rasco-city-tel-aviv",
      city: "תל אביב",
      region: "Center",
      latitude: "32.0853",
      longitude: "34.7818",
      addressText: "שדרות רוטשילד 100, תל אביב (בקירוב)",
      coverImage: "https://placehold.co/800x600/4facfe/ffffff?text=Rasco+TLV",
      gallery: [
        "https://placehold.co/800x600/00f2fe/ffffff?text=TLV+1",
        "https://placehold.co/800x600/4facfe/ffffff?text=TLV+2",
        "https://placehold.co/800x600/00f2fe/ffffff?text=TLV+3",
      ],
      description: "מגדל מגורים יוקרתי בלב תל אביב, עם 30 קומות ומיקום יוצא דופן על שדרות רוטשילד. הפרויקט כולל לובי מפואר, בריכת שחייה על הגג וחניה רובוטית.",
      highlights: [
        "מיקום פרימיום על רוטשילד",
        "בריכת אינסוף על הגג",
        "חניה רובוטית",
        "קונסיירז׳ 24/7",
        "Smart Home מתקדם",
      ],
      propertyTypes: [
        { type: "3 חדרים", count: 60, marketPrice: 3200000 },
        { type: "4 חדרים", count: 50, marketPrice: 4000000 },
        { type: "5 חדרים", count: 30, marketPrice: 5200000 },
        { type: "פנטהאוז דופלקס", count: 8, marketPrice: 8500000 },
      ],
      expectedDeliveryDate: new Date("2027-06-30"),
      earlyRegistrationStart: new Date("2025-02-01"),
      marketPriceBaseline: 2800000,
      status: "open",
      legalDisclaimer: "המחירים כוללים מע\"ם. התמונות להמחשה בלבד. הזכות שמורה לקבלן לשנות.",
    })
    .returning();

  const [project3] = await db
    .insert(realEstateProjects)
    .values({
      developerId: developer1.id,
      title: "גבעת יערים חיפה",
      slug: "givat-yearim-haifa",
      city: "חיפה",
      region: "North",
      latitude: "32.7940",
      longitude: "34.9896",
      addressText: "שכונת רמות רמז, חיפה",
      coverImage: "https://placehold.co/800x600/fa709a/ffffff?text=Haifa+Hills",
      gallery: [
        "https://placehold.co/800x600/fee140/ffffff?text=Haifa+1",
        "https://placehold.co/800x600/fa709a/ffffff?text=Haifa+2",
      ],
      description: "פרויקט בוטיק חדש בצפון חיפה, בשכונת רמות רמז המבוקשת. 80 דירות גן וגג עם נוף פנורמי לכרמל ולים.",
      highlights: [
        "נוף פנורמי מרהיב",
        "אוויר נקי וטבע",
        "קהילה איכותית",
        "קרוב לאוניברסיטה",
        "גינות פרטיות לדירות הגן",
      ],
      propertyTypes: [
        { type: "4 חדרים", count: 50, marketPrice: 1650000 },
        { type: "5 חדרים", count: 25, marketPrice: 1950000 },
        { type: "דירת גן", count: 5, marketPrice: 2200000 },
      ],
      expectedDeliveryDate: new Date("2026-08-31"),
      earlyRegistrationStart: new Date("2025-01-15"),
      marketPriceBaseline: 1500000,
      status: "open",
      legalDisclaimer: "המחירים כוללים מע\"ם. התמונות להמחשה בלבד.",
    })
    .returning();

  console.log("✅ Created projects:", project1.title, project2.title, project3.title);

  // Create tiers for project 1 (Netanya)
  await db.insert(projectTiers).values([
    {
      projectId: project1.id,
      name: "מדרגה 1 - חלוצים",
      thresholdRegistrants: 20,
      fromPrice: 1700000,
      savings: 300000,
      savingsPercent: 15,
      benefits: ["חניה כפולה", "מחסן 8 מ\"ר", "שדרוג חבילת גימור"],
      isActive: "true",
      sortOrder: 1,
    },
    {
      projectId: project1.id,
      name: "מדרגה 2 - מצטרפים",
      thresholdRegistrants: 50,
      fromPrice: 1800000,
      savings: 200000,
      savingsPercent: 10,
      benefits: ["חניה כפולה", "מחסן 6 מ\"ר"],
      isActive: "true",
      sortOrder: 2,
    },
    {
      projectId: project1.id,
      name: "מדרגה 3 - אחרונים",
      thresholdRegistrants: 100,
      fromPrice: 1900000,
      savings: 100000,
      savingsPercent: 5,
      benefits: ["חניה אחת", "מחסן 4 מ\"ר"],
      isActive: "true",
      sortOrder: 3,
    },
  ]);

  // Create tiers for project 2 (Tel Aviv)
  await db.insert(projectTiers).values([
    {
      projectId: project2.id,
      name: "מדרגה 1 - VIP",
      thresholdRegistrants: 15,
      fromPrice: 3400000,
      savings: 600000,
      savingsPercent: 15,
      benefits: ["2 חניות רובוטיות", "מחסן 10 מ\"ר", "Smart Home מלא", "חבילת גימור פרימיום"],
      isActive: "true",
      sortOrder: 1,
    },
    {
      projectId: project2.id,
      name: "מדרגה 2 - פרימיום",
      thresholdRegistrants: 40,
      fromPrice: 3700000,
      savings: 300000,
      savingsPercent: 8,
      benefits: ["חניה רובוטית", "מחסן 8 מ\"ר", "Smart Home"],
      isActive: "true",
      sortOrder: 2,
    },
    {
      projectId: project2.id,
      name: "מדרגה 3 - סטנדרט",
      thresholdRegistrants: 80,
      fromPrice: 3900000,
      savings: 100000,
      savingsPercent: 3,
      benefits: ["חניה רובוטית", "מחסן 5 מ\"ר"],
      isActive: "true",
      sortOrder: 3,
    },
  ]);

  // Create tiers for project 3 (Haifa)
  await db.insert(projectTiers).values([
    {
      projectId: project3.id,
      name: "מדרגה 1 - ראשונים",
      thresholdRegistrants: 10,
      fromPrice: 1500000,
      savings: 250000,
      savingsPercent: 14,
      benefits: ["גינה פרטית 50 מ\"ר", "חניה כפולה", "מחסן"],
      isActive: "true",
      sortOrder: 1,
    },
    {
      projectId: project3.id,
      name: "מדרגה 2 - מצטרפים",
      thresholdRegistrants: 30,
      fromPrice: 1600000,
      savings: 150000,
      savingsPercent: 9,
      benefits: ["גינה 30 מ\"ר", "חניה"],
      isActive: "true",
      sortOrder: 2,
    },
    {
      projectId: project3.id,
      name: "מדרגה 3 - אחרונים",
      thresholdRegistrants: 60,
      fromPrice: 1700000,
      savings: 50000,
      savingsPercent: 3,
      benefits: ["חניה"],
      isActive: "true",
      sortOrder: 3,
    },
  ]);

  console.log("✅ Created discount tiers for all projects");
  console.log("🎉 Real estate seeding completed!");
}

seedRealEstate()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding real estate:", error);
    process.exit(1);
  });
