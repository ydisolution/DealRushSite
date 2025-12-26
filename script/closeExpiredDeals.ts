import { db } from "../server/db";
import { deals, participants, orders, fulfillmentEvents } from "../shared/schema";
import { eq, and, lt } from "drizzle-orm";

// Close expired deals and create orders manually
async function closeExpiredDeals() {
  console.log("🔍 Checking for expired deals...");
  
  const now = new Date();
  
  // Find active deals that have passed their end time
  const expiredDeals = await db.select()
    .from(deals)
    .where(
      and(
        eq(deals.status, "active"),
        eq(deals.isActive, "true"),
        lt(deals.endTime, now)
      )
    );
  
  console.log(`Found ${expiredDeals.length} expired deals`);
  
  for (const deal of expiredDeals) {
    console.log(`\n📦 Processing deal: ${deal.name} (${deal.id})`);
    console.log(`   End time: ${deal.endTime}`);
    console.log(`   Status: ${deal.status}`);
    
    // Get all participants for this deal
    const dealParticipants = await db.select()
      .from(participants)
      .where(eq(participants.dealId, deal.id));
    
    console.log(`   Participants: ${dealParticipants.length}`);
    
    // Filter valid participants (those who completed payment)
    const validParticipants = dealParticipants.filter(p => 
      p.paymentStatus === 'charged' || 
      p.paymentStatus === 'card_validated' ||
      p.paymentStatus === 'pending_payment'
    );
    
    console.log(`   Valid participants: ${validParticipants.length}`);
    
    if (validParticipants.length === 0) {
      console.log(`   ⚠️  No valid participants - cancelling deal`);
      await db.update(deals)
        .set({ 
          status: 'cancelled',
          isActive: 'false'
        })
        .where(eq(deals.id, deal.id));
      continue;
    }
    
    // Check if orders already exist
    const existingOrders = await db.select()
      .from(orders)
      .where(eq(orders.dealId, deal.id));
    
    if (existingOrders.length > 0) {
      console.log(`   ✅ Orders already exist (${existingOrders.length})`);
      
      // Just update deal status if not already closed
      if (deal.status !== 'closed') {
        await db.update(deals)
          .set({ 
            status: 'closed',
            isActive: 'false',
            closedAt: new Date()
          })
          .where(eq(deals.id, deal.id));
        console.log(`   ✅ Deal status updated to closed`);
      }
      continue;
    }
    
    // Create orders for valid participants
    let ordersCreated = 0;
    for (const participant of validParticipants) {
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
            message: `הזמנה נקלטה במערכת - ${participant.quantity || 1} יחידות`,
            createdBySupplierId: deal.supplierId || null,
          });
        
        ordersCreated++;
        console.log(`   ✅ Created order for ${participant.name}`);
      } catch (error) {
        console.error(`   ❌ Failed to create order for ${participant.name}:`, error);
      }
    }
    
    // Update deal status to closed
    await db.update(deals)
      .set({ 
        status: 'closed',
        isActive: 'false',
        closedAt: new Date()
      })
      .where(eq(deals.id, deal.id));
    
    console.log(`   ✅ Deal closed - created ${ordersCreated} orders`);
  }
  
  console.log("\n✅ Done!");
  process.exit(0);
}

closeExpiredDeals().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
