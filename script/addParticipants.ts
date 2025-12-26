/**
 * Script to add demo participants to the coffee machine deal
 * מוסיף משתתפים לדוגמה למכונת הקפה
 */

import { db } from "../server/db";
import { deals, participants, users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { calculateDynamicPrice, getCurrentTier } from "../server/dynamicPricing";

const participantNames = [
  "מוטי דהן",
  "מיכל בראון", 
  "שי דוידוב",
  "אנה אברמוב"
];

async function addParticipantsToCoffeeDeal() {
  console.log("☕ Adding participants to coffee machine deal...\n");

  // מצא את מכונת הקפה
  const [coffeeDeal] = await db
    .select()
    .from(deals)
    .where(eq(deals.name, "מכונת קפה Nespresso"))
    .limit(1);

  if (!coffeeDeal) {
    console.error("❌ Coffee machine deal not found!");
    return;
  }

  console.log(`✅ Found deal: ${coffeeDeal.name} (ID: ${coffeeDeal.id})\n`);

  // בדוק משתתפים קיימים
  const existingParticipants = await db
    .select()
    .from(participants)
    .where(eq(participants.dealId, coffeeDeal.id));

  console.log(`📊 Current participants: ${existingParticipants.length}\n`);

  // צור משתמש דמה אם אין
  let [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "demo@dealrush.com"))
    .limit(1);

  if (!demoUser) {
    console.log("Creating demo user...");
    [demoUser] = await db
      .insert(users)
      .values({
        email: "demo@dealrush.com",
        firstName: "Demo",
        lastName: "User",
        phone: "050-1234567",
        passwordHash: "demo",
        isAdmin: "false",
        isSupplier: "false",
      })
      .returning();
  }

  // הוסף משתתפים
  const addedParticipants = [];
  for (let i = 0; i < participantNames.length; i++) {
    const position = existingParticipants.length + i + 1;
    const totalAtThisPoint = existingParticipants.length + i + 1;

    // חשב מחיר דינמי
    const currentTier = getCurrentTier(coffeeDeal.tiers as any, totalAtThisPoint);
    const priceCalc = calculateDynamicPrice(
      coffeeDeal.originalPrice,
      position,
      totalAtThisPoint,
      currentTier,
      coffeeDeal.priceDeltaPercentage || 4
    );

    console.log(`Adding participant #${position}: ${participantNames[i]}`);
    console.log(`  Price: ₪${priceCalc.dynamicPrice.toLocaleString()} (position discount: ${priceCalc.positionDiscount > 0 ? '+' : ''}${priceCalc.positionDiscount.toFixed(2)}%)`);

    const [participant] = await db
      .insert(participants)
      .values({
        dealId: coffeeDeal.id,
        name: participantNames[i],
        userId: demoUser.id,
        email: "demo@dealrush.com",
        phone: "050-1234567",
        pricePaid: priceCalc.dynamicPrice,
        initialPrice: priceCalc.dynamicPrice,
        position: position,
        paymentStatus: "card_validated",
        stripePaymentMethodId: "pm_demo_123",
        tierAtJoin: 0,
        cardLast4: "4242",
        cardBrand: "Visa",
      })
      .returning();

    addedParticipants.push(participant);
  }

  console.log(`\n✅ Added ${addedParticipants.length} participants successfully!`);

  // עדכן את הדיל
  const newParticipantCount = existingParticipants.length + addedParticipants.length;
  const currentTier = getCurrentTier(coffeeDeal.tiers as any, newParticipantCount);
  const newPrice = currentTier?.price || Math.round(coffeeDeal.originalPrice * (1 - (currentTier?.discount || 0) / 100));

  await db
    .update(deals)
    .set({
      participants: newParticipantCount,
      currentPrice: newPrice,
    })
    .where(eq(deals.id, coffeeDeal.id));

  console.log(`\n📊 Deal updated:`);
  console.log(`   Total participants: ${newParticipantCount}`);
  console.log(`   Current price: ₪${newPrice.toLocaleString()}`);
  console.log(`   Current tier: ${currentTier?.discount}% discount\n`);
}

addParticipantsToCoffeeDeal()
  .then(() => {
    console.log("✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
