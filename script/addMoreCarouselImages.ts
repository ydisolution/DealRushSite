import { db } from "../server/db";
import { deals } from "../shared/schema";
import { eq } from "drizzle-orm";

async function addCarouselImages() {
  try {
    // מזגן Tadiran
    await db
      .update(deals)
      .set({ 
        images: [
          "https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?w=800",
          "https://images.unsplash.com/photo-1631700611307-37dbcb89ef7e?w=800",
          "https://images.unsplash.com/photo-1635274644589-ed1e0547f3c9?w=800",
          "https://images.unsplash.com/photo-1614171285768-1d0e4b0e0fee?w=800"
        ]
      })
      .where(eq(deals.name, "מזגן Tadiran 1.5 כ\"ס"));

    // כיסא גיימינג
    await db
      .update(deals)
      .set({ 
        images: [
          "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800",
          "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800",
          "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800",
          "https://images.unsplash.com/photo-1624705002806-5d72805f2e1c?w=800"
        ]
      })
      .where(eq(deals.name, "כיסא גיימינג מקצועי"));

    // מייבש כביסה Bosch
    await db
      .update(deals)
      .set({ 
        images: [
          "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800",
          "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800",
          "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800",
          "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800"
        ]
      })
      .where(eq(deals.name, "מייבש כביסה Bosch"));

    // מקלט Sony Soundbar
    await db
      .update(deals)
      .set({ 
        images: [
          "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
          "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800",
          "https://images.unsplash.com/photo-1564424224827-cd24b8915874?w=800"
        ]
      })
      .where(eq(deals.name, "מקלט Sony Soundbar"));

    // מצלמת GoPro Hero 11
    await db
      .update(deals)
      .set({ 
        images: [
          "https://images.unsplash.com/photo-1606941973649-a686528c2197?w=800",
          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800",
          "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800",
          "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=800"
        ]
      })
      .where(eq(deals.name, "מצלמת GoPro Hero 11"));

    // אופני הרים Giant
    await db
      .update(deals)
      .set({ 
        images: [
          "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800",
          "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800",
          "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=800",
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800"
        ]
      })
      .where(eq(deals.name, "אופני הרים Giant"));

    console.log("✅ עודכנו 6 מוצרים עם קרוסלות תמונות!");
    process.exit(0);
  } catch (error) {
    console.error("❌ שגיאה:", error);
    process.exit(1);
  }
}

addCarouselImages();
