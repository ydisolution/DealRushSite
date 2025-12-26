import { db } from "../server/db";
import { participants } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkPrices() {
  const coffeeParticipants = await db
    .select()
    .from(participants)
    .where(eq(participants.dealId, "2569f516-c4f1-46f4-846e-41d5ed8b368a"))
    .orderBy(participants.position);

  console.log("\n☕ Current participant prices:\n");
  coffeeParticipants.forEach(p => {
    console.log(`Position #${p.position}: ${p.name.padEnd(20)} ₪${p.pricePaid}`);
  });
  console.log();
}

checkPrices().then(() => process.exit(0));
