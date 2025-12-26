import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkUser() {
  const email = "shlomida22@gmail.com";
  
  console.log(`🔍 מחפש משתמש: ${email}`);
  
  const user = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  if (user.length === 0) {
    console.log("❌ המשתמש לא קיים במערכת!");
    console.log("\nהאם אולי התכוונת לאחד מהמיילים הללו?");
    
    // חיפוש משתמשים דומים
    const allUsers = await db.select({
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt
    }).from(users).limit(20);
    
    console.log("\nמשתמשים במערכת:");
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.firstName || 'N/A'} ${u.lastName || 'N/A'}) - נוצר: ${u.createdAt}`);
    });
  } else {
    const u = user[0];
    console.log("✅ המשתמש נמצא!");
    console.log("\nפרטי המשתמש:");
    console.log(`  ID: ${u.id}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  שם: ${u.firstName} ${u.lastName}`);
    console.log(`  טלפון: ${u.phone || 'לא הוגדר'}`);
    console.log(`  מאומת: ${u.isEmailVerified === 'true' ? 'כן' : 'לא'}`);
    console.log(`  אדמין: ${u.isAdmin === 'true' ? 'כן' : 'לא'}`);
    console.log(`  ספק: ${u.isSupplier === 'true' ? 'כן' : 'לא'}`);
    console.log(`  נוצר: ${u.createdAt}`);
    console.log(`  יש סיסמה: ${u.passwordHash ? 'כן' : 'לא'}`);
    
    if (!u.passwordHash) {
      console.log("\n⚠️  למשתמש אין סיסמה! זה עלול להיות בעיה.");
    }
  }
  
  process.exit(0);
}

checkUser().catch((error) => {
  console.error("שגיאה:", error);
  process.exit(1);
});
