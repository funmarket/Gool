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
    where: { slug: 'hooma-central' },
    update: {},
    create: {
      slug: 'hooma-central',
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
  const place =
    (await prisma.place.findFirst({
      where: { communityId: community.id, name: 'Arena Cafe', deletedAt: null },
    })) ??
    (await prisma.place.create({
      data: {
        communityId: community.id,
        createdByUserId: user.id,
        name: 'Arena Cafe',
        category: 'Sports cafe & lounge',
        description: 'Local spot for live matches, food, and watch-night energy.',
        address: 'Demo City, Houma: Central',
        city: 'Demo City',
        houma: 'Central',
        latitude: 36.8065,
        longitude: 10.1815,
        phone: '+216 71 980 123',
        email: 'hello@arenacafe.test',
        photoUrl:
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
        status: 'OWNER_CLAIMED',
      },
    }));
  if (!(await prisma.placeMenuItem.findFirst({ where: { placeId: place.id, deletedAt: null } }))) {
    await prisma.placeMenuItem.createMany({
      data: [
        { placeId: place.id, name: 'Espresso', priceLabel: '4 TND', sortOrder: 0 },
        { placeId: place.id, name: 'Mint Tea', priceLabel: '4 TND', sortOrder: 1 },
        { placeId: place.id, name: 'Pizza', priceLabel: '18 TND', sortOrder: 2 },
        { placeId: place.id, name: 'Sandwich', priceLabel: '12 TND', sortOrder: 3 },
      ],
    });
  }
  let fanHub =
    (await prisma.fanHub.findFirst({
      where: { communityId: community.id, venueName: 'HOOMA Fan Hub' },
    })) ??
    (await prisma.fanHub.create({
      data: {
        placeId: place.id,
        communityId: community.id,
        createdByUserId: user.id,
        name: place.name,
        venueName: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
      },
    }));
  if (fanHub.placeId !== place.id) {
    fanHub = await prisma.fanHub.update({
      where: { id: fanHub.id },
      data: {
        placeId: place.id,
        name: place.name,
        venueName: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
      },
    });
  }
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
          venueName: fanHub.venueName,
          address: fanHub.address,
          latitude: fanHub.latitude,
          longitude: fanHub.longitude,
          capacity: 80,
          waitlistEnabled: true,
          cashRsvpPolicy: 'CONFIRM_IMMEDIATELY',
          watchDetails: homeTicketEvent.watchDetails
            ? {
                update: {
                  homeClubId: real.id,
                  awayClubId: barca.id,
                  fanHubId: fanHub.id,
                },
              }
            : {
                create: {
                  homeClubId: real.id,
                  awayClubId: barca.id,
                  fanHubId: fanHub.id,
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
          venueName: fanHub.venueName,
          address: fanHub.address,
          latitude: fanHub.latitude,
          longitude: fanHub.longitude,
          capacity: 80,
          waitlistEnabled: true,
          cashRsvpPolicy: 'CONFIRM_IMMEDIATELY',
          watchDetails: {
            create: {
              homeClubId: real.id,
              awayClubId: barca.id,
              fanHubId: fanHub.id,
            },
          },
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
        venueName: fanHub.venueName,
        address: fanHub.address,
        latitude: fanHub.latitude,
        longitude: fanHub.longitude,
        capacity: 80,
        watchDetails: {
          create: {
            homeClubId: barca.id,
            awayClubId: real.id,
            fanHubId: fanHub.id,
          },
        },
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
