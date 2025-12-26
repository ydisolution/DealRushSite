import "dotenv/config";
import { db } from "../server/db";
import { deals } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixProducts() {
  console.log("🔧 מתקן בעיות במוצרים...\n");
  
  try {
    // קבלת כל המוצרים
    const allDeals = await db.select().from(deals);
    console.log(`📦 סה"כ מוצרים: ${allDeals.length}\n`);
    
    let fixedCount = 0;
    
    // תיקון 1: סטטוס לא תקין (completed, partially_failed)
    console.log("🔧 מתקן סטטוסים לא תקינים...");
    const invalidStatusDeals = allDeals.filter(d => 
      d.status && !['draft', 'pending', 'approved', 'active', 'live', 'closed', 'cancelled'].includes(d.status)
    );
    
    for (const deal of invalidStatusDeals) {
      const newStatus = deal.status === 'completed' ? 'closed' : 'closed';
      await db.update(deals)
        .set({ status: newStatus })
        .where(eq(deals.id, deal.id));
      console.log(`   ✅ ${deal.name}: "${deal.status}" → "${newStatus}"`);
      fixedCount++;
    }
    
    // תיקון 2: קטגוריות לא תקינות - מיפוי לקטגוריות תקינות
    console.log("\n🔧 מתקן קטגוריות לא תקינות...");
    const categoryMapping: Record<string, string> = {
      'אלקטרוניקה': 'electronics',
      'בריאות וספא': 'home',
      'sports': 'fashion', // ספורט יכול להיות fashion או home
      'מוצרי חשמל': 'electrical',
      'מטבח ובית': 'home',
      'other': 'home'
    };
    
    const validCategories = ['apartments', 'electrical', 'furniture', 'electronics', 'home', 'fashion'];
    const invalidCategoryDeals = allDeals.filter(d => 
      !d.category || !validCategories.includes(d.category)
    );
    
    for (const deal of invalidCategoryDeals) {
      const newCategory = categoryMapping[deal.category || 'other'] || 'home';
      await db.update(deals)
        .set({ category: newCategory })
        .where(eq(deals.id, deal.id));
      console.log(`   ✅ ${deal.name}: "${deal.category}" → "${newCategory}"`);
      fixedCount++;
    }
    
    // תיקון 3: מוצרים פעילים שפג תוקפם
    console.log("\n🔧 מעדכן מוצרים פעילים שתאריך הסיום שלהם עבר...");
    const now = new Date();
    const expiredActiveDeals = allDeals.filter(d => 
      d.isActive === "true" && 
      d.status === "active" && 
      d.endTime && 
      new Date(d.endTime) < now
    );
    
    for (const deal of expiredActiveDeals) {
      await db.update(deals)
        .set({ 
          isActive: "false",
          status: "closed",
          closedAt: new Date()
        })
        .where(eq(deals.id, deal.id));
      console.log(`   ✅ ${deal.name}: סגור אוטומטית (פג תוקף)`);
      fixedCount++;
    }
    
    // תיקון 4: מוצרים ללא קטגוריה
    console.log("\n🔧 מוסיף קטגוריה ברירת מחדל למוצרים ללא קטגוריה...");
    const noCategoryDeals = allDeals.filter(d => !d.category);
    
    for (const deal of noCategoryDeals) {
      await db.update(deals)
        .set({ category: 'home' })
        .where(eq(deals.id, deal.id));
      console.log(`   ✅ ${deal.name}: הוספה קטגוריה "home"`);
      fixedCount++;
    }
    
    console.log("\n" + "─".repeat(60));
    console.log(`✅ תוקנו ${fixedCount} בעיות במוצרים!`);
    
    // הצגת סיכום סופי
    console.log("\n📊 סיכום סופי:");
    const updatedDeals = await db.select().from(deals);
    
    const statusCounts = updatedDeals.reduce((acc, d) => {
      acc[d.status || 'undefined'] = (acc[d.status || 'undefined'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const categoryCounts = updatedDeals.reduce((acc, d) => {
      acc[d.category || 'undefined'] = (acc[d.category || 'undefined'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("\nסטטוסים:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    console.log("\nקטגוריות:");
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });
    
  } catch (error) {
    console.error("❌ שגיאה:", error);
  }
  
  process.exit(0);
}

fixProducts();
