import { db } from '../server/db.js';
import { realEstateProjects } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function updateDemoProject() {
  const result = await db.update(realEstateProjects)
    .set({
      totalCapacity: 50,
      waitingListCapacity: 10,
      currentStage: 'PRE_REGISTRATION',
      finalRegistrationEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    .where(eq(realEstateProjects.slug, 'park-hamuoshava-pt'))
    .returning();

  console.log('✅ Updated:', result[0].title);
  console.log('Capacity:', result[0].totalCapacity, '+ Waiting:', result[0].waitingListCapacity);
  console.log('Stage:', result[0].currentStage);
  console.log('Ends:', result[0].finalRegistrationEnd?.toLocaleString('he-IL'));
  console.log('\n📍 Open: http://localhost:5000/real-estate/park-hamuoshava-pt');
}

updateDemoProject();
