import { db } from "../server/db";
import { orders } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Script to add demo data to orders for testing the new CRM features
 * This will update existing orders with priorities, expected dates, etc.
 */

async function addDemoData() {
  console.log("מוסיף נתוני דמו להזמנות קיימות...");

  try {
    // Get all orders
    const allOrders = await db.select().from(orders);
    console.log(`נמצאו ${allOrders.length} הזמנות`);

    // Sample carriers and shipping methods
    const carriers = ["ישראל דואר", "DHL", "FedEx", "UPS", "Chita"];
    const shippingMethods = ["משלוח רגיל", "משלוח אקספרס", "איסוף עצמי", "משלוח מהיר"];
    const priorities = ["low", "normal", "high", "urgent"];

    let updatedCount = 0;

    for (let i = 0; i < allOrders.length; i++) {
      const order = allOrders[i];
      
      // Generate random but realistic data
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const carrier = carriers[Math.floor(Math.random() * carriers.length)];
      const shippingMethod = shippingMethods[Math.floor(Math.random() * shippingMethods.length)];
      
      // Set expected delivery date 3-10 days from creation
      const createdDate = new Date(order.createdAt);
      const daysToAdd = Math.floor(Math.random() * 8) + 3; // 3-10 days
      const expectedDate = new Date(createdDate);
      expectedDate.setDate(expectedDate.getDate() + daysToAdd);
      
      // Some orders need coordination (20% chance)
      const needsCoordination = Math.random() < 0.2 ? "true" : "false";
      
      // Internal notes for some orders
      const internalNotes = needsCoordination 
        ? "לקוח ביקש לתאם זמן מדויק למשלוח. נשלח SMS לפני יום."
        : null;

      const updates: any = {
        priority,
        carrier,
        shippingMethod,
        expectedDeliveryDate: expectedDate,
        coordinationRequired: needsCoordination,
        internalNotes,
      };

      // If order needs coordination and is still pending, change status
      if (needsCoordination === "true" && order.status === "pending") {
        updates.status = "needs_coordination";
      }

      await db
        .update(orders)
        .set(updates)
        .where(eq(orders.id, order.id));
      
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        console.log(`עודכנו ${updatedCount} הזמנות...`);
      }
    }

    console.log(`✅ ${updatedCount} הזמנות עודכנו עם נתוני דמו!`);
    
    // Show statistics
    const stats = {
      urgent: allOrders.filter((_, i) => priorities[i % priorities.length] === 'urgent').length,
      needsCoordination: allOrders.filter(() => Math.random() < 0.2).length,
      total: allOrders.length
    };
    
    console.log("\nסטטיסטיקות:");
    console.log(`- סה"כ הזמנות: ${stats.total}`);
    console.log(`- הזמנות דחופות: ~${Math.floor(stats.total / 4)}`);
    console.log(`- טעונות תיאום: ~${Math.floor(stats.total / 5)}`);
    
  } catch (error) {
    console.error("❌ שגיאה:", error);
    throw error;
  }
}

// Run
addDemoData()
  .then(() => {
    console.log("\n🎉 סיום!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("נכשל:", error);
    process.exit(1);
  });
