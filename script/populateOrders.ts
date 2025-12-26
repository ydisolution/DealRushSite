import { db } from "../server/db";
import { deals, participants, orders, fulfillmentEvents } from "../shared/schema";
import { eq } from "drizzle-orm";

// Israeli cities for realistic addresses
const israeliCities = [
  "תל אביב", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה",
  "אשדוד", "נתניה", "באר שבע", "בני ברק", "חולון",
  "רמת גן", "בת ים", "הרצלייה", "כפר סבא", "מודיעין",
  "רעננה", "רחובות", "קריית אתא", "נהריה", "גבעתיים"
];

const streetNames = [
  "הרצל", "בן גוריון", "ויצמן", "רוטשילד", "דיזנגוף",
  "ירושלים", "הנשיא", "ז'בוטינסקי", "ביאליק", "אחד העם",
  "המלך דוד", "הנביאים", "רמב\"ם", "הרב קוק", "שד' שאול המלך",
  "וייצמן", "אבא הלל", "הירקון", "ארלוזורוב", "נורדאו"
];

const firstNames = [
  "דוד", "משה", "יוסף", "אברהם", "שרה", "רחל", "מרים", "דינה",
  "יעקב", "שמואל", "נועה", "תמר", "אורי", "רון", "ליאור", "יעל",
  "עמית", "טל", "גל", "רועי", "מיכל", "שירה", "אלון", "דנה"
];

const lastNames = [
  "כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אוחיון", "דהן", "אברהם",
  "שלום", "עזרא", "חדד", "בן דוד", "אלוש", "מלכה", "ששון", "מימון",
  "ברוך", "טולדנו", "גבאי", "נחום"
];

function generatePhoneNumber(): string {
  const prefix = ["050", "052", "053", "054", "055", "058"];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
  return `${randomPrefix}-${randomNumber}`;
}

function generateAddress(): { street: string; city: string; zip: string } {
  const street = streetNames[Math.floor(Math.random() * streetNames.length)];
  const number = Math.floor(1 + Math.random() * 200);
  const apartment = Math.random() > 0.5 ? ` דירה ${Math.floor(1 + Math.random() * 20)}` : '';
  const city = israeliCities[Math.floor(Math.random() * israeliCities.length)];
  const zip = String(Math.floor(10000 + Math.random() * 90000));
  
  return {
    street: `${street} ${number}${apartment}`,
    city,
    zip
  };
}

function generateFullName(): string {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function getRandomScheduledDate(): Date {
  // Generate dates between 1-14 days from now
  const daysFromNow = Math.floor(1 + Math.random() * 14);
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

async function populateOrders() {
  console.log('🚀 Starting to populate orders from completed deals...\n');
  
  // Get all completed deals
  const completedDeals = await db.select().from(deals).where(eq(deals.status, 'completed'));
  console.log(`Found ${completedDeals.length} completed deals\n`);
  
  let totalOrdersCreated = 0;
  
  for (const deal of completedDeals) {
    console.log(`📦 Processing: ${deal.name}`);
    
    // Get all charged participants for this deal
    const dealParticipants = await db.select().from(participants).where(eq(participants.dealId, deal.id));
    const chargedParticipants = dealParticipants.filter(p => p.paymentStatus === 'charged');
    
    console.log(`   Found ${chargedParticipants.length} charged participants`);
    
    for (const participant of chargedParticipants) {
      const address = generateAddress();
      const fullName = generateFullName();
      const scheduledDate = getRandomScheduledDate();
      
      // Create order
      const [order] = await db.insert(orders).values({
        participantId: participant.id,
        dealId: deal.id,
        supplierId: deal.supplierId,
        customerName: fullName,
        customerEmail: participant.email,
        customerPhone: generatePhoneNumber(),
        shippingAddress: address.street,
        shippingCity: address.city,
        shippingZip: address.zip,
        status: 'pending',
        scheduledDeliveryDate: scheduledDate,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Create initial fulfillment event
      await db.insert(fulfillmentEvents).values({
        orderId: order.id,
        type: 'purchase_received',
        message: `הזמנה נוצרה עבור ${deal.name}`,
        createdAt: new Date(),
        createdBySupplierId: deal.supplierId
      });
      
      totalOrdersCreated++;
    }
    
    console.log(`   ✅ Created ${chargedParticipants.length} orders\n`);
  }
  
  console.log(`\n✨ Successfully created ${totalOrdersCreated} orders!`);
  console.log('\n📊 Summary by status:');
  
  const allOrders = await db.select().from(orders);
  const statusCounts = {
    pending: allOrders.filter(o => o.status === 'pending').length,
    verified: allOrders.filter(o => o.status === 'verified').length,
    scheduled: allOrders.filter(o => o.status === 'scheduled').length,
    out_for_delivery: allOrders.filter(o => o.status === 'out_for_delivery').length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
  };
  
  console.log(`   Pending: ${statusCounts.pending}`);
  console.log(`   Verified: ${statusCounts.verified}`);
  console.log(`   Scheduled: ${statusCounts.scheduled}`);
  console.log(`   Out for Delivery: ${statusCounts.out_for_delivery}`);
  console.log(`   Delivered: ${statusCounts.delivered}`);
  
  console.log('\n🎉 Done! You can now view orders at:');
  console.log('   Supplier: http://localhost:5000/supplier/orders');
  console.log('   Customer: http://localhost:5000/my-orders');
}

populateOrders()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
