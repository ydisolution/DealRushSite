import "dotenv/config";
import { db } from "../server/db";
import { orders, deals } from "../shared/schema";

async function checkOrders() {
  try {
    console.log("🔍 Checking orders in database...\n");
    
    const allOrders = await db.select().from(orders);
    console.log(`📊 Total orders in DB: ${allOrders.length}`);
    
    if (allOrders.length > 0) {
      console.log("\n📋 Sample order:");
      console.log(JSON.stringify(allOrders[0], null, 2));
      
      // Group by status
      const byStatus = allOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("\n📈 Orders by status:");
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      // Check supplier IDs
      const supplierIds = [...new Set(allOrders.map(o => o.supplierId))];
      console.log("\n👥 Unique supplier IDs:");
      supplierIds.forEach(id => console.log(`   ${id}`));
    }
    
    const allDeals = await db.select().from(deals);
    console.log(`\n📦 Total deals in DB: ${allDeals.length}`);
    
    const closedDeals = allDeals.filter(d => d.status === 'closed');
    console.log(`   Closed deals: ${closedDeals.length}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  process.exit(0);
}

checkOrders();
