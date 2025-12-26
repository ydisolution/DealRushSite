import "dotenv/config";
import { db } from "../server/db";
import { deals } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function organizeProducts() {
  console.log("🔧 ארגון מוצרים באתר\n");
  
  try {
    // שלב 1: קבלת כל המוצרים
    const allDeals = await db.select().from(deals);
    console.log(`📦 סה"כ מוצרים: ${allDeals.length}\n`);
    
    if (allDeals.length === 0) {
      console.log("⚠️ לא נמצאו מוצרים במערכת!");
      return;
    }
    
    // שלב 2: הצגת המוצרים לפי קטגוריות
    const categories = new Map<string, typeof allDeals>();
    
    for (const deal of allDeals) {
      const category = deal.category || "ללא קטגוריה";
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(deal);
    }
    
    console.log("📊 מוצרים לפי קטגוריות:\n");
    
    for (const [category, categoryDeals] of categories) {
      console.log(`\n📁 ${category} (${categoryDeals.length} מוצרים):`);
      console.log("─".repeat(60));
      
      for (const deal of categoryDeals) {
        console.log(`
  🏷️  ${deal.name}
      ID: ${deal.id.slice(0, 8)}...
      סטטוס: ${deal.status}
      מחיר נוכחי: ₪${(deal.currentPrice / 100).toFixed(2)}
      מחיר מקורי: ₪${(deal.originalPrice / 100).toFixed(2)}
      משתתפים: ${deal.participants}/${deal.targetParticipants}
      פעיל: ${deal.isActive === "true" ? "✅" : "❌"}
      תאריך סיום: ${deal.endTime ? new Date(deal.endTime).toLocaleDateString('he-IL') : 'לא מוגדר'}
      תמונות: ${deal.images?.length || 0}
      מדרגות מחיר: ${Array.isArray(deal.tiers) ? deal.tiers.length : 0}
        `);
      }
    }
    
    // שלב 3: בדיקת בעיות נפוצות
    console.log("\n\n🔍 בדיקת בעיות:\n");
    console.log("─".repeat(60));
    
    let issuesFound = 0;
    
    // בדיקה 1: מוצרים ללא תמונות
    const dealsWithoutImages = allDeals.filter(d => !d.images || d.images.length === 0);
    if (dealsWithoutImages.length > 0) {
      console.log(`\n⚠️  מוצרים ללא תמונות (${dealsWithoutImages.length}):`);
      dealsWithoutImages.forEach(d => console.log(`   - ${d.name} (${d.id.slice(0, 8)}...)`));
      issuesFound += dealsWithoutImages.length;
    }
    
    // בדיקה 2: מוצרים ללא מדרגות מחיר
    const dealsWithoutTiers = allDeals.filter(d => !d.tiers || (Array.isArray(d.tiers) && d.tiers.length === 0));
    if (dealsWithoutTiers.length > 0) {
      console.log(`\n⚠️  מוצרים ללא מדרגות מחיר (${dealsWithoutTiers.length}):`);
      dealsWithoutTiers.forEach(d => console.log(`   - ${d.name} (${d.id.slice(0, 8)}...)`));
      issuesFound += dealsWithoutTiers.length;
    }
    
    // בדיקה 3: מוצרים עם סטטוס לא תקין
    const invalidStatusDeals = allDeals.filter(d => !d.status || !['draft', 'pending', 'approved', 'active', 'live', 'closed', 'cancelled'].includes(d.status));
    if (invalidStatusDeals.length > 0) {
      console.log(`\n⚠️  מוצרים עם סטטוס לא תקין (${invalidStatusDeals.length}):`);
      invalidStatusDeals.forEach(d => console.log(`   - ${d.name}: "${d.status}" (${d.id.slice(0, 8)}...)`));
      issuesFound += invalidStatusDeals.length;
    }
    
    // בדיקה 4: מוצרים פעילים שתאריך הסיום שלהם עבר
    const now = new Date();
    const expiredActiveDeals = allDeals.filter(d => 
      d.isActive === "true" && 
      d.status === "active" && 
      d.endTime && 
      new Date(d.endTime) < now
    );
    if (expiredActiveDeals.length > 0) {
      console.log(`\n⚠️  מוצרים פעילים שתאריך הסיום שלהם עבר (${expiredActiveDeals.length}):`);
      expiredActiveDeals.forEach(d => console.log(`   - ${d.name} (סיום: ${new Date(d.endTime!).toLocaleDateString('he-IL')})`));
      issuesFound += expiredActiveDeals.length;
    }
    
    // בדיקה 5: מוצרים ללא קטגוריה תקינה
    const validCategories = ['apartments', 'electrical', 'furniture', 'electronics', 'home', 'fashion'];
    const invalidCategoryDeals = allDeals.filter(d => !d.category || !validCategories.includes(d.category));
    if (invalidCategoryDeals.length > 0) {
      console.log(`\n⚠️  מוצרים עם קטגוריה לא תקינה (${invalidCategoryDeals.length}):`);
      invalidCategoryDeals.forEach(d => console.log(`   - ${d.name}: "${d.category}" (${d.id.slice(0, 8)}...)`));
      issuesFound += invalidCategoryDeals.length;
    }
    
    // בדיקה 6: מוצרים עם מחירים לא תקינים
    const invalidPriceDeals = allDeals.filter(d => 
      !d.currentPrice || 
      !d.originalPrice || 
      d.currentPrice <= 0 || 
      d.originalPrice <= 0 ||
      d.currentPrice > d.originalPrice
    );
    if (invalidPriceDeals.length > 0) {
      console.log(`\n⚠️  מוצרים עם מחירים לא תקינים (${invalidPriceDeals.length}):`);
      invalidPriceDeals.forEach(d => console.log(`   - ${d.name}: נוכחי=₪${(d.currentPrice / 100).toFixed(2)}, מקורי=₪${(d.originalPrice / 100).toFixed(2)}`));
      issuesFound += invalidPriceDeals.length;
    }
    
    console.log("\n\n" + "─".repeat(60));
    if (issuesFound === 0) {
      console.log("✅ לא נמצאו בעיות! כל המוצרים מאורגנים כראוי.");
    } else {
      console.log(`⚠️  נמצאו ${issuesFound} בעיות שדורשות תיקון.`);
      console.log("\n💡 האם תרצה שאתקן את הבעיות? (הרץ את הסקריפט עם --fix)");
    }
    
  } catch (error) {
    console.error("❌ שגיאה:", error);
  }
  
  process.exit(0);
}

organizeProducts();
