import { db } from "../server/db";
import { deals } from "../shared/schema";
import { eq } from "drizzle-orm";

async function addCarouselImages() {
  try {
    const coffeeImages = [
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800", 
      "https://images.unsplash.com/photo-1585758719543-59257e1b0fca?w=800",
      "https://images.unsplash.com/photo-1611564389969-563a44837b3b?w=800"
    ];

    const result = await db
      .update(deals)
      .set({ images: coffeeImages })
      .where(eq(deals.id, "2569f516-c4f1-46f4-846e-41d5ed8b368a"))
      .returning();

    console.log("✅ עודכן בהצלחה!");
    console.log("מוצר:", result[0].name);
    console.log("מספר תמונות:", result[0].images.length);
    console.log("\nהתמונות:");
    result[0].images.forEach((img: string, i: number) => {
      console.log(`  ${i + 1}. ${img}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ שגיאה:", error);
    process.exit(1);
  }
}

addCarouselImages();
