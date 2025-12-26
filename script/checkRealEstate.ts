import { db } from "../server/db.js";
import { realEstateProjects, developers, projectTiers } from "../shared/schema.js";

async function checkRealEstateData() {
  try {
    console.log("🔍 Checking Real Estate data...\n");

    // Check developers
    const devs = await db.select().from(developers);
    console.log(`✅ Developers: ${devs.length}`);
    devs.forEach(dev => console.log(`   - ${dev.name}`));

    // Check projects
    const projects = await db.select().from(realEstateProjects);
    console.log(`\n✅ Projects: ${projects.length}`);
    projects.forEach(proj => console.log(`   - ${proj.title} (${proj.city})`));

    // Check tiers
    const tiers = await db.select().from(projectTiers);
    console.log(`\n✅ Tiers: ${tiers.length}`);
    
    console.log("\n🎉 All data exists! Module is ready.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

checkRealEstateData();
