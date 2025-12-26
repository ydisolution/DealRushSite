import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function checkUser() {
  try {
    console.log("🔍 Checking user: dreamer@dealrush.co.il\n");
    
    const [user] = await db.select().from(users).where(eq(users.email, "dreamer@dealrush.co.il")).limit(1);
    
    if (!user) {
      console.log("❌ User NOT found!");
      console.log("\n📝 Creating user...");
      
      const hashedPassword = await bcrypt.hash("Dreamer2024!", 10);
      
      const [newUser] = await db.insert(users).values({
        email: "dreamer@dealrush.co.il",
        passwordHash: hashedPassword,
        firstName: "Dreamer",
        lastName: "Supplier",
        phone: "050-2222222",
        isAdmin: "false",
        isSupplier: "true",
        supplierCompanyName: "Dreamer Supplies",
        isEmailVerified: "true",
      }).returning();
      
      console.log("✅ User created:", newUser.email);
      console.log("   Password: Dreamer2024!");
    } else {
      console.log("✅ User found!");
      console.log("   Email:", user.email);
      console.log("   First Name:", user.firstName);
      console.log("   Is Supplier:", user.isSupplier);
      console.log("   Is Admin:", user.isAdmin);
      console.log("   Email Verified:", user.isEmailVerified);
      
      // Test password
      const testPassword = "Dreamer2024!";
      if (user.passwordHash) {
        const isValid = await bcrypt.compare(testPassword, user.passwordHash);
        console.log(`\n🔐 Password test for "${testPassword}":`, isValid ? "✅ VALID" : "❌ INVALID");
        
        if (!isValid) {
          console.log("\n🔧 Resetting password to: Dreamer2024!");
          const newHash = await bcrypt.hash(testPassword, 10);
          await db.update(users).set({ passwordHash: newHash }).where(eq(users.email, "dreamer@dealrush.co.il"));
          console.log("✅ Password reset successfully!");
        }
      }
    }
    
    // Check all suppliers
    console.log("\n\n📋 All suppliers in DB:");
    const allSuppliers = await db.select().from(users).where(eq(users.isSupplier, "true"));
    allSuppliers.forEach(s => {
      console.log(`   - ${s.email} (${s.firstName} ${s.lastName})`);
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  process.exit(0);
}

checkUser();
