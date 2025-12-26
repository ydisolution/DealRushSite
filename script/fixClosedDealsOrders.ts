import { db } from "../server/db";
import { deals, participants, orders, fulfillmentEvents } from "../shared/schema";
import { eq } from "drizzle-orm";

// Find closed deals without orders and create them
async function fixClosedDeals() {
  console.log("🔍 Checking for closed deals without orders...");
  
  // Find closed deals
  const closedDeals = await db.select()
    .from(deals)
    .where(eq(deals.status, "closed"));
  
  console.log(`Found ${closedDeals.length} closed deals`);
  
  for (const deal of closedDeals) {
    // Check if orders exist
    const existingOrders = await db.select()
      .from(orders)
      .where(eq(orders.dealId, deal.id));
    
    if (existingOrders.length > 0) {
      console.log(`✅ ${deal.name}: ${existingOrders.length} orders exist`);
      continue;
    }
    
    console.log(`\n⚠️  ${deal.name} (${deal.id}): NO ORDERS FOUND!`);
    
    // Get participants
    const dealParticipants = await db.select()
      .from(participants)
      .where(eq(participants.dealId, deal.id));
    
    console.log(`   Total participants: ${dealParticipants.length}`);
    
    const chargedParticipants = dealParticipants.filter(p => p.paymentStatus === 'charged');
    console.log(`   Charged participants: ${chargedParticipants.length}`);
    
    if (chargedParticipants.length === 0) {
      console.log(`   ⚠️  No charged participants - skipping`);
      continue;
    }
    
    // Create orders
    let ordersCreated = 0;
    for (const participant of chargedParticipants) {
      try {
        const [order] = await db.insert(orders)
          .values({
            participantId: participant.id,
            dealId: deal.id,
            supplierId: deal.supplierId || '',
            customerName: participant.name,
            customerEmail: participant.email || null,
            customerPhone: participant.phone || null,
            shippingAddress: participant.shippingAddress || null,
            shippingCity: participant.shippingCity || null,
            shippingZip: participant.shippingZipCode || null,
            notesFromCustomer: null,
            status: 'pending',
            supplierNotes: null,
            scheduledDeliveryDate: null,
            outForDeliveryDate: null,
            deliveredDate: null,
            trackingNumber: null,
            carrier: null,
            shippingMethod: null,
          })
          .returning();
        
        // Create initial fulfillment event
        await db.insert(fulfillmentEvents)
          .values({
            orderId: order.id,
            type: 'purchase_received',
            message: `הזמנה נקלטה במערכת - ${participant.quantity || 1} יחידות (נוצר ידנית)`,
            createdBySupplierId: deal.supplierId || null,
          });
        
        ordersCreated++;
      } catch (error) {
        console.error(`   ❌ Failed to create order for ${participant.name}:`, error);
      }
    }
    
    console.log(`   ✅ Created ${ordersCreated} orders`);
  }
  
  console.log("\n✅ Done!");
  process.exit(0);
}

fixClosedDeals().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
