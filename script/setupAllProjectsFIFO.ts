import { db } from '../server/db.js';
import { realEstateProjects } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// הגדרות סימולציה לכל פרויקט
const projectsConfig = [
  {
    slug: 'migdalei-alon-rishon',
    title: 'מגדלי אלון - ראשון לציון',
    totalCapacity: 80,
    waitingListCapacity: 15,
    currentStage: 'FOMO_CONFIRMATION_WINDOW',
    currentRegistrantCount: 72,
    currentWaitingListCount: 8,
    webinarDate: new Date('2025-12-20T19:00:00'),
    webinarLink: 'https://zoom.us/j/123456789',
    finalRegistrationEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 ימים
    description: 'שלב 3: ✨ הווביניר התקיים! זה הזמן לאשר השתתפות ולבחור דירה'
  },
  {
    slug: 'olive-quarter-ramat-hasharon',
    title: 'שכונת הזית - רמת השרון',
    totalCapacity: 45,
    waitingListCapacity: 10,
    currentStage: 'PRE_REGISTRATION',
    currentRegistrantCount: 8,
    currentWaitingListCount: 0,
    finalRegistrationEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 ימים
    description: 'שלב 1: 🚀 רישום מקדים - הירשמו עכשיו לפני הווביניר!'
  },
  {
    slug: 'residence-herzliya',
    title: 'רזידנס הרצליה',
    totalCapacity: 60,
    waitingListCapacity: 12,
    currentStage: 'WEBINAR_SCHEDULED',
    currentRegistrantCount: 45,
    currentWaitingListCount: 0,
    webinarDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // בעוד 5 ימים
    webinarLink: 'https://zoom.us/j/987654321',
    finalRegistrationEnd: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    description: 'שלב 2: 📹 הווביניר מתקרב! נרשמים מקבלים הזמנה אוטומטית'
  },
  {
    slug: 'marina-south-ashkelon',
    title: 'מרינה הדרומית - אשקלון',
    totalCapacity: 70,
    waitingListCapacity: 15,
    currentStage: 'PRE_REGISTRATION',
    currentRegistrantCount: 15,
    currentWaitingListCount: 0,
    finalRegistrationEnd: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    description: 'שלב 1: 🏖️ פרויקט חדש! מחירים מיוחדים לנרשמים הראשונים'
  },
  {
    slug: 'negev-quarter-beer-sheva',
    title: 'שכונת הנגב - באר שבע',
    totalCapacity: 100,
    waitingListCapacity: 20,
    currentStage: 'FOMO_CONFIRMATION_WINDOW',
    currentRegistrantCount: 95,
    currentWaitingListCount: 18,
    webinarDate: new Date('2025-12-18T18:00:00'),
    webinarLink: 'https://zoom.us/j/555666777',
    finalRegistrationEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 ימים!
    description: 'שלב 3: ⚡ אזהרה! נותרו 48 שעות לאישור - כמעט מלא!'
  },
  {
    slug: 'ramat-hanasi-eilat',
    title: 'רמת הנשיא - אילת',
    totalCapacity: 40,
    waitingListCapacity: 8,
    currentStage: 'WEBINAR_SCHEDULED',
    currentRegistrantCount: 32,
    currentWaitingListCount: 0,
    webinarDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // שבוע
    webinarLink: 'https://zoom.us/j/111222333',
    finalRegistrationEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    description: 'שלב 2: 🌴 הווביניר בעוד שבוע - הטבות מס באילת!'
  },
  {
    slug: 'carmel-hayarok-haifa',
    title: 'כרמל הירוק - חיפה',
    totalCapacity: 55,
    waitingListCapacity: 10,
    currentStage: 'REGISTRATION_CLOSED',
    currentRegistrantCount: 55,
    currentWaitingListCount: 10,
    webinarDate: new Date('2025-12-15T19:30:00'),
    finalRegistrationEnd: new Date('2025-12-25T23:59:59'),
    description: 'שלב 4: ✅ הפרויקט מלא! רשימת המתנה זמינה'
  },
  {
    slug: 'emek-yizrael-nazareth',
    title: 'עמק יזרעאל - נצרת עילית',
    totalCapacity: 80,
    waitingListCapacity: 15,
    currentStage: 'PRE_REGISTRATION',
    currentRegistrantCount: 22,
    currentWaitingListCount: 0,
    finalRegistrationEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    description: 'שלב 1: 🏡 פרויקט משפחתי - מחירים נוחים!'
  },
  {
    slug: 'nof-hagalil-karmiel',
    title: 'נוף הגליל - כרמיאל',
    totalCapacity: 35,
    waitingListCapacity: 8,
    currentStage: 'FOMO_CONFIRMATION_WINDOW',
    currentRegistrantCount: 33,
    currentWaitingListCount: 5,
    webinarDate: new Date('2025-12-22T20:00:00'),
    webinarLink: 'https://zoom.us/j/444555666',
    finalRegistrationEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 ימים
    description: 'שלב 3: 🎯 אישור אחרון - נותרו רק 2 דירות!'
  },
  {
    slug: 'park-hamuoshava-pt',
    title: 'פארק המושבה - פתח תקווה',
    totalCapacity: 50,
    waitingListCapacity: 10,
    currentStage: 'WEBINAR_SCHEDULED',
    currentRegistrantCount: 38,
    currentWaitingListCount: 0,
    webinarDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 ימים
    webinarLink: 'https://zoom.us/j/777888999',
    finalRegistrationEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    description: 'שלב 2: 📺 הווביניר ביום שלישי - הזדרזו להירשם!'
  }
];

console.log('\n🚀 מעדכן את כל הפרויקטים עם סימולציה מלאה...\n');
console.log('='.repeat(80));

for (const config of projectsConfig) {
  try {
    await db.update(realEstateProjects)
      .set({
        totalCapacity: config.totalCapacity,
        waitingListCapacity: config.waitingListCapacity,
        currentStage: config.currentStage,
        currentRegistrantCount: config.currentRegistrantCount,
        currentWaitingListCount: config.currentWaitingListCount,
        finalRegistrationEnd: config.finalRegistrationEnd,
        ...(config.webinarDate && { presentationEventDate: config.webinarDate }),
        ...(config.webinarLink && { 
          updatedOfferDetails: JSON.stringify({ 
            webinarLink: config.webinarLink 
          })
        }),
      })
      .where(eq(realEstateProjects.slug, config.slug));

    const stageEmoji = {
      'PRE_REGISTRATION': '1️⃣',
      'WEBINAR_SCHEDULED': '2️⃣',
      'FOMO_CONFIRMATION_WINDOW': '3️⃣',
      'REGISTRATION_CLOSED': '✅'
    }[config.currentStage];

    console.log(`${stageEmoji} ${config.title}`);
    console.log(`   שלב: ${config.currentStage}`);
    console.log(`   רישום: ${config.currentRegistrantCount}/${config.totalCapacity} | המתנה: ${config.currentWaitingListCount}/${config.waitingListCapacity}`);
    console.log(`   ${config.description}`);
    console.log(`   🔗 http://localhost:5000/real-estate/${config.slug}`);
    console.log('');
  } catch (error) {
    console.error(`❌ שגיאה ב-${config.title}:`, error.message);
  }
}

console.log('='.repeat(80));
console.log('\n✅ הסימולציה הושלמה בהצלחה!');
console.log('\n📊 פיזור השלבים:');
console.log(`   🔵 PRE_REGISTRATION (רישום ראשוני): 3 פרויקטים`);
console.log(`   🟡 WEBINAR_SCHEDULED (לפני ווביניר): 3 פרויקטים`);
console.log(`   🟠 FOMO_CONFIRMATION_WINDOW (אישור סופי): 3 פרויקטים`);
console.log(`   🟢 REGISTRATION_CLOSED (נסגר): 1 פרויקט`);
console.log('\n🌐 פתח את: http://localhost:5000/real-estate\n');

process.exit(0);
