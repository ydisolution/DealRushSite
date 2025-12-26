import "dotenv/config";
import { db } from "../server/db";
import { deals } from "../shared/schema";
import { eq } from "drizzle-orm";

async function addRealEstateDeals() {
  console.log("🏢 מוסיף דילי נדל\"ן לאתר...\n");
  
  try {
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    const realEstateDeals = [
      {
        name: "דירת 3 חדרים בהרצליה פיתוח",
        description: "דירה חדשה מקבלן באזור מבוקש, קומה 5, עם מעלית ומרפסת שמש",
        category: "apartments",
        images: ["/uploads/default-apartment-1.jpg"],
        originalPrice: 240000000, // 2,400,000 ₪ באגורות
        currentPrice: 220800000,  // הנחה של 8%
        costPrice: 200000000,
        participants: 0,
        targetParticipants: 20,
        minParticipants: 5,
        endTime: twoWeeksFromNow,
        tiers: [
          { minParticipants: 0, maxParticipants: 7, discount: 8 },
          { minParticipants: 8, maxParticipants: 14, discount: 10 },
          { minParticipants: 15, maxParticipants: 20, discount: 12 }
        ],
        specs: [
          { label: "חדרים", value: "3" },
          { label: "שטח", value: "95 מ\"ר" },
          { label: "קומה", value: "5" },
          { label: "מרפסת", value: "15 מ\"ר" },
          { label: "מעלית", value: "כן" },
        ],
        isActive: "true",
        status: "active",
        platformCommission: 3,
        enableDynamicPricing: "false"
      },
      {
        name: "דירת 4 חדרים בתל אביב",
        description: "דירה חדשה מקבלן באזור מבוקש, קרוב לרכבת ולים",
        category: "apartments",
        images: ["/uploads/default-apartment-2.jpg"],
        originalPrice: 320000000, // 3,200,000 ₪
        currentPrice: 294400000,  // הנחה של 8%
        costPrice: 280000000,
        participants: 0,
        targetParticipants: 25,
        minParticipants: 8,
        endTime: twoWeeksFromNow,
        tiers: [
          { minParticipants: 0, maxParticipants: 10, discount: 8 },
          { minParticipants: 11, maxParticipants: 18, discount: 10 },
          { minParticipants: 19, maxParticipants: 25, discount: 12 }
        ],
        specs: [
          { label: "חדרים", value: "4" },
          { label: "שטח", value: "120 מ\"ר" },
          { label: "קומה", value: "8" },
          { label: "מרפסת", value: "20 מ\"ר" },
          { label: "חניה", value: "כן" },
        ],
        isActive: "true",
        status: "active",
        platformCommission: 3,
        enableDynamicPricing: "false"
      },
      {
        name: "דירת 5 חדרים בראשון לציון",
        description: "דירת גן מקבלן, עם חצר פרטית וגינה",
        category: "apartments",
        images: ["/uploads/default-apartment-3.jpg"],
        originalPrice: 280000000, // 2,800,000 ₪
        currentPrice: 257600000,  // הנחה של 8%
        costPrice: 240000000,
        participants: 0,
        targetParticipants: 30,
        minParticipants: 10,
        endTime: twoWeeksFromNow,
        tiers: [
          { minParticipants: 0, maxParticipants: 12, discount: 8 },
          { minParticipants: 13, maxParticipants: 22, discount: 10 },
          { minParticipants: 23, maxParticipants: 30, discount: 15 }
        ],
        specs: [
          { label: "חדרים", value: "5" },
          { label: "שטח", value: "140 מ\"ר" },
          { label: "סוג", value: "דירת גן" },
          { label: "חצר", value: "50 מ\"ר" },
          { label: "חניות", value: "2" },
        ],
        isActive: "true",
        status: "active",
        platformCommission: 3,
        enableDynamicPricing: "false"
      },
      {
        name: "דירת 2 חדרים בפתח תקווה",
        description: "דירה חדשה מקבלן, מושקעת ומרווחת, קרוב למרכז",
        category: "apartments",
        images: ["/uploads/default-apartment-4.jpg"],
        originalPrice: 180000000, // 1,800,000 ₪
        currentPrice: 165600000,  // הנחה של 8%
        costPrice: 155000000,
        participants: 0,
        targetParticipants: 15,
        minParticipants: 5,
        endTime: twoWeeksFromNow,
        tiers: [
          { minParticipants: 0, maxParticipants: 6, discount: 8 },
          { minParticipants: 7, maxParticipants: 11, discount: 10 },
          { minParticipants: 12, maxParticipants: 15, discount: 12 }
        ],
        specs: [
          { label: "חדרים", value: "2" },
          { label: "שטח", value: "70 מ\"ר" },
          { label: "קומה", value: "3" },
          { label: "מרפסת", value: "10 מ\"ר" },
          { label: "מעלית", value: "כן" },
        ],
        isActive: "true",
        status: "active",
        platformCommission: 3,
        enableDynamicPricing: "false"
      },
      {
        name: "פנטהאוז 6 חדרים בנתניה",
        description: "פנטהאוז יוקרתי עם נוף לים, 2 קומות ומרפסת גג ענקית",
        category: "apartments",
        images: ["/uploads/default-apartment-5.jpg"],
        originalPrice: 480000000, // 4,800,000 ₪
        currentPrice: 441600000,  // הנחה של 8%
        costPrice: 420000000,
        participants: 0,
        targetParticipants: 20,
        minParticipants: 8,
        endTime: twoWeeksFromNow,
        tiers: [
          { minParticipants: 0, maxParticipants: 8, discount: 8 },
          { minParticipants: 9, maxParticipants: 15, discount: 10 },
          { minParticipants: 16, maxParticipants: 20, discount: 12 }
        ],
        specs: [
          { label: "חדרים", value: "6" },
          { label: "שטח", value: "200 מ\"ר" },
          { label: "סוג", value: "פנטהאוז" },
          { label: "מרפסת גג", value: "80 מ\"ר" },
          { label: "חניות", value: "3" },
          { label: "נוף", value: "ים" },
        ],
        isActive: "true",
        status: "active",
        platformCommission: 2,
        enableDynamicPricing: "false"
      }
    ];
    
    console.log(`📦 מוסיף ${realEstateDeals.length} דילי נדל\"ן...\n`);
    
    for (const deal of realEstateDeals) {
      const result = await db.insert(deals).values(deal).returning();
      console.log(`   ✅ ${deal.name}`);
      console.log(`      מחיר: ₪${(deal.currentPrice / 100).toLocaleString()}`);
      console.log(`      חדרים: ${deal.specs.find(s => s.label === 'חדרים')?.value || 'N/A'}`);
    }
    
    // בדיקה כמה דילי נדל"ן יש עכשיו
    const allDeals = await db.select().from(deals);
    const apartmentDeals = allDeals.filter(d => d.category === 'apartments' && d.status === 'active');
    
    console.log("\n" + "─".repeat(60));
    console.log(`✅ הוספה הושלמה! כעת יש ${apartmentDeals.length} דילי נדל\"ן פעילים באתר.`);
    
  } catch (error) {
    console.error("❌ שגיאה:", error);
  }
  
  process.exit(0);
}

addRealEstateDeals();
