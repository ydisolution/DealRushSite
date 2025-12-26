import "dotenv/config";
import { db } from "../server/db";
import { orders, users, deals } from "../shared/schema";
import { eq } from "drizzle-orm";

async function diagnose() {
  console.log("🔍 DIAGNOSIS - Order Management System\n");
  console.log("=" .repeat(60));
  
  try {
    // 1. Check orders in DB
    const allOrders = await db.select().from(orders);
    console.log(`\n1️⃣ ORDERS IN DATABASE: ${allOrders.length}`);
    
    if (allOrders.length === 0) {
      console.log("   ❌ NO ORDERS FOUND! Running seeder...");
      return;
    }
    
    // 2. Group by supplier
    const bySupplier = allOrders.reduce((acc, order) => {
      acc[order.supplierId] = (acc[order.supplierId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n2️⃣ ORDERS BY SUPPLIER ID:`);
    for (const [supplierId, count] of Object.entries(bySupplier)) {
      const [supplier] = await db.select().from(users).where(eq(users.id, supplierId)).limit(1);
      console.log(`   ${supplierId.slice(0, 8)}... → ${count} orders (${supplier?.email || 'UNKNOWN'})`);
    }
    
    // 3. Check dreamer@dealrush.co.il supplier
    const [dreamerSupplier] = await db.select().from(users).where(eq(users.email, "dreamer@dealrush.co.il")).limit(1);
    
    if (!dreamerSupplier) {
      console.log(`\n3️⃣ ❌ Supplier 'dreamer@dealrush.co.il' NOT FOUND!`);
      return;
    }
    
    console.log(`\n3️⃣ DREAMER SUPPLIER:`);
    console.log(`   ID: ${dreamerSupplier.id}`);
    console.log(`   Email: ${dreamerSupplier.email}`);
    console.log(`   Is Supplier: ${dreamerSupplier.isSupplier}`);
    
    const dreamerOrders = allOrders.filter(o => o.supplierId === dreamerSupplier.id);
    console.log(`   Orders: ${dreamerOrders.length}`);
    
    // 4. Check deals
    const allDeals = await db.select().from(deals);
    const dreamerDeals = allDeals.filter(d => d.supplierId === dreamerSupplier.id);
    const closedDeals = dreamerDeals.filter(d => d.status === 'closed');
    
    console.log(`\n4️⃣ DEALS:`);
    console.log(`   Total deals: ${allDeals.length}`);
    console.log(`   Dreamer deals: ${dreamerDeals.length}`);
    console.log(`   Closed deals: ${closedDeals.length}`);
    
    if (closedDeals.length > 0) {
      console.log(`\n   Closed deals list:`);
      closedDeals.forEach(d => {
        const dealOrders = allOrders.filter(o => o.dealId === d.id);
        console.log(`   - ${d.name} (${d.id.slice(0, 8)}...) → ${dealOrders.length} orders`);
      });
    }
    
    // 5. Sample order
    if (dreamerOrders.length > 0) {
      console.log(`\n5️⃣ SAMPLE ORDER:`);
      const sample = dreamerOrders[0];
      console.log(JSON.stringify({
        id: sample.id.slice(0, 15) + "...",
        customerName: sample.customerName,
        status: sample.status,
        supplierId: sample.supplierId.slice(0, 15) + "...",
        dealId: sample.dealId.slice(0, 15) + "...",
      }, null, 2));
    }
    
    // 6. Check if there's a mismatch
    console.log(`\n6️⃣ POTENTIAL ISSUES:`);
    const otherSuppliers = Object.keys(bySupplier).filter(id => id !== dreamerSupplier.id);
    if (otherSuppliers.length > 0 && dreamerOrders.length === 0) {
      console.log(`   ⚠️  WARNING: Orders exist for OTHER suppliers but not for dreamer@dealrush.co.il`);
      console.log(`   ⚠️  This suggests the seeder used a different supplier ID!`);
    }
    
    if (dreamerOrders.length === 0) {
      console.log(`   ❌ NO ORDERS for dreamer@dealrush.co.il`);
      console.log(`   💡 Solution: Re-run seeder with correct supplier ID`);
    } else {
      console.log(`   ✅ Orders exist for dreamer@dealrush.co.il`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  process.exit(0);
}

diagnose();
