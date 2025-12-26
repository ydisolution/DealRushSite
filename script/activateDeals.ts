import "dotenv/config";
import { db } from "../server/db";
import { deals } from "../shared/schema";
import { eq } from "drizzle-orm";

async function activateDeals() {
  console.log("🔧 מפעיל מוצרים באתר...\n");
  
  try {
    // קבלת כל המוצרים הסגורים/מבוטלים
    const allDeals = await db.select().from(deals);
    
    // סינון מוצרים מעניינים
    const dealsToActivate = allDeals
      .filter(d => d.status === 'closed' || d.status === 'cancelled')
      .slice(0, 10); // נפעיל 10 מוצרים
    
    console.log(`📦 מפעיל ${dealsToActivate.length} מוצרים...\n`);
    
    // עדכון תאריכי סיום לעוד שבועיים מהיום
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    for (const deal of dealsToActivate) {
      await db.update(deals)
        .set({ 
          status: 'active',
          isActive: 'true',
          endTime: twoWeeksFromNow,
          closedAt: null
        })
        .where(eq(deals.id, deal.id));
      
      console.log(`   ✅ ${deal.name} - פעיל עד ${twoWeeksFromNow.toLocaleDateString('he-IL')}`);
    }
    
    // הצגת סיכום
    const updatedDeals = await db.select().from(deals);
    const activeCount = updatedDeals.filter(d => d.status === 'active').length;
    
    console.log("\n" + "─".repeat(60));
    console.log(`✅ הפעלה הושלמה! כעת יש ${activeCount} מוצרים פעילים באתר.`);
    
    console.log("\n📋 מוצרים פעילים:");
    updatedDeals
      .filter(d => d.status === 'active')
      .forEach(d => {
        console.log(`   • ${d.name} (${d.category})`);
      });
    
  } catch (error) {
    console.error("❌ שגיאה:", error);
  }
  
  process.exit(0);
}

activateDeals();
