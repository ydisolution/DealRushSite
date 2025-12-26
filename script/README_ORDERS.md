# 📦 Order Management Seeding Guide

## Overview

The `seedOrders.ts` script generates realistic, high-quality simulated order data for the DealRush Order Management system.

## What It Creates

### 🎯 5 Closed Deals
1. **iPhone 15 Pro - דיל קבוצתי** (18 orders)
2. **מארז ספא זוגי - ים המלח** (24 orders)  
3. **רובוט שואב ושוטף Dreametech** (15 orders)
4. **סט כלי מטבח פרימיום 24 חלקים** (22 orders)
5. **אוזניות Sony WH-1000XM5** (20 orders)

**Total: ~99 orders**

### 📊 Order Statuses Distribution
- ✅ **delivered** - Majority of older orders
- 🚚 **out_for_delivery** - Currently in transit
- 📅 **scheduled** - Delivery scheduled
- ✔️ **verified** - Confirmed by supplier
- ⏳ **pending** - Awaiting verification
- ❌ **cancelled** - Cancelled orders

### 👥 Realistic Data Includes

**Customer Information:**
- Israeli names (נועם כהן, מיכל לוי, etc.)
- Israeli phone numbers (050/052/053/054-XXXXXXX)
- Email addresses
- Full shipping addresses across 15 Israeli cities
- Optional customer notes

**Fulfillment Details:**
- Tracking numbers (IL/DR/HFD-XXXXXXXXX)
- Carriers (DHL, חברת הדואר, חלוצי המשלוחים, etc.)
- Shipping methods
- Scheduled/delivery/shipped dates
- Supplier notes
- Complete timeline of 2-6 events per order

## 🚀 How to Run

### Prerequisites
Make sure your database is set up and migrations are applied:

```bash
npm run db:push
```

### Run the Seeder

```bash
npm run db:seed:orders
```

### Expected Output

```
🚚 Starting order seeding...
🗑️  Clearing existing orders and events...
📦 Creating closed deals...
✅ Created deal: iPhone 15 Pro - דיל קבוצתי
✅ Created deal: מארז ספא זוגי - ים המלח
...
📋 Creating orders...
✅ Created 18 orders for deal: iPhone 15 Pro - דיל קבוצתי
...

✨ Order seeding completed!
📊 Summary:
   - Deals created: 5
   - Total orders: 99
   - Average orders per deal: 20

📈 Order Status Breakdown:
   - delivered: 52 (53%)
   - out_for_delivery: 18 (18%)
   - scheduled: 12 (12%)
   - verified: 10 (10%)
   - pending: 5 (5%)
   - cancelled: 2 (2%)

✅ Done!
```

## 📁 Data Structure

Each order includes:

```typescript
{
  id: "uuid",
  dealId: "uuid",
  participantId: "uuid",
  supplierId: "uuid",
  
  // Customer
  customerName: "נועם כהן",
  customerEmail: "noam.cohen@gmail.com",
  customerPhone: "050-1234567",
  shippingAddress: "הרצל 42",
  shippingCity: "תל אביב",
  shippingZip: "61000",
  notesFromCustomer: "בבקשה להתקשר לפני הגעה",
  
  // Fulfillment
  status: "out_for_delivery",
  scheduledDeliveryDate: Date,
  outForDeliveryDate: Date,
  deliveredDate: Date | null,
  trackingNumber: "IL123456789",
  carrier: "DHL",
  shippingMethod: "משלוח אקספרס",
  supplierNotes: "חבילה יצאה עם שליח",
  
  // Timeline (in fulfillment_events table)
  events: [
    { type: "purchase_received", message: "...", createdAt: Date },
    { type: "verified", message: "...", createdAt: Date },
    { type: "delivery_scheduled", message: "...", createdAt: Date },
    { type: "shipped", message: "...", createdAt: Date },
  ]
}
```

## 🎨 Customization

To modify the dataset, edit `script/seedOrders.ts`:

- **Change number of deals:** Modify `closedDeals` array
- **Adjust orders per deal:** Change `participants` in each deal template
- **Modify status distribution:** Edit the status selection logic
- **Add more cities/names:** Expand the data arrays at top of file
- **Change date ranges:** Modify `sixMonthsAgo` variable

## 🔗 Integration

After seeding, the orders will be available in:

### Supplier Interface
- **URL:** `/supplier/orders`
- View all orders
- Filter by status/deal
- Update order status
- Add tracking numbers
- Schedule deliveries
- Mark as shipped/delivered

### Customer Interface  
- **URL:** `/dashboard` (Orders tab)
- View personal orders
- See order status
- Track shipments
- View timeline

### API Endpoints
- `GET /api/suppliers/orders` - All supplier orders
- `GET /api/user/orders` - Customer orders
- `PATCH /api/suppliers/orders/:id/status` - Update status
- `PATCH /api/suppliers/orders/:id/out-for-delivery` - Mark shipped

## 🧹 Reset Data

To clear and re-seed:

```bash
npm run db:seed:orders
```

The script automatically clears existing orders before seeding.

## ⚠️ Notes

- Dates are spread over the last 6 months for realistic distribution
- Order statuses are weighted based on deal closure date (older = more delivered)
- Each order has 2-6 timeline events depending on its status
- Customer names are in Hebrew for authenticity
- All data is completely fictional and for testing only

## 📊 Use Cases

This dataset is perfect for:
- Testing the order management UI
- Demonstrating the supplier dashboard
- Training users on the system
- Performance testing with realistic data
- Screenshots and demos
- QA and integration testing

---

**Created by:** DealRush Development Team  
**Last Updated:** December 2025
