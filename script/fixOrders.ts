import "dotenv/config";
import { db } from "../server/db";
import { orders, deals, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixOrders() {
  console.log("🔧 FIXING Orders - Reassigning to correct supplier\n");
  
  try {
    // Get the correct dreamer supplier
    const [dreamerSupplier] = await db.select().from(users).where(eq(users.email, "dreamer@dealrush.co.il")).limit(1);
    
    if (!dreamerSupplier) {
      console.log("❌ Dreamer supplier not found!");
      process.exit(1);
    }
    
    console.log(`✅ Target Supplier: ${dreamerSupplier.email}`);
    console.log(`   ID: ${dreamerSupplier.id}\n`);
    
    // Get all orders
    const allOrders = await db.select().from(orders);
    console.log(`📦 Total orders in DB: ${allOrders.length}`);
    
    // Find orders with wrong supplier ID
    const wrongOrders = allOrders.filter(o => o.supplierId !== dreamerSupplier.id);
    console.log(`⚠️  Orders with wrong supplier: ${wrongOrders.length}\n`);
    
    if (wrongOrders.length === 0) {
      console.log("✅ All orders already have correct supplier ID!");
      process.exit(0);
    }
    
    // Update all orders to correct supplier
    console.log("🔄 Updating orders...");
    let updated = 0;
    
    for (const order of wrongOrders) {
      await db.update(orders)
        .set({ supplierId: dreamerSupplier.id })
        .where(eq(orders.id, order.id));
      updated++;
      
      if (updated % 10 === 0) {
        process.stdout.write(`   Updated ${updated}/${wrongOrders.length}...\r`);
      }
    }
    
    console.log(`\n✅ Updated ${updated} orders!\n`);
    
    // Also update deals
    const allDeals = await db.select().from(deals);
    const closedDeals = allDeals.filter(d => d.status === 'closed' && d.supplierId !== dreamerSupplier.id);
    
    if (closedDeals.length > 0) {
      console.log(`🔄 Updating ${closedDeals.length} closed deals...`);
      for (const deal of closedDeals) {
        await db.update(deals)
          .set({ 
            supplierId: dreamerSupplier.id,
            supplierName: "Dreamer Supplies" 
          })
          .where(eq(deals.id, deal.id));
      }
      console.log(`✅ Updated ${closedDeals.length} deals!\n`);
    }
    
    // Verify
    const verifyOrders = await db.select().from(orders);
    const correctOrders = verifyOrders.filter(o => o.supplierId === dreamerSupplier.id);
    
    console.log("📊 VERIFICATION:");
    console.log(`   Total orders: ${verifyOrders.length}`);
    console.log(`   Orders for dreamer@dealrush.co.il: ${correctOrders.length}`);
    console.log(`   ✅ ${correctOrders.length === verifyOrders.length ? 'ALL CORRECT!' : 'STILL ISSUES'}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  process.exit(0);
}

fixOrders();
