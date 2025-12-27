import { db } from '../server/db';
import { projectRegistrations, realEstateProjects } from '../shared/schema';
import { eq } from 'drizzle-orm';

const firstNames = [
  'יוסי', 'דוד', 'משה', 'אברהם', 'יעקב', 'שמואל', 'רחל', 'שרה', 'רבקה', 'לאה',
  'דניאל', 'נועם', 'תמר', 'עידו', 'אורי', 'רונן', 'מיכל', 'יעל', 'גל', 'עומר',
  'איתי', 'שי', 'אלון', 'טל', 'ניר', 'ענת', 'הדר', 'מאיה', 'אילנה', 'אסף',
  'גיא', 'רוני', 'שלומי', 'עדי', 'ליאור', 'אביב', 'חן', 'נעמה', 'מורן', 'שירה'
];

const lastNames = [
  'כהן', 'לוי', 'מזרחי', 'ביטון', 'אוחיון', 'פרץ', 'חדד', 'אברהם', 'בן דוד', 'אזולאי',
  'משה', 'יוסף', 'דוד', 'בן שמעון', 'אסולין', 'בוזגלו', 'אליהו', 'מלכה', 'עמר', 'ששון',
  'חיים', 'גבאי', 'ברוך', 'מימון', 'וקנין', 'אלבז', 'כהן לוי', 'בן חמו', 'עובדיה', 'סעדון'
];

const apartmentTypes = ['3_ROOM', '4_ROOM', '5_ROOM'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhoneNumber(): string {
  return `05${Math.floor(Math.random() * 90000000 + 10000000)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'walla.co.il', 'outlook.com', 'yahoo.com', 'hotmail.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${getRandomElement(domains)}`;
}

function getParticipantCountByStage(stage: string, totalCapacity: number): number {
  switch (stage) {
    case 'PRE_REGISTRATION':
      // שלב רישום מקדים - בין 15% ל-40% מהקיבולת
      return Math.floor(totalCapacity * (0.15 + Math.random() * 0.25));
    case 'WEBINAR_SCHEDULED':
      // כנס רוכשים - בין 40% ל-70% מהקיבולת
      return Math.floor(totalCapacity * (0.4 + Math.random() * 0.3));
    case 'FOMO_CONFIRMATION_WINDOW':
      // רישום סופי - בין 70% ל-95% מהקיבולת
      return Math.floor(totalCapacity * (0.7 + Math.random() * 0.25));
    case 'REGISTRATION_CLOSED':
      // בחירת נכס וחתימה - 100% או קרוב לזה
      return Math.floor(totalCapacity * (0.95 + Math.random() * 0.05));
    default:
      return Math.floor(totalCapacity * 0.2);
  }
}

async function addRealisticParticipants() {
  try {
    console.log('🚀 Starting to add realistic participants to projects...\n');

    // Get all projects
    const projects = await db.select().from(realEstateProjects);
    console.log(`📊 Found ${projects.length} projects\n`);

    for (const project of projects) {
      console.log(`\n📍 Processing: ${project.title}`);
      console.log(`   Stage: ${project.currentStage}`);
      console.log(`   Capacity: ${project.totalCapacity}`);

      // Calculate how many participants to add
      const participantCount = getParticipantCountByStage(
        project.currentStage,
        project.totalCapacity
      );
      console.log(`   Will add: ${participantCount} participants`);

      // Clear existing participants for this project
      await db.delete(projectRegistrations).where(
        eq(projectRegistrations.projectId, project.id)
      );

      // Add participants
      const participants = [];
      for (let i = 0; i < participantCount; i++) {
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        const phone = generatePhoneNumber();
        const email = generateEmail(firstName, lastName);
        const apartmentType = getRandomElement(apartmentTypes);

        // Determine funnel status based on project stage
        let funnelStatus = 'PRE_REGISTERED';
        let queuePosition = null;
        
        if (project.currentStage === 'REGISTRATION_CLOSED' || 
            project.currentStage === 'FOMO_CONFIRMATION_WINDOW') {
          // For advanced stages, most are confirmed
          if (i < project.totalCapacity) {
            funnelStatus = 'CONFIRMED_PARTICIPANT';
            queuePosition = i + 1;
          } else {
            funnelStatus = 'WAITING_LIST';
            queuePosition = i + 1;
          }
        }

        // Random date in the last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const registeredDate = new Date();
        registeredDate.setDate(registeredDate.getDate() - daysAgo);

        participants.push({
          projectId: project.id,
          developerId: project.developerId,
          fullName: `${firstName} ${lastName}`,
          firstName,
          lastName,
          phone,
          email,
          selectedApartmentType: apartmentType,
          funnelStatus,
          queuePosition,
          earlyRegisteredAt: registeredDate,
          createdAt: registeredDate,
          updatedAt: registeredDate,
        });
      }

      // Insert all participants
      if (participants.length > 0) {
        await db.insert(projectRegistrations).values(participants);
        console.log(`   ✅ Added ${participants.length} participants`);
        console.log(`   📋 Status breakdown:`);
        const confirmed = participants.filter(p => p.funnelStatus === 'CONFIRMED_PARTICIPANT').length;
        const waiting = participants.filter(p => p.funnelStatus === 'WAITING_LIST').length;
        const preReg = participants.filter(p => p.funnelStatus === 'PRE_REGISTERED').length;
        if (confirmed > 0) console.log(`      - Confirmed: ${confirmed}`);
        if (waiting > 0) console.log(`      - Waiting List: ${waiting}`);
        if (preReg > 0) console.log(`      - Pre-registered: ${preReg}`);
      }
    }

    console.log('\n✨ Successfully added realistic participants to all projects!');
  } catch (error) {
    console.error('❌ Error adding participants:', error);
    throw error;
  }
}

addRealisticParticipants();
