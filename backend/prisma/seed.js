const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const org = await prisma.organization.create({
    data: { name: 'Raftell Demo Co', slug: 'raftell-demo' },
  });

  const user = await prisma.user.create({
    data: {
      email: 'demo@raftell.test',
      passwordHash,
      name: 'Demo User',
      memberships: { create: { role: 'OWNER', organizationId: org.id } },
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      organizationId: org.id,
      name: 'PMax - Shoes - France',
      status: 'ENABLED',
      channelType: 'PERFORMANCE_MAX',
      budgetMicros: 2000000000n, // 2000.00 in micros
      country: 'FR',
      metrics: {
        create: [
          { date: new Date('2026-06-01'), impressions: 12000, clicks: 340, conversions: 22, costMicros: 180000000n, roas: 3.2, cpaMicros: 8181000n, conversionRate: 0.065, country: 'FR' },
          { date: new Date('2026-06-02'), impressions: 13500, clicks: 355, conversions: 19, costMicros: 175000000n, roas: 2.8, cpaMicros: 9210000n, conversionRate: 0.053, country: 'FR' },
        ],
      },
    },
  });

  // A deliberate past FAILURE — this is what the "don't repeat mistakes" engine should surface
  // when someone drafts a new France/Shoes/PMax campaign.
  await prisma.experience.create({
    data: {
      organizationId: org.id,
      authorId: user.id,
      title: 'PMax Shoes France - Winter 2025 - underperformed',
      description: 'Tested broad match PMax targeting all of France for our shoe line during the winter sale.',
      hypothesis: 'Broad targeting + high budget would maximize reach and conversions during peak season.',
      country: 'FR',
      category: 'Shoes',
      industry: 'Footwear/Retail',
      platform: 'google_ads',
      budgetMicros: 1800000000n,
      spendMicros: 1750000000n,
      roas: 1.1,
      cpaMicros: 24000000n,
      profitMicros: -320000000n,
      result: 'ROAS came in well below target (1.1 vs 3.0 goal). CPA nearly 3x the acceptable threshold.',
      lessonsLearned: 'Broad national targeting diluted spend across low-intent regions. Winter sale timing overlapped with 3 competitors running the same offer.',
      mistakesMade: 'Did not segment by region; did not exclude low-converting cities from prior general retail campaigns; launched same week as a competitor flash sale without checking the calendar.',
      recommendations: 'Segment France by top 5 converting regions only. Avoid launching shoe promos in the same week as major retail flash-sale events. Start budget lower and scale on proven ROAS.',
      status: 'completed',
      tags: ['france', 'shoes', 'pmax', 'failure', 'winter-sale'],
      priority: 'high',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-31'),
    },
  });

  // A SUCCESS in a different country/category for contrast in the dashboard/search.
  await prisma.experience.create({
    data: {
      organizationId: org.id,
      authorId: user.id,
      title: 'PMax Sneakers Germany - Spring 2026 - strong ROAS',
      description: 'Regional targeting on top 5 German cities with a limited-time bundle offer.',
      country: 'DE',
      category: 'Shoes',
      industry: 'Footwear/Retail',
      platform: 'google_ads',
      budgetMicros: 1500000000n,
      spendMicros: 1490000000n,
      roas: 4.6,
      cpaMicros: 6100000n,
      profitMicros: 550000000n,
      result: 'Exceeded ROAS target; bundle offer drove higher AOV.',
      lessonsLearned: 'Regional targeting + bundle offer outperformed broad targeting significantly.',
      recommendations: 'Replicate regional-first approach before expanding nationally in any market.',
      status: 'completed',
      tags: ['germany', 'shoes', 'pmax', 'success'],
      priority: 'normal',
      campaignId: campaign.id,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    },
  });

  console.log('Seeded. Login with demo@raftell.test / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
