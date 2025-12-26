import { db } from "../server/db";
import { deals, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkSupplier() {
  const [coffeeDeal] = await db
    .select()
    .from(deals)
    .where(eq(deals.name, "מכונת קפה Nespresso"))
    .limit(1);

  if (!coffeeDeal) {
    console.log("❌ Deal not found");
    return;
  }

  console.log("\n☕ מכונת קפה Nespresso");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Deal ID: ${coffeeDeal.id}`);
  console.log(`Supplier ID: ${coffeeDeal.supplierId || "אין ספק"}`);

  if (coffeeDeal.supplierId) {
    const [supplier] = await db
      .select()
      .from(users)
      .where(eq(users.id, coffeeDeal.supplierId))
      .limit(1);

    if (supplier) {
      console.log(`\n👤 פרטי ספק:`);
      console.log(`   שם: ${supplier.firstName} ${supplier.lastName}`);
      console.log(`   אימייל: ${supplier.email}`);
      console.log(`   חברה: ${supplier.supplierCompanyName || "לא הוגדר"}`);
      console.log(`   טלפון: ${supplier.phone || "לא הוגדר"}`);
    }
  } else {
    console.log("\n⚠️  אין ספק משויך לעסקה זו");
  }

  console.log();
}

checkSupplier().then(() => process.exit(0));
