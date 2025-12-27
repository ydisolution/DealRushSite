import { db } from '../server/db';
import { projectRegistrations, realEstateProjects } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

async function testParticipantsQuery() {
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

    console.log('Project found:', project.title);

    const participants = await db
      .select({
        id: projectRegistrations.id,
        queuePosition: projectRegistrations.queuePosition,
        selectedApartmentType: projectRegistrations.selectedApartmentType,
        funnelStatus: projectRegistrations.funnelStatus,
        firstName: projectRegistrations.firstName,
        lastName: projectRegistrations.lastName,
        phone: projectRegistrations.phone,
        finalRegisteredAt: projectRegistrations.finalRegisteredAt,
        earlyRegisteredAt: projectRegistrations.earlyRegisteredAt,
        createdAt: projectRegistrations.createdAt,
      })
      .from(projectRegistrations)
      .where(and(
        eq(projectRegistrations.projectId, project.id),
        sql`${projectRegistrations.funnelStatus} IN ('PRE_REGISTERED', 'CONFIRMED_PARTICIPANT', 'WAITING_LIST')`
      ))
      .orderBy(projectRegistrations.createdAt);

    console.log('Raw participants:', participants.length);

    const publicParticipants = participants.map(p => ({
      queuePosition: p.queuePosition,
      initials: `${p.firstName?.charAt(0) || ''}${p.lastName?.charAt(0) || ''}`,
      phoneLast4: p.phone?.slice(-4) || '****',
      apartmentType: p.selectedApartmentType,
      status: p.funnelStatus,
      registeredAt: p.finalRegisteredAt || p.earlyRegisteredAt || p.createdAt,
    }));

    console.log('Formatted participants:');
    console.log(JSON.stringify(publicParticipants, null, 2));

    const response = {
      participants: publicParticipants,
      totalConfirmed: publicParticipants.filter(p => p.status === 'CONFIRMED_PARTICIPANT').length,
      totalWaitingList: publicParticipants.filter(p => p.status === 'WAITING_LIST').length,
      capacity: project.totalCapacity,
      waitingListCapacity: project.waitingListCapacity,
    };

    console.log('\nFinal response:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testParticipantsQuery();
