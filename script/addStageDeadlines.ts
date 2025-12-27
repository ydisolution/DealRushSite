import { db } from '../server/db';
import { realEstateProjects } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function addStageDeadlines() {
  console.log('🚀 Starting to add stage deadlines to projects...\n');

  try {
    const projects = await db
      .select()
      .from(realEstateProjects);

    console.log(`📊 Found ${projects.length} projects\n`);

    for (const project of projects) {
      console.log(`📍 Processing: ${project.title}`);
      console.log(`   Current Stage: ${project.currentStage}`);

      let earlyRegistrationEnd = null;
      let webinarDeadline = null;
      let finalRegistrationEnd = project.finalRegistrationEnd; // Keep existing if present

      // Calculate deadlines based on current stage and dates
      switch (project.currentStage) {
        case 'PRE_REGISTRATION':
          // Set early registration to end in 20 days
          earlyRegistrationEnd = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
          break;
        
        case 'WEBINAR_SCHEDULED':
          // Webinar deadline is 5 days after presentation event date
          if (project.presentationEventDate) {
            webinarDeadline = new Date(new Date(project.presentationEventDate).getTime() + 5 * 24 * 60 * 60 * 1000);
          } else {
            // If no presentation date, set webinar deadline in 15 days
            webinarDeadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
          }
          break;
        
        case 'FOMO_CONFIRMATION_WINDOW':
          // Keep existing finalRegistrationEnd or set in 10 days
          if (!finalRegistrationEnd) {
            finalRegistrationEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
          }
          break;
        
        case 'REGISTRATION_CLOSED':
          // No active deadline for closed stage
          break;
      }

      // Update project with deadlines
      await db
        .update(realEstateProjects)
        .set({
          earlyRegistrationEnd,
          webinarDeadline,
          finalRegistrationEnd: finalRegistrationEnd ? new Date(finalRegistrationEnd) : null,
          updatedAt: new Date(),
        })
        .where(eq(realEstateProjects.id, project.id));

      console.log(`   ✅ Updated deadlines:`);
      if (earlyRegistrationEnd) console.log(`      - Early Registration End: ${earlyRegistrationEnd.toISOString()}`);
      if (webinarDeadline) console.log(`      - Webinar Deadline: ${webinarDeadline.toISOString()}`);
      if (finalRegistrationEnd) console.log(`      - Final Registration End: ${new Date(finalRegistrationEnd).toISOString()}`);
      console.log();
    }

    console.log('✨ Successfully added stage deadlines to all projects!');
  } catch (error) {
    console.error('❌ Error adding deadlines:', error);
    throw error;
  }
}

addStageDeadlines();
