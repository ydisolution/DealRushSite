import { db } from '../server/db';
import { projectRegistrations, realEstateProjects } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkParticipants() {
  try {
    const [project] = await db
      .select()
      .from(realEstateProjects)
      .where(eq(realEstateProjects.slug, 'marina-south-ashkelon'))
      .limit(1);

    if (!project) {
      console.log('Project not found!');
      return;
    }

    console.log('Project:', project.title);
    console.log('Project ID:', project.id);
    console.log('---');

    const participants = await db
      .select()
      .from(projectRegistrations)
      .where(eq(projectRegistrations.projectId, project.id));

    console.log(`Total participants in DB: ${participants.length}`);
    console.log('---');

    participants.forEach((p, i) => {
      console.log(`${i + 1}. ${p.firstName} ${p.lastName}`);
      console.log(`   Phone: ${p.phone}`);
      console.log(`   Email: ${p.email}`);
      console.log(`   Status: ${p.funnelStatus}`);
      console.log(`   Queue Position: ${p.queuePosition}`);
      console.log(`   Apartment Type: ${p.selectedApartmentType}`);
      console.log(`   Created: ${p.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkParticipants();
