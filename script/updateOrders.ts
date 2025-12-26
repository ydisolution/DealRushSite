import { db } from "../server/db";
import { orders } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateExistingOrders() {
  console.log("מעדכן הזמנות קיימות עם שדות ברירת מחדל...");

  try {
    // Get all orders
    const allOrders = await db.select().from(orders);
    console.log(`נמצאו ${allOrders.length} הזמנות`);

    // Update each order with default values for new fields
    for (const order of allOrders) {
      const updates: any = {};
      
      // Set default priority if missing
      if (!order.priority) {
        updates.priority = 'normal';
      }

      // Set coordinationRequired default
      if (!order.coordinationRequired) {
        updates.coordinationRequired = 'false';
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await db
          .update(orders)
          .set(updates)
          .where(eq(orders.id, order.id));
        
        console.log(`עודכנה הזמנה ${order.id.slice(0, 8)}`);
      }
    }

    console.log("✅ כל ההזמנות עודכנו בהצלחה!");
  } catch (error) {
    console.error("❌ שגיאה בעדכון הזמנות:", error);
    throw error;
  }
}

// Run
updateExistingOrders()
  .then(() => {
    console.log("סיים!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("נכשל:", error);
    process.exit(1);
  });
