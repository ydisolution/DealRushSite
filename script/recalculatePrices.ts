/**
 * Script to recalculate all participant prices based on dynamic pricing
 * משמש לעדכן את כל המשתתפים הקיימים עם המחירים החדשים (אחרי תיקון הנוסחה)
 */

import { db } from "../server/db";
import { deals, participants } from "../shared/schema";
import { eq } from "drizzle-orm";
import { calculateDynamicPrice, getCurrentTier } from "../server/dynamicPricing";

async function recalculateAllPrices() {
  console.log("🔄 Starting price recalculation for all participants...\n");

  // שלוף את כל העסקאות הפעילות
  const activeDeals = await db
    .select()
    .from(deals)
    .where(eq(deals.isActive, "true"));

  console.log(`📊 Found ${activeDeals.length} active deals\n`);

  for (const deal of activeDeals) {
    console.log(`\n🎯 Processing deal: ${deal.name} (ID: ${deal.id})`);

    // שלוף את כל המשתתפים בדיל הזה
    const dealParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.dealId, deal.id))
      .orderBy(participants.position);

    if (dealParticipants.length === 0) {
      console.log("   ⚠️  No participants found, skipping...");
      continue;
    }

    console.log(`   👥 Found ${dealParticipants.length} participants`);

    // חישוב מדרגה נוכחית
    const currentTier = getCurrentTier(deal.tiers as any, dealParticipants.length);
    
    if (!currentTier) {
      console.log("   ⚠️  No tier found, skipping...");
      continue;
    }

    console.log(`   📈 Current tier: ${currentTier.discount}% discount (${currentTier.minParticipants}-${currentTier.maxParticipants} participants)`);

    // עדכון כל משתתף
    let updatedCount = 0;
    for (const participant of dealParticipants) {
      const newPriceCalc = calculateDynamicPrice(
        deal.originalPrice,
        participant.position,
        dealParticipants.length,
        currentTier,
        deal.priceDeltaPercentage || 4
      );

      const oldPrice = participant.pricePaid;
      const newPrice = newPriceCalc.dynamicPrice;

      // עדכן רק אם המחיר השתנה
      if (oldPrice !== newPrice) {
        await db
          .update(participants)
          .set({
            pricePaid: newPrice,
            initialPrice: newPrice, // גם מעדכן את initialPrice
          })
          .where(eq(participants.id, participant.id));

        console.log(
          `   ✅ Position #${participant.position}: ₪${oldPrice.toLocaleString()} → ₪${newPrice.toLocaleString()} (${newPriceCalc.positionDiscount > 0 ? '+' : ''}${newPriceCalc.positionDiscount.toFixed(2)}%)`
        );
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      console.log("   ℹ️  All prices already up to date");
    } else {
      console.log(`   ✨ Updated ${updatedCount} participants`);
    }
  }

  console.log("\n✅ Price recalculation completed!\n");
}

// הרץ את הסקריפט
recalculateAllPrices()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error during recalculation:", error);
    process.exit(1);
  });
