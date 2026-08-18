import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { telegramUserId: '100000001' },
    update: {},
    create: {
      telegramUserId: '100000001',
      username: 'hooma_dev',
      firstName: 'HOOMA',
      lastName: 'Dev',
      profile: {
        create: { skillLevel: 'INTERMEDIATE', skillRating: 62, preferredPositions: ['CM', 'DM'] },
      },
      preference: { create: {} },
    },
  });
  const community = await prisma.community.upsert({
    where: { slug: 'gool-central' },
    update: {},
    create: {
      slug: 'gool-central',
      name: 'HOOMA Central',
      description: 'Demo football community for local development.',
      city: 'Demo City',
      visibility: 'PUBLIC',
      createdByUserId: user.id,
    },
  });
  await prisma.membership.upsert({
    where: { communityId_userId: { communityId: community.id, userId: user.id } },
    update: { role: 'OWNER', status: 'ACTIVE' },
    create: { communityId: community.id, userId: user.id, role: 'OWNER' },
  });
  await prisma.userPreference.update({
    where: { userId: user.id },
    data: { activeCommunityId: community.id },
  });
  await prisma.communityPaymentDefault.upsert({
    where: { communityId_method: { communityId: community.id, method: 'CASH' } },
    update: { enabled: true, sortOrder: 0 },
    create: { communityId: community.id, method: 'CASH', enabled: true, sortOrder: 0 },
  });
  await prisma.digitalProduct.upsert({
    where: { communityId_sku: { communityId: community.id, sku: 'SUPPORTER_BADGE' } },
    update: {
      title: 'HOOMA Supporter Badge',
      description: 'Digital supporter badge for this HOOMA community.',
      starsAmount: 100,
      active: true,
    },
    create: {
      communityId: community.id,
      sku: 'SUPPORTER_BADGE',
      title: 'HOOMA Supporter Badge',
      description: 'Digital supporter badge for this HOOMA community.',
      starsAmount: 100,
      active: true,
    },
  });
  const barca = await prisma.footballClub.upsert({
    where: { slug: 'fc-barcelona' },
    update: {},
    create: { name: 'FC Barcelona', slug: 'fc-barcelona', countryCode: 'ES' },
  });
  const real = await prisma.footballClub.upsert({
    where: { slug: 'real-madrid' },
    update: {},
    create: { name: 'Real Madrid', slug: 'real-madrid', countryCode: 'ES' },
  });
  const homeTicketStartsAt = new Date(Date.now() + 12 * 60 * 60_000);
  const homeTicketEvent = await prisma.event.findFirst({
    where: {
      communityId: community.id,
      title: 'Forza HOOMA Demo Night',
      deletedAt: null,
    },
    include: { chatRoom: true, watchDetails: true },
  });
  const homeTicket = homeTicketEvent
    ? await prisma.event.update({
        where: { id: homeTicketEvent.id },
        data: {
          type: 'WATCH',
          status: 'PUBLISHED',
          startsAt: homeTicketStartsAt,
          endsAt: new Date(homeTicketStartsAt.getTime() + 2 * 60 * 60_000),
          timezone: 'UTC',
          venueName: 'HOOMA Fan Hub',
          address: 'Demo City, Houma: Central',
          capacity: 80,
          waitlistEnabled: true,
          cashRsvpPolicy: 'CONFIRM_IMMEDIATELY',
          watchDetails: homeTicketEvent.watchDetails
            ? {
                update: {
                  homeClubId: real.id,
                  awayClubId: barca.id,
                },
              }
            : {
                create: {
                  homeClubId: real.id,
                  awayClubId: barca.id,
                },
              },
          chatRoom: homeTicketEvent.chatRoom
            ? {
                update: {
                  opensAt: new Date(homeTicketStartsAt.getTime() - 24 * 60 * 60_000),
                  closesAt: new Date(homeTicketStartsAt.getTime() + 8 * 60 * 60_000),
                },
              }
            : {
                create: {
                  opensAt: new Date(homeTicketStartsAt.getTime() - 24 * 60 * 60_000),
                  closesAt: new Date(homeTicketStartsAt.getTime() + 8 * 60 * 60_000),
                },
              },
        },
      })
    : await prisma.event.create({
        data: {
          communityId: community.id,
          createdByUserId: user.id,
          type: 'WATCH',
          title: 'Forza HOOMA Demo Night',
          description: 'Demo event for the Home ticket display.',
          startsAt: homeTicketStartsAt,
          endsAt: new Date(homeTicketStartsAt.getTime() + 2 * 60 * 60_000),
          timezone: 'UTC',
          venueName: 'HOOMA Fan Hub',
          address: 'Demo City, Houma: Central',
          capacity: 80,
          waitlistEnabled: true,
          cashRsvpPolicy: 'CONFIRM_IMMEDIATELY',
          watchDetails: { create: { homeClubId: real.id, awayClubId: barca.id } },
          chatRoom: {
            create: {
              opensAt: new Date(homeTicketStartsAt.getTime() - 24 * 60 * 60_000),
              closesAt: new Date(homeTicketStartsAt.getTime() + 8 * 60 * 60_000),
            },
          },
        },
      });
  await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId: homeTicket.id, userId: user.id } },
    update: { status: 'CONFIRMED' },
    create: { eventId: homeTicket.id, userId: user.id, status: 'CONFIRMED' },
  });
  const existingPlay = await prisma.event.findFirst({
    where: { communityId: community.id, title: 'Friday 7v7', deletedAt: null },
  });
  const play =
    existingPlay ??
    (await prisma.event.create({
      data: {
        communityId: community.id,
        createdByUserId: user.id,
        type: 'PLAY',
        title: 'Friday 7v7',
        description: 'Friendly pickup match.',
        startsAt: new Date(Date.now() + 2 * 24 * 60 * 60_000),
        endsAt: new Date(Date.now() + 2 * 24 * 60 * 60_000 + 90 * 60_000),
        timezone: 'UTC',
        venueName: 'Central Pitch',
        capacity: 14,
        waitlistEnabled: true,
        cashRsvpPolicy: 'CONFIRM_IMMEDIATELY',
        playDetails: {
          create: {
            pitchType: 'SEVEN_A_SIDE',
            skillLevel: 'MIXED',
            format: 'SEVEN_V_SEVEN',
            entryFeeMinor: 15000n,
            currency: 'TND',
            paymentRequired: true,
          },
        },
        paymentMethods: { create: { method: 'CASH', enabled: true, sortOrder: 0 } },
        chatRoom: {
          create: {
            opensAt: new Date(Date.now() + 24 * 60 * 60_000),
            closesAt: new Date(Date.now() + 3 * 24 * 60 * 60_000),
          },
        },
      },
    }));
  const existingWatch = await prisma.event.findFirst({
    where: { communityId: community.id, title: 'Clásico watch night', deletedAt: null },
  });
  if (!existingWatch) {
    await prisma.event.create({
      data: {
        communityId: community.id,
        createdByUserId: user.id,
        type: 'WATCH',
        title: 'Clásico watch night',
        startsAt: new Date(Date.now() + 4 * 24 * 60 * 60_000),
        timezone: 'UTC',
        venueName: 'HOOMA Fan Hub',
        capacity: 80,
        watchDetails: { create: { homeClubId: barca.id, awayClubId: real.id } },
        chatRoom: {
          create: {
            opensAt: new Date(Date.now() + 3 * 24 * 60 * 60_000),
            closesAt: new Date(Date.now() + 5 * 24 * 60 * 60_000),
          },
        },
      },
    });
  }
  console.log(`Seeded ${community.name}; home demo event ${homeTicket.id}; play event ${play.id}`);
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
