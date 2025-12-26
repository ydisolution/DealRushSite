import { db } from "../server/db";
import { developers, realEstateProjects, projectTiers } from "../shared/schema";

async function seedRealEstate() {
  console.log("🏗️ Starting real estate seeding...");

  try {
    // Clean existing data
    console.log("🗑️ Cleaning existing data...");
    await db.delete(projectTiers);
    await db.delete(realEstateProjects);
    await db.delete(developers);

    // Create developers
    console.log("👷 Creating developers...");
    const devs = await db.insert(developers).values([
      {
        name: "קבוצת רכישה יזמות",
        description: "קבוצה יזמית מובילה בישראל",
        contactEmail: "info@rekisha.co.il",
        contactPhone: "03-1234567",
      },
      {
        name: "אפריקה ישראל",
        description: "חברת בנייה מובילה עם ניסיון של עשרות שנים",
        contactEmail: "info@africa-israel.co.il",
        contactPhone: "03-7654321",
      },
      {
        name: "אלקטרה נדל\"ן",
        description: "קבוצת אלקטרה - בניה ופיתוח איכותי",
        contactEmail: "info@electra-re.co.il",
        contactPhone: "03-9876543",
      },
      {
        name: "טדי קולק יזמות",
        description: "חברה משפחתית ווותיקה",
        contactEmail: "info@teddy.co.il",
        contactPhone: "08-6543210",
      },
    ]).returning();

    console.log(`✅ Created ${devs.length} developers`);

    // Create 10 projects
    console.log("🏘️ Creating 10 projects...");
    const projects = await db.insert(realEstateProjects).values([
      // מרכז - 4 פרויקטים
      {
        developerId: devs[0].id,
        title: "פארק המושבה - פתח תקווה",
        slug: "park-hamuoshava-pt",
        city: "פתח תקווה",
        region: "מרכז",
        addressText: "רחוב המושבה 45",
        description: "72 דירות בפרויקט בוטיק.\n\nתנאי תשלום: 10% בחתימה + 90% לפני מסירה, ללא הצמדה למדד.\n\nהתהליך מנוהל ומלווה ע\"י משרד עריכת דין חיצוני המייצג את הרוכשים מול הקבלן.",
        marketPriceBaseline: 2300000,
        propertyTypes: [
          { type: "3 חדרים", count: 20, marketPrice: 1800000 },
          { type: "4 חדרים", count: 32, marketPrice: 2300000 },
          { type: "5 חדרים", count: 20, marketPrice: 2900000 },
        ],
        highlights: ["גינה משותפת 500 מ\"ר", "חניה תת קרקעית", "מעלית שבת", "תשלום 10/90"],
        coverImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
        gallery: [
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        ],
        expectedDeliveryDate: new Date("2026-12-31"),
        // Stage 3: FINAL_REGISTRATION (active now!)
        earlyRegistrationStart: new Date("2025-11-01"),
        presentationEventDate: new Date("2025-12-10"),
        finalRegistrationStart: new Date("2025-12-18T08:00:00"),
        finalRegistrationEnd: new Date("2025-12-20T23:59:59"),
        currentStage: "FINAL_REGISTRATION",
        legalDisclaimer: "ליווי משפטי מלא ע\"י עו\"ד דוד סיטון",
        status: "open",
      },
      {
        developerId: devs[1].id,
        title: "מגדלי אלון - ראשון לציון",
        slug: "migdalei-alon-rishon",
        city: "ראשון לציון",
        region: "מרכז",
        addressText: "שדרות ירושלים 120",
        description: "2 מגדלי יוקרה, 180 דירות.\n\nתנאי תשלום: 20% בחתימה + 80% בשלבי בנייה, ללא הצמדה למדד.\n\nהתהליך מנוהל ומלווה ע\"י משרד עריכת דין חיצוני המייצג את הרוכשים מול הקבלן.",
        marketPriceBaseline: 2600000,
        propertyTypes: [
          { type: "3 חדרים", count: 45, marketPrice: 2000000 },
          { type: "4 חדרים", count: 80, marketPrice: 2600000 },
          { type: "פנטהאוז", count: 20, marketPrice: 5200000 },
        ],
        highlights: ["נוף לים", "בריכה על הגג", "קונסיירז׳ 24/7", "תשלום 20/80"],
        coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
        gallery: [
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
          "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=800",
        ],
        expectedDeliveryDate: new Date("2027-06-30"),
        // Stage 2: PRESENTATION
        earlyRegistrationStart: new Date("2025-11-15"),
        presentationEventDate: new Date("2025-12-22T19:00:00"),
        finalRegistrationStart: new Date("2025-12-25T08:00:00"),
        finalRegistrationEnd: new Date("2025-12-27T23:59:59"),
        currentStage: "PRESENTATION",
        legalDisclaimer: "ליווי משפטי מלא ע\"י עו\"ד דוד סיטון",
        status: "open",
      },
      {
        developerId: devs[0].id,
        title: "שכונת הזית - רמת השרון",
        slug: "olive-quarter-ramat-hasharon",
        city: "רמת השרון",
        region: "מרכז",
        addressText: "רחוב האלון 8",
        description: "45 דירות גן ודופלקסים.\n\nתנאי תשלום: 10% בחתימה + 90% לפני מסירה, ללא הצמדה למדד.\n\nהתהליך מנוהל ומלווה ע\"י משרד עריכת דין חיצוני המייצג את הרוכשים מול הקבלן.",
        marketPriceBaseline: 3800000,
        propertyTypes: [
          { type: "דירת גן 4 חדרים", count: 15, marketPrice: 3200000 },
          { type: "דופלקס 5 חדרים", count: 18, marketPrice: 4200000 },
        ],
        highlights: ["גינות פרטיות", "בניה ירוקה", "קהילה קטנה", "תשלום 10/90"],
        coverImage: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800",
        gallery: [
          "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        ],
        expectedDeliveryDate: new Date("2026-09-30"),
        legalDisclaimer: "ליווי משפטי מלא ע\"י עו\"ד דוד סיטון",
        status: "open",
      },
      {
        developerId: devs[2].id,
        title: "רזידנס הרצליה",
        slug: "residence-herzliya",
        city: "הרצליה",
        region: "מרכז",
        addressText: "רחוב הים 50",
        description: "96 דירות יוקרה מול הים.\n\nתנאי תשלום: 20% בחתימה + 80% בשלבי בנייה, ללא הצמדה למדד.\n\nהתהליך מנוהל ומלווה ע\"י משרד עריכת דין חיצוני המייצג את הרוכשים מול הקבלן.",
        marketPriceBaseline: 4500000,
        propertyTypes: [
          { type: "3 חדרים", count: 24, marketPrice: 3500000 },
          { type: "4 חדרים", count: 36, marketPrice: 4500000 },
          { type: "פנטהאוז", count: 12, marketPrice: 8500000 },
        ],
        highlights: ["מיקום מול הים", "בריכת אינסוף", "מערכות חכמות", "תשלום 20/80"],
        coverImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        gallery: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
        ],
        expectedDeliveryDate: new Date("2027-03-31"),
        legalDisclaimer: "ליווי משפטי מלא ע\"י עו\"ד דוד סיטון",
        status: "open",
      },

      // דרום - 3 פרויקטים
      {
        developerId: devs[3].id,
        title: "מרינה הדרומית - אשקלון",
        slug: "marina-south-ashkelon",
        city: "אשקלון",
        region: "דרום",
        addressText: "שדרות בן גוריון 78",
        description: "120 דירות קרוב לים.\n\nתנאי תשלום: 10% בחתימה + 90% לפני מסירה, ללא הצמדה למדד.\n\nהתהליך מנוהל ומלווה ע\"י משרד עריכת דין חיצוני המייצג את הרוכשים מול הקבלן.",
        marketPriceBaseline: 1750000,
        propertyTypes: [
          { type: "3 חדרים", count: 40, marketPrice: 1400000 },
          { type: "4 חדרים", count: 50, marketPrice: 1750000 },
          { type: "5 חדרים", count: 25, marketPrice: 2100000 },
        ],
        highlights: ["10 דקות מהחוף", "שכונה חדשה", "מחירים נוחים", "תשלום 10/90"],
        coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        gallery: [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
        ],
        expectedDeliveryDate: new Date("2026-08-31"),
        legalDisclaimer: "ליווי משפטי מלא ע\"י עו\"ד דוד סיטון",
        status: "open",
      },
      {
        developerId: devs[1].id,
        title: "שכונת הנגב - באר שבע",
        slug: "negev-quarter-beer-sheva",
        city: "באר שבע",
        region: "דרום",
        addressText: "רחוב רגר 34",
        description: "200 דירות בשכונה חדשה.\n\nתנאי תשלום: 10% בחתימה + 90% לפני מסירה, ללא הצמדה למדד.\n\nהתהליך מנוהל ומלווה ע\"י משרד עריכת דין חיצוני המייצג את הרוכשים מול הקבלן.",
        marketPriceBaseline: 1500000,
        propertyTypes: [
          { type: "3 חדרים", count: 70, marketPrice: 1200000 },
          { type: "4 חדרים", count: 90, marketPrice: 1500000 },
          { type: "5 חדרים", count: 35, marketPrice: 1850000 },
        ],
        highlights: ["קרבה לאוניברסיטה", "מחירים נוחים", "פוטנציאל עליה", "תשלום 10/90"],
        coverImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        gallery: [
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
          "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800",
        ],
        expectedDeliveryDate: new Date("2027-01-31"),
        legalDisclaimer: "ליווי משפטי מלא ע\"י עו\"ד דוד סיטון",
        status: "open",
      },
      {
        developerId: devs[2].id,
        title: "רמת הנשיא - אילת",
        slug: "ramat-hanasi-eilat",
        city: "אילת",
        region: "דרום",
        addressText: "שדרות התמרים 15",
        description: "60 דירות יוקרה באילת.\n\nתנאי תשלום: 20% בחתימה + 80% בשלבי בנייה, ללא הצמדה למדד.\n\nהתהליך מנוהל ומלווה ע\"י משרד עריכת דין חיצוני המייצג את הרוכשים מול הקבלן.",
        marketPriceBaseline: 2400000,
        propertyTypes: [
          { type: "3 חדרים", count: 15, marketPrice: 1900000 },
          { type: "4 חדרים", count: 25, marketPrice: 2400000 },
          { type: "פנטהאוז", count: 5, marketPrice: 4500000 },
        ],
        highlights: ["נוף להרים ולים", "הטבות מס", "בריכה מחוממת", "תשלום 20/80"],
        coverImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        gallery: [
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
          "https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800",
        ],
        expectedDeliveryDate: new Date("2026-11-30"),
        legalDisclaimer: "ליווי משפטי מלא ע\"י עו\"ד דוד סיטון",
        status: "open",
      },

      // צפון - 3 פרויקטים
      {
        developerId: devs[0].id,
        title: "כרמל הירוק - חיפה",
        slug: "carmel-hayarok-haifa",
        city: "חיפה",
        region: "צפון",
        addressText: "שדרות הנשיא 120",
        description: "85 דירות על הכרמל.\n\nתנאי תשלום: 10% בחתימה + 90% לפני מסירה, ללא הצמדה למדד.\n\nהתהליך מנוהל ומלווה ע\"י משרד עריכת דין חיצוני המייצג את הרוכשים מול הקבלן.",
        marketPriceBaseline: 2300000,
        propertyTypes: [
          { type: "3 חדרים", count: 25, marketPrice: 1800000 },
          { type: "4 חדרים", count: 35, marketPrice: 2300000 },
          { type: "5 חדרים", count: 20, marketPrice: 2900000 },
        ],
        highlights: ["נוף לים", "קרבה לאוניברסיטה", "אוויר נקי", "תשלום 10/90"],
        coverImage: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800",
        gallery: [
          "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800",
          "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800",
        ],
        expectedDeliveryDate: new Date("2026-10-31"),
        legalDisclaimer: "ליווי משפטי מלא ע\"י עו\"ד דוד סיטון",
        status: "open",
      },
      {
        developerId: devs[1].id,
        title: "עמק יזרעאל - נצרת עילית",
        slug: "emek-yizrael-nazareth",
        city: "נצרת עילית",
        region: "צפון",
        addressText: "רחוב הגליל 45",
        description: "140 דירות משפחתיות.\n\nתנאי תשלום: 10% בחתימה + 90% לפני מסירה, ללא הצמדה למדד.\n\nהתהליך מנוהל ומלווה ע\"י משרד עריכת דין חיצוני המייצג את הרוכשים מול הקבלן.",
        marketPriceBaseline: 1650000,
        propertyTypes: [
          { type: "3 חדרים", count: 45, marketPrice: 1300000 },
          { type: "4 חדרים", count: 60, marketPrice: 1650000 },
          { type: "5 חדרים", count: 30, marketPrice: 2000000 },
        ],
        highlights: ["שכונה משפחתית", "מחירים נוחים", "אוויר נקי", "תשלום 10/90"],
        coverImage: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
        gallery: [
          "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
          "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800",
        ],
        expectedDeliveryDate: new Date("2026-12-31"),
        legalDisclaimer: "ליווי משפטי מלא ע\"י עו\"ד דוד סיטון",
        status: "open",
      },
      {
        developerId: devs[2].id,
        title: "נוף הגליל - כרמיאל",
        slug: "nof-hagalil-karmiel",
        city: "כרמיאל",
        region: "צפון",
        addressText: "רחוב הזית 28",
        description: "50 דירות בוטיק.\n\nתנאי תשלום: 20% בחתימה + 80% בשלבי בנייה, ללא הצמדה למדד.\n\nהתהליך מנוהל ומלווה ע\"י משרד עריכת דין חיצוני המייצג את הרוכשים מול הקבלן.",
        marketPriceBaseline: 1500000,
        propertyTypes: [
          { type: "4 חדרים", count: 25, marketPrice: 1500000 },
          { type: "5 חדרים", count: 18, marketPrice: 1850000 },
          { type: "דירת גן", count: 7, marketPrice: 1700000 },
        ],
        highlights: ["פרויקט בוטיק", "קרבה לטבע", "קהילה חמה", "תשלום 20/80"],
        coverImage: "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800",
        gallery: [
          "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800",
          "https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800",
        ],
        expectedDeliveryDate: new Date("2026-07-31"),
        legalDisclaimer: "ליווי משפטי מלא ע\"י עו\"ד דוד סיטון",
        status: "open",
      },
    ]).returning();

    console.log(`✅ Created ${projects.length} projects`);

    // Create tiers for each project
    console.log("📊 Creating tiers...");
    let tierCount = 0;
    for (const project of projects) {
      await db.insert(projectTiers).values([
        {
          projectId: project.id,
          name: "מדרגה ראשונה - חיסכון 5%",
          thresholdRegistrants: 10,
          fromPrice: Math.round(project.marketPriceBaseline * 0.95),
          savings: Math.round(project.marketPriceBaseline * 0.05),
          savingsPercent: 5,
          benefits: ["חניה פרטית", "מחסן"],
          sortOrder: 1,
        },
        {
          projectId: project.id,
          name: "מדרגה שנייה - חיסכון 8%",
          thresholdRegistrants: 25,
          fromPrice: Math.round(project.marketPriceBaseline * 0.92),
          savings: Math.round(project.marketPriceBaseline * 0.08),
          savingsPercent: 8,
          benefits: ["חניה פרטית", "מחסן", "שדרוגי חשמל"],
          sortOrder: 2,
        },
        {
          projectId: project.id,
          name: "מדרגה שלישית - חיסכון 12%",
          thresholdRegistrants: 50,
          fromPrice: Math.round(project.marketPriceBaseline * 0.88),
          savings: Math.round(project.marketPriceBaseline * 0.12),
          savingsPercent: 12,
          benefits: ["חניה פרטית", "מחסן", "שדרוגי חשמל", "מיזוג מרכזי"],
          sortOrder: 3,
        },
        {
          projectId: project.id,
          name: "מדרגה רביעית - חיסכון 15%",
          thresholdRegistrants: 100,
          fromPrice: Math.round(project.marketPriceBaseline * 0.85),
          savings: Math.round(project.marketPriceBaseline * 0.15),
          savingsPercent: 15,
          benefits: ["חניה פרטית", "מחסן", "שדרוגי חשמל", "מיזוג מרכזי", "Smart Home"],
          sortOrder: 4,
        },
      ]);
      tierCount += 4;
    }

    console.log(`✅ Created ${tierCount} tiers`);
    console.log("\n🎉 Real estate seeding completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   - ${devs.length} developers`);
    console.log(`   - ${projects.length} projects (4 מרכז, 3 דרום, 3 צפון)`);
    console.log(`   - ${tierCount} discount tiers`);
    console.log(`\n💼 All projects include:`);
    console.log(`   - תנאי תשלום: 10/90 או 20/80`);
    console.log(`   - ללא הצמדה למדד`);
    console.log(`   - ליווי משפטי: עו"ד דוד סיטון\n`);

  } catch (error) {
    console.error("❌ Error seeding real estate data:", error);
    throw error;
  }
}

seedRealEstate();

