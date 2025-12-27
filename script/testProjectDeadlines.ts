import { db } from '../server/db';
import { realEstateProjects } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function testProjectDeadlines() {
  console.log('🧪 Testing project deadlines...\n');

  const slug = 'marina-south-ashkelon';
  
  const [project] = await db
    .select()
    .from(realEstateProjects)
    .where(eq(realEstateProjects.slug, slug))
    .limit(1);

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('Project:', project.title);
  console.log('Current Stage:', project.currentStage);
  console.log('\nDeadlines:');
  console.log('  Early Registration End:', project.earlyRegistrationEnd);
  console.log('  Webinar Deadline:', project.webinarDeadline);
  console.log('  Final Registration End:', project.finalRegistrationEnd);
  
  console.log('\nFull Project Data:');
  console.log(JSON.stringify(project, null, 2));
}

testProjectDeadlines();
