import { db } from "../server/db.js";
import { sql } from "drizzle-orm";
import { 
  developers, 
  realEstateProjects, 
  projectTiers 
} from "../shared/schema.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupAndSeedRealEstate() {
  try {
    console.log("🔧 Setting up Real Estate module...");

    // Step 1: Create tables
    const migrationPath = path.join(__dirname, "../migrations/0002_real_estate_module.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    console.log("📦 Creating tables...");
    await db.execute(sql.raw(migrationSQL));
    console.log("✅ Tables created successfully");

    // Step 2: Seed data
    console.log("🌱 Seeding real estate data...");

    // Insert Developers
    const devs = await db.insert(developers).values([
      {
        name: "אפריקה ישראל",
        description: "אחת מחברות הנדל\"ן המובילות בישראל עם עשרות שנות ניסיון",
        contactEmail: "sales@africa-israel.co.il",
        contactPhone: "03-7634444",
        website: "https://www.africa-israel.co.il",
        logo: "https://placehold.co/200x80/667eea/ffffff?text=Africa+Israel",
        isActive: "true"
      },
      {
        name: "רסקו נדל\"ן",
        description: "חברת נדל\"ן מובילה המתמחה בפרויקטים איכותיים ברחבי הארץ",
        contactEmail: "info@rasco-re.co.il",
        contactPhone: "03-5555555",
        website: "https://www.rasco.co.il",
        logo: "https://placehold.co/200x80/7B2FF7/ffffff?text=Rasco",
        isActive: "true"
      }
    ]).returning();

    console.log(`✅ Created ${devs.length} developers`);

    // Insert Projects
    const projectsData = [
      {
        developerId: devs[0].id,
        title: "נתניה רזידנס - דירות יוקרה על הים",
        slug: "netanya-residence",
        city: "נתניה",
        region: "Center",
        latitude: "32.3215",
        longitude: "34.8532",
        addressText: "שדרות ניצה, נתניה",
        description: "פרויקט יוקרתי הכולל 120 יחידות דיור ברמה הגבוהה ביותר, במרחק הליכה מהחוף. כל דירה מעוצבת ברמה גבוהה עם מרפסות נוף וחניה תת קרקעית.",
        highlights: [
          "100 מטרים מהחוף",
          "בריכה משותפת וחדר כושר",
          "מעלית שבת",
          "חניה תת-קרקעית"
        ],
        propertyTypes: [
          { type: "3 חדרים", count: 40, marketPrice: 1800000 },
          { type: "4 חדרים", count: 50, marketPrice: 2200000 },
          { type: "5 חדרים", count: 30, marketPrice: 2800000 }
        ],
        coverImage: "https://placehold.co/800x600/667eea/ffffff?text=Netanya+Project",
        gallery: [
          "https://placehold.co/800x600/667eea/ffffff?text=Living+Room",
          "https://placehold.co/800x600/667eea/ffffff?text=Kitchen",
          "https://placehold.co/800x600/667eea/ffffff?text=Bedroom"
        ],
        marketPriceBaseline: 2000000,
        expectedDeliveryDate: new Date("2026-06-01"),
        earlyRegistrationStart: new Date(),
        status: "open"
      },
      {
        developerId: devs[1].id,
        title: "תל אביב סנטר - מגדל יוקרה בלב העיר",
        slug: "tel-aviv-center",
        city: "תל אביב",
        region: "Center",
        latitude: "32.0853",
        longitude: "34.7818",
        addressText: "רוטשילד 45, תל אביב",
        description: "מגדל מרשים בן 30 קומות בלב העיר. 200 יחידות דיור יוקרתיות עם נוף פנורמי, קונסיירז' 24/7, וגינת גג משותפת.",
        highlights: [
          "רחוב רוטשילד",
          "קונסיירז' 24/7",
          "גינת גג וספא",
          "2 חניות לכל דירה"
        ],
        propertyTypes: [
          { type: "3 חדרים", count: 80, marketPrice: 3500000 },
          { type: "4 חדרים", count: 70, marketPrice: 4500000 },
          { type: "פנטהאוז 5 חדרים", count: 50, marketPrice: 6500000 }
        ],
        coverImage: "https://placehold.co/800x600/7B2FF7/ffffff?text=TLV+Tower",
        gallery: [
          "https://placehold.co/800x600/7B2FF7/ffffff?text=Tower+View",
          "https://placehold.co/800x600/7B2FF7/ffffff?text=Lobby",
          "https://placehold.co/800x600/7B2FF7/ffffff?text=Penthouse"
        ],
        marketPriceBaseline: 3500000,
        expectedDeliveryDate: new Date("2027-03-01"),
        earlyRegistrationStart: new Date(),
        status: "open"
      },
      {
        developerId: devs[0].id,
        title: "חיפה פארק - פרויקט משפחות בכרמל",
        slug: "haifa-park",
        city: "חיפה",
        region: "North",
        latitude: "32.7940",
        longitude: "34.9896",
        addressText: "דרך הכרמל, חיפה",
        description: "פרויקט משפחות יוקרתי על הכרמל המשלב 150 יחידות דיור עם גינות פרטיות, ליד פארק וממ\"ד בכל דירה.",
        highlights: [
          "גינות פרטיות",
          "ממ\"ד בכל דירה",
          "חניה מקורה",
          "ליד פארק וגנים"
        ],
        propertyTypes: [
          { type: "4 חדרים", count: 70, marketPrice: 1650000 },
          { type: "5 חדרים + גינה", count: 50, marketPrice: 2050000 },
          { type: "דופלקס 6 חדרים", count: 30, marketPrice: 2450000 }
        ],
        coverImage: "https://placehold.co/800x600/667eea/ffffff?text=Haifa+Park",
        gallery: [
          "https://placehold.co/800x600/667eea/ffffff?text=Garden+View",
          "https://placehold.co/800x600/667eea/ffffff?text=Park",
          "https://placehold.co/800x600/667eea/ffffff?text=Interior"
        ],
        marketPriceBaseline: 1750000,
        expectedDeliveryDate: new Date("2026-12-01"),
        earlyRegistrationStart: new Date(),
        status: "open"
      }
    ];

    const projects = await db.insert(realEstateProjects).values(projectsData).returning();

    console.log(`✅ Created ${projects.length} projects`);

    // Insert Tiers for each project
    const tierData = [
      // Netanya Project Tiers
      {
        projectId: projects[0].id,
        name: "מדרגה ראשונה - חסכון 3%",
        thresholdRegistrants: 10,
        fromPrice: 1940000,
        savings: 60000,
        savingsPercent: 3,
        benefits: ["חניה מקורה", "מחסן"],
        sortOrder: 1
      },
      {
        projectId: projects[0].id,
        name: "מדרגה שנייה - חסכון 6%",
        thresholdRegistrants: 30,
        fromPrice: 1880000,
        savings: 120000,
        savingsPercent: 6,
        benefits: ["חניה מקורה", "מחסן", "שדרוג משטחים"],
        sortOrder: 2
      },
      {
        projectId: projects[0].id,
        name: "מדרגה שלישית - חסכון 10%",
        thresholdRegistrants: 50,
        fromPrice: 1800000,
        savings: 200000,
        savingsPercent: 10,
        benefits: ["חניה מקורה", "מחסן", "שדרוג משטחים", "חניה נוספת"],
        sortOrder: 3
      },

      // Tel Aviv Project Tiers
      {
        projectId: projects[1].id,
        name: "מדרגה ראשונה - חסכון 5%",
        thresholdRegistrants: 20,
        fromPrice: 3800000,
        savings: 200000,
        savingsPercent: 5,
        benefits: ["חניה זוגית", "מחסן"],
        sortOrder: 1
      },
      {
        projectId: projects[1].id,
        name: "מדרגה שנייה - חסכון 8%",
        thresholdRegistrants: 50,
        fromPrice: 3680000,
        savings: 320000,
        savingsPercent: 8,
        benefits: ["חניה זוגית", "מחסן", "דירה חכמה"],
        sortOrder: 2
      },
      {
        projectId: projects[1].id,
        name: "מדרגה שלישית - חסכון 12%",
        thresholdRegistrants: 100,
        fromPrice: 3520000,
        savings: 480000,
        savingsPercent: 12,
        benefits: ["חניה זוגית", "מחסן", "דירה חכמה", "שדרוגי פרימיום"],
        sortOrder: 3
      },

      // Haifa Project Tiers
      {
        projectId: projects[2].id,
        name: "מדרגה ראשונה - חסכון 4%",
        thresholdRegistrants: 15,
        fromPrice: 1680000,
        savings: 70000,
        savingsPercent: 4,
        benefits: ["גינה מעוצבת", "מחסן"],
        sortOrder: 1
      },
      {
        projectId: projects[2].id,
        name: "מדרגה שנייה - חסכון 7%",
        thresholdRegistrants: 40,
        fromPrice: 1627500,
        savings: 122500,
        savingsPercent: 7,
        benefits: ["גינה מעוצבת", "מחסן", "חניה מקורה"],
        sortOrder: 2
      },
      {
        projectId: projects[2].id,
        name: "מדרגה שלישית - חסכון 12%",
        thresholdRegistrants: 70,
        fromPrice: 1540000,
        savings: 210000,
        savingsPercent: 12,
        benefits: ["גינה מעוצבת", "מחסן", "חניה מקורה", "פרגולה"],
        sortOrder: 3
      }
    ];

    const tiers = await db.insert(projectTiers).values(tierData).returning();
    console.log(`✅ Created ${tiers.length} tier levels`);

    console.log("\n🎉 Real Estate module setup complete!");
    console.log("\n📊 Summary:");
    console.log(`   - ${devs.length} developers`);
    console.log(`   - ${projects.length} projects`);
    console.log(`   - ${tiers.length} discount tiers`);
    console.log("\n🌐 You can now visit /real-estate to see the projects!");

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

setupAndSeedRealEstate();
