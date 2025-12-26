import "dotenv/config";
import { db } from "../server/db";
import { orders, deals, participants } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

async function fixDealsMapping() {
  console.log("🔧 FIXING Deals Mapping\n");
  
  try {
    // Get all orders
    const allOrders = await db.select().from(orders);
    console.log(`📦 Total orders: ${allOrders.length}`);
    
    // Get unique deal IDs from orders
    const orderDealIds = [...new Set(allOrders.map(o => o.dealId))];
    console.log(`📋 Unique deal IDs in orders: ${orderDealIds.length}\n`);
    
    // Check each deal
    for (const dealId of orderDealIds) {
      const [deal] = await db.select().from(deals).where(eq(deals.id, dealId)).limit(1);
      
      if (!deal) {
        console.log(`❌ Deal ${dealId.slice(0, 8)}... NOT FOUND in deals table!`);
        
        // Get sample order for this deal
        const sampleOrder = allOrders.find(o => o.dealId === dealId);
        if (sampleOrder) {
          console.log(`   Sample order customer: ${sampleOrder.customerName}`);
          console.log(`   Need to find or create this deal!\n`);
        }
      } else {
        const orderCount = allOrders.filter(o => o.dealId === dealId).length;
        console.log(`✅ ${deal.name} → ${orderCount} orders (status: ${deal.status})`);
      }
    }
    
    // Check for orphaned participants
    console.log(`\n🔍 Checking participants...`);
    const allParticipants = await db.select().from(participants);
    const orderParticipantIds = allOrders.map(o => o.participantId);
    const orphaned = allParticipants.filter(p => !orderParticipantIds.includes(p.id));
    
    console.log(`   Total participants: ${allParticipants.length}`);
    console.log(`   Linked to orders: ${orderParticipantIds.length}`);
    console.log(`   Orphaned: ${orphaned.length}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  process.exit(0);
}

fixDealsMapping();
