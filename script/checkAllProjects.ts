import { db } from '../server/db.js';
import { realEstateProjects } from '../shared/schema.js';

const projects = await db.select({
  title: realEstateProjects.title,
  slug: realEstateProjects.slug,
  currentStage: realEstateProjects.currentStage,
  totalCapacity: realEstateProjects.totalCapacity,
  waitingListCapacity: realEstateProjects.waitingListCapacity,
}).from(realEstateProjects);

console.log('\n📊 סטטוס FIFO בכל הפרויקטים:\n');
console.log('='.repeat(80));

projects.forEach((p, i) => {
  const hasFIFO = p.totalCapacity && p.totalCapacity > 0;
  const emoji = hasFIFO ? '✅' : '❌';
  
  console.log(`${i + 1}. ${emoji} ${p.title}`);
  console.log(`   Stage: ${p.currentStage || 'לא מוגדר'} | Capacity: ${p.totalCapacity || 0} | Waiting: ${p.waitingListCapacity || 0}`);
  console.log(`   URL: http://localhost:5000/real-estate/${p.slug}`);
  console.log('');
});

const withFIFO = projects.filter(p => p.totalCapacity && p.totalCapacity > 0).length;
const total = projects.length;

console.log('='.repeat(80));
console.log(`\n📈 סיכום: ${withFIFO}/${total} פרויקטים עם FIFO מוגדר\n`);

process.exit(0);
