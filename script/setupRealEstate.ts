import { db } from "../server/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupRealEstate() {
  try {
    console.log("🔧 Setting up Real Estate module...");

    // Read and execute migration
    const migrationPath = path.join(__dirname, "../migrations/0002_real_estate_module.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("📦 Creating tables...");
    await db.execute(sql.raw(migrationSQL));
    console.log("✅ Tables created successfully");

    // Now run the seed
    console.log("🌱 Seeding data...");
    const seedModule = await import("./seedRealEstate.js");
    if (typeof seedModule.default === "function") {
      await seedModule.default();
    } else if (typeof seedModule.seedRealEstate === "function") {
      await seedModule.seedRealEstate();
    }
    
    console.log("🎉 Real Estate module setup complete!");
  } catch (error) {
    console.error("❌ Error setting up Real Estate:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

setupRealEstate();
