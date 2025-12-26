import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function updateAdminPassword() {
  try {
    // Check if admin exists
    const admin = await db.select().from(users).where(eq(users.email, "admin@dealrush.co.il"));
    
    if (admin.length === 0) {
      console.log("❌ Admin user not found!");
      process.exit(1);
    }

    console.log("Found admin user:", admin[0].email);
    console.log("Current password status:", admin[0].passwordHash ? "Set" : "Not set");

    // Hash the password
    const password = "Admin2024!";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password
    await db
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.email, "admin@dealrush.co.il"));

    console.log("\n✅ Admin password updated successfully!");
    console.log("📧 Email: admin@dealrush.co.il");
    console.log("🔑 Password: Admin2024!");

    // Verify the update
    const updatedAdmin = await db.select().from(users).where(eq(users.email, "admin@dealrush.co.il"));
    console.log("\n✓ Password is now set:", !!updatedAdmin[0].passwordHash);

    // Test the password
    const isValid = await bcrypt.compare(password, updatedAdmin[0].passwordHash!);
    console.log("✓ Password verification:", isValid ? "SUCCESS" : "FAILED");

    process.exit(0);
  } catch (error) {
    console.error("Error updating admin password:", error);
    process.exit(1);
  }
}

updateAdminPassword();
