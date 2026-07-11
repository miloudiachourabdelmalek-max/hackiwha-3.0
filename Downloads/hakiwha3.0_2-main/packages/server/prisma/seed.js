const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateDailyMetrics(campaign, startDate, days) {
  const baseCPC = { "SA": 0.85, "AE": 1.10, "FR": 0.95, "DZ": 0.35, "MA": 0.40, "TN": 0.38, "EG": 0.30, "TR": 0.55 };
  const baseConvRate = { "PERFORMANCE_MAX": 0.035, "SEARCH": 0.045, "SHOPPING": 0.04, "DISPLAY": 0.015, "VIDEO": 0.025 };
  const cpc = baseCPC[campaign.country] || 0.60;
  const convRate = baseConvRate[campaign.type] || 0.03;
  const avgOrderValue = campaign.aov || 65;

  const metrics = [];
  const d = new Date(startDate);

  for (let i = 0; i < days; i++) {
    const date = new Date(d);
    date.setDate(d.getDate() + i);

    const dayOfWeek = date.getDay();
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.25 : 1.0;
    const trendBoost = 1 + (i / days) * 0.15;

    const dailyBudget = campaign.dailyBudget * weekendBoost * trendBoost * (0.85 + Math.random() * 0.3);
    const clicks = Math.max(10, Math.floor(dailyBudget / cpc));
    const impressions = Math.floor(clicks / (0.015 + Math.random() * 0.04));
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
    const conversions = Math.floor(clicks * convRate * (0.7 + Math.random() * 0.6));
    const cost = Math.round(dailyBudget * 100) / 100;
    const revenue = Math.round(conversions * avgOrderValue * (0.8 + Math.random() * 0.4) * 100) / 100;
    const roas = cost > 0 ? Math.round((revenue / cost) * 100) / 100 : 0;
    const cpa = conversions > 0 ? Math.round((cost / conversions) * 100) / 100 : null;
    const convRatePct = clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0;
    const cpcActual = clicks > 0 ? Math.round((cost / clicks) * 100) / 100 : 0;

    metrics.push({ date, clicks, impressions, ctr, cost, conversions, revenue, roas, cpa, convRate: convRatePct, cpc: cpcActual });
  }
  return metrics;
}

async function main() {
  console.log("Seeding database...");

  await prisma.comment.deleteMany();
  await prisma.experimentTag.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.assetMetric.deleteMany();
  await prisma.campaignMetric.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetGroup.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.googleAccount.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: { id: uuidv4(), name: "Noon Style", slug: "noon-style", plan: "PREMIUM", logo: "https://storage.admind.dev/logos/noon-style.png" },
  });

  const passwordHash = await bcrypt.hash("password123", 12);

  const owner = await prisma.user.create({
    data: { id: uuidv4(), email: "admin@noonstyle.com", password: passwordHash, name: "Lina Khoury", role: "OWNER", organizationId: org.id, avatar: "https://storage.admind.dev/avatars/lina.jpg" },
  });
  const analyst = await prisma.user.create({
    data: { id: uuidv4(), email: "analyst@noonstyle.com", password: passwordHash, name: "Ahmed Benali", role: "ANALYST", organizationId: org.id },
  });
  const manager = await prisma.user.create({
    data: { id: uuidv4(), email: "manager@noonstyle.com", password: passwordHash, name: "Marie Dupont", role: "MANAGER", organizationId: org.id },
  });

  console.log("Created org + 3 users");

  const campaignData = [
    { name: "PMax SA - Premium Sneakers", country: "SA", type: "PERFORMANCE_MAX", dailyBudget: 380, totalBudget: 11400, status: "ACTIVE", aov: 89, startDate: -45 },
    { name: "Search FR - Running Collection", country: "FR", type: "SEARCH", dailyBudget: 220, totalBudget: 6600, status: "ACTIVE", aov: 78, startDate: -38 },
    { name: "PMax DZ - Streetwear Essentials", country: "DZ", type: "PERFORMANCE_MAX", dailyBudget: 150, totalBudget: 4500, status: "ACTIVE", aov: 52, startDate: -30 },
    { name: "Shopping MA - Sport Accessories", country: "MA", type: "SHOPPING", dailyBudget: 85, totalBudget: 2550, status: "ACTIVE", aov: 45, startDate: -28 },
    { name: "PMax TN - Urban Backpacks", country: "TN", type: "PERFORMANCE_MAX", dailyBudget: 65, totalBudget: 1950, status: "ACTIVE", aov: 55, startDate: -25 },
    { name: "Video AE - Summer Collection", country: "AE", type: "VIDEO", dailyBudget: 175, totalBudget: 5250, status: "PAUSED", aov: 95, startDate: -50 },
    { name: "Display EG - Fitness Wear", country: "EG", type: "DISPLAY", dailyBudget: 110, totalBudget: 3300, status: "PAUSED", aov: 38, startDate: -42 },
    { name: "PMax TR - Smart Watches", country: "TR", type: "PERFORMANCE_MAX", dailyBudget: 130, totalBudget: 3900, status: "ACTIVE", aov: 72, startDate: -20 },
    { name: "PMax SA - Wireless Earbuds", country: "SA", type: "PERFORMANCE_MAX", dailyBudget: 290, totalBudget: 8700, status: "ACTIVE", aov: 65, startDate: -35 },
    { name: "Search FR - Premium Sunglasses", country: "FR", type: "SEARCH", dailyBudget: 145, totalBudget: 4350, status: "ACTIVE", aov: 120, startDate: -22 },
    { name: "PMax DZ - Winter Jackets", country: "DZ", type: "PERFORMANCE_MAX", dailyBudget: 95, totalBudget: 2850, status: "COMPLETED", aov: 68, startDate: -65 },
    { name: "PMax AE - Fitness Trackers", country: "AE", type: "PERFORMANCE_MAX", dailyBudget: 210, totalBudget: 6300, status: "ACTIVE", aov: 82, startDate: -18 },
  ];

  const now = new Date();
  const campaigns = [];
  const allAssets = [];

  for (const cd of campaignData) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + cd.startDate);

    const campaign = await prisma.campaign.create({
      data: {
        id: uuidv4(), organizationId: org.id, name: cd.name, type: cd.type,
        status: cd.status, country: cd.country,
        dailyBudget: cd.dailyBudget, totalBudget: cd.totalBudget,
        startDate, currency: "USD",
      },
    });

    const ag = await prisma.assetGroup.create({
      data: { id: uuidv4(), campaignId: campaign.id, name: `AG - ${cd.name}`, status: "ACTIVE" },
    });

    const campaignAssets = [];

    const headlines = [
      `Premium ${cd.name.split(" - ")[1]} — Free Shipping`,
      `Shop the Best ${cd.name.split(" - ")[1]} Deals`,
      `Rated #1 in ${cd.country} — Order Now`,
      `New Arrivals: ${cd.name.split(" - ")[1]}`,
      `Limited Offer: Save 20% Today`,
      `${cd.name.split(" - ")[1]} — Trusted by 10K+ Customers`,
    ].slice(0, 4 + Math.floor(Math.random() * 3));

    for (const h of headlines) {
      const asset = await prisma.asset.create({
        data: { id: uuidv4(), assetGroupId: ag.id, type: "HEADLINE", content: h, status: "ACTIVE" },
      });
      campaignAssets.push(asset);
    }

    const longHeadlines = [
      `Discover our premium ${cd.name.split(" - ")[1].toLowerCase()} collection with free express shipping to ${cd.country}`,
      `Shop now and join 10,000+ happy customers across MENA who trust our quality`,
      `Rated 4.8/5 stars — see why ${cd.country} customers love our products`,
    ];
    for (const lh of longHeadlines) {
      const asset = await prisma.asset.create({
        data: { id: uuidv4(), assetGroupId: ag.id, type: "LONG_HEADLINE", content: lh, status: "ACTIVE" },
      });
      campaignAssets.push(asset);
    }

    const descriptions = [
      "Free shipping + 30-day returns. Shop confidently.",
      "Premium quality at honest prices. Order today, receive in 2-3 days.",
      "Over 10,000 five-star reviews. See why customers keep coming back.",
      "New collection just dropped — limited stock available now.",
    ];
    for (const d of descriptions) {
      const asset = await prisma.asset.create({
        data: { id: uuidv4(), assetGroupId: ag.id, type: "DESCRIPTION", content: d, status: "ACTIVE" },
      });
      campaignAssets.push(asset);
    }

    for (let i = 0; i < 3; i++) {
      const asset = await prisma.asset.create({
        data: {
          id: uuidv4(), assetGroupId: ag.id, type: "IMAGE",
          content: `Lifestyle photo ${i + 1} — ${cd.name.split(" - ")[1]} in ${cd.country}`,
          url: `https://storage.admind.dev/assets/${cd.country.toLowerCase()}-${cd.name.toLowerCase().replace(/\s+/g, "-")}-img${i + 1}.jpg`,
          status: "ACTIVE",
        },
      });
      campaignAssets.push(asset);
    }

    if (Math.random() > 0.25) {
      const asset = await prisma.asset.create({
        data: {
          id: uuidv4(), assetGroupId: ag.id, type: "VIDEO",
          content: `Product demo — ${cd.name.split(" - ")[1]}`,
          url: `https://storage.admind.dev/assets/${cd.country.toLowerCase()}-video-${cd.name.toLowerCase().replace(/\s+/g, "-")}.mp4`,
          status: "ACTIVE",
        },
      });
      campaignAssets.push(asset);
    }

    const logo = await prisma.asset.create({
      data: { id: uuidv4(), assetGroupId: ag.id, type: "LOGO", content: "Noon Style Logo", url: "https://storage.admind.dev/logos/noon-style.png", status: "ACTIVE" },
    });
    campaignAssets.push(logo);

    const landing = await prisma.asset.create({
      data: {
        id: uuidv4(), assetGroupId: ag.id, type: "LANDING_PAGE",
        content: `https://noonstyle.com/${cd.country.toLowerCase()}/${cd.name.split(" - ")[1].toLowerCase().replace(/\s+/g, "-")}`,
        status: "ACTIVE",
      },
    });
    campaignAssets.push(landing);

    const product = await prisma.asset.create({
      data: { id: uuidv4(), assetGroupId: ag.id, type: "PRODUCT", content: cd.name.split(" - ")[1], status: "ACTIVE" },
    });
    campaignAssets.push(product);

    allAssets.push(...campaignAssets.map((a) => ({ ...a, campaignId: campaign.id })));

    const metricDate = new Date(now);
    metricDate.setDate(metricDate.getDate() - 30);
    const dailyMetrics = generateDailyMetrics(cd, metricDate, 30);

    for (const dm of dailyMetrics) {
      await prisma.campaignMetric.create({
        data: {
          id: uuidv4(), campaignId: campaign.id, date: dm.date,
          clicks: dm.clicks, impressions: dm.impressions, conversions: dm.conversions,
          cost: dm.cost, revenue: dm.revenue, roas: dm.roas,
          cpa: dm.cpa, ctr: dm.ctr, cpc: dm.cpc, convRate: dm.convRate,
        },
      });
    }

    for (const asset of campaignAssets) {
      if (Math.random() > 0.35) {
        const aClicks = Math.floor(Math.random() * 150) + 5;
        const aImpressions = Math.floor(aClicks / (Math.random() * 0.06 + 0.01));
        const aCtr = aImpressions > 0 ? Math.round((aClicks / aImpressions) * 10000) / 100 : 0;
        const aCost = randomBetween(30, 400);
        const aConv = Math.floor(aClicks * (Math.random() * 0.04 + 0.005));
        const aRev = Math.round(aConv * cd.aov * (0.8 + Math.random() * 0.4) * 100) / 100;
        const aRoas = aCost > 0 ? Math.round((aRev / aCost) * 100) / 100 : 0;
        const aConvRate = aClicks > 0 ? Math.round((aConv / aClicks) * 10000) / 100 : 0;

        await prisma.assetMetric.create({
          data: {
            id: uuidv4(), assetId: asset.id, campaignId: campaign.id,
            clicks: aClicks, impressions: aImpressions,
            conversions: aConv, cost: aCost, revenue: aRev,
            roas: aRoas, ctr: aCtr, convRate: aConvRate,
          },
        });
      }
    }

    campaigns.push(campaign);
  }

  console.log(`Created ${campaigns.length} campaigns with assets and metrics`);

  const experimentData = [
    {
      title: "UGC Video vs Static — SA Premium Sneakers",
      country: "SA", product: "Premium Sneakers", category: "Footwear",
      budget: 3000, actualSpend: 2850, roas: 5.3, cpa: 14.20, revenue: 15105, profit: 12255,
      result: "WINNER", creativeType: "UGC Video", audience: "Similar - High Value",
      lessonsLearned: "UGC videos featuring real customers in Saudi settings outperformed studio content by 2.1x. Local dialect captions increased watch-through rate by 45%.",
      mistakes: "Initial test used English-only captions which limited reach to expat audience only.",
      recommendations: "Always create Arabic-first UGC content for SA. Include local landmarks and cultural references.",
    },
    {
      title: "Audience Segmentation — FR Running Collection",
      country: "FR", product: "Running Collection", category: "Footwear",
      budget: 4500, actualSpend: 4200, roas: 3.6, cpa: 22.50, revenue: 15120, profit: 10920,
      result: "WINNER", creativeType: "Motion Graphics", audience: "In-Market - Sports & Fitness",
      lessonsLearned: "In-Market audiences converted 2.4x better than Affinity for running products. French-localized landing pages reduced bounce rate by 35%.",
      mistakes: "Spent first $800 on broad targeting before narrowing. That $800 had 1.2x ROAS vs 4.8x after optimization.",
      recommendations: "Start with In-Market audiences from day one. Always A/B test audience segments with $200 test budgets.",
    },
    {
      title: "Price Sensitivity — MA Sport Accessories",
      country: "MA", product: "Sport Accessories", category: "Accessories",
      budget: 1800, actualSpend: 1750, roas: 2.3, cpa: 31.80, revenue: 4025, profit: 2275,
      result: "BREAK_EVEN", creativeType: "Carousel", audience: "Interest - Fitness",
      lessonsLearned: "MA customers are highly price-sensitive. Products under 200 MAD convert 3x better than premium items. Free shipping is the #1 conversion driver.",
      mistakes: "Featured premium products ($80+ price point) in a market where average order value is $35. Landing page load time was 4.1s on mobile.",
      recommendations: "Lead with entry-level products in MA. Offer installment payment options. Optimize page load to under 2s.",
    },
    {
      title: "Retargeting Win — TN Urban Backpacks",
      country: "TN", product: "Urban Backpacks", category: "Accessories",
      budget: 1500, actualSpend: 1400, roas: 6.8, cpa: 7.90, revenue: 9520, profit: 8120,
      result: "WINNER", creativeType: "Short Video", audience: "Custom - Website Visitors 30d",
      lessonsLearned: "Retargeting website visitors within 30 days generates 4.2x higher ROAS than cold campaigns. Short 15s product videos had 3x higher engagement than static.",
      mistakes: "Forgot to exclude past purchasers for the first 5 days, wasting ~12% of budget on existing customers.",
      recommendations: "Always set up exclusion audiences first. Test 15s vs 30s video lengths. TN retargeting is your most efficient channel.",
    },
    {
      title: "Market Entry Test — EG Fitness Wear",
      country: "EG", product: "Fitness Wear", category: "Apparel",
      budget: 2500, actualSpend: 2400, roas: 1.3, cpa: 42.00, revenue: 3120, profit: 720,
      result: "FAIL", creativeType: "Static Image", audience: "Demographic - 25-44 Male",
      lessonsLearned: "EG market requires Arabic-first creatives and culturally relevant imagery. Using European models and English copy resulted in very low engagement. Ramadan period saw 40% higher engagement but we weren't prepared.",
      mistakes: "Launched without Arabic landing page. Used stock photos instead of authentic content. No local payment methods (Fawry, Vodafone Cash).",
      recommendations: "Partner with a local creative agency. Add Arabic landing pages. Include local payment methods. Test during Ramadan with $500 budget first.",
    },
    {
      title: "Scale Test — SA Wireless Earbuds",
      country: "SA", product: "Wireless Earbuds", category: "Electronics",
      budget: 8700, actualSpend: 8400, roas: 4.5, cpa: 16.80, revenue: 37800, profit: 29400,
      result: "WINNER", creativeType: "UGC Video", audience: "Similar - High Value",
      lessonsLearned: "SA market scales well for electronics. Budget increases of 20% every 4 days maintained stable CPA. Enhanced Conversions improved tracking accuracy by 28%.",
      mistakes: "First 3 days had no conversion tracking due to missing Enhanced Conversions setup. Lost ~15% attribution data.",
      recommendations: "Always set up Enhanced Conversions before launching. SA is your best scaling market — increase allocation by 30%.",
    },
    {
      title: "Creative Refresh — AE Summer Collection",
      country: "AE", product: "Summer Collection", category: "Apparel",
      budget: 5250, actualSpend: 5200, roas: 1.9, cpa: 36.50, revenue: 9880, profit: 4680,
      result: "FAIL", creativeType: "Static Image", audience: "Affinity - Tech Enthusiasts",
      lessonsLearned: "Wrong audience entirely — fashion products need lifestyle audiences, not tech enthusiasts. Creative fatigue set in after 12 days causing CTR to drop 60%.",
      mistakes: "Used Tech Enthusiasts audience for fashion products. Did not refresh creatives for 3 weeks. Budget was spread too thin across 3 ad groups.",
      recommendations: "Switch to In-Market - Fashion and Affinity - Lifestyle audiences. Refresh creatives every 14 days. Consolidate ad groups for better learning.",
    },
    {
      title: "Video Format — TR Smart Watches",
      country: "TR", product: "Smart Watches", category: "Electronics",
      budget: 3900, actualSpend: 3600, roas: 3.9, cpa: 19.20, revenue: 14040, profit: 10440,
      result: "WINNER", creativeType: "Short Video", audience: "Demographic - 25-44 Male",
      lessonsLearned: "Short video (15-30s) format drives 2.3x higher engagement than static in TR. Conversion objective outperformed Traffic objective by 3.1x.",
      mistakes: "Campaign initially set up as Brand Awareness instead of Conversions, wasting first $600 on non-actionable impressions.",
      recommendations: "Always use Conversion objective for direct response in TR. Video format is essential. Test Turkish-localized voiceover for better retention.",
    },
    {
      title: "Bundle Strategy — DZ Winter Jackets",
      country: "DZ", product: "Winter Jackets", category: "Apparel",
      budget: 2850, actualSpend: 2700, roas: 2.6, cpa: 24.50, revenue: 7020, profit: 4320,
      result: "BREAK_EVEN", creativeType: "Carousel", audience: "Lookalike - Purchasers",
      lessonsLearned: "Bundle offers increased AOV by 32% but reduced conversion rate by 15%. Mobile UX on bundle page was poor — lost estimated 20% of potential conversions.",
      mistakes: "Bundle landing page was desktop-first design, not mobile-optimized. 78% of DZ traffic is mobile. Page load was 4.8s on 3G.",
      recommendations: "Redesign bundle page mobile-first. Test bundle vs single product separately. DZ winter season is short — plan campaigns for Oct-Jan only.",
    },
    {
      title: "Competitor Conquest — FR Premium Sunglasses",
      country: "FR", product: "Premium Sunglasses", category: "Accessories",
      budget: 4350, actualSpend: 4100, roas: 3.2, cpa: 18.90, revenue: 13120, profit: 9020,
      result: "WINNER", creativeType: "Motion Graphics", audience: "In-Market - Fashion",
      lessonsLearned: "Competitor conquesting using custom intent audiences (based on competitor URLs) drove 40% of conversions. French market responds well to premium positioning.",
      mistakes: "Initially used competitor brand names in ad copy — Google disapproved ads. Had to rewrite all headlines.",
      recommendations: "Use competitor URLs as custom intent, never brand keywords. Position as premium alternative. FR sunglasses market peaks May-August.",
    },
  ];

  const experiments = [];
  for (const ed of experimentData) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 45 + 10));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 20 + 7));

    const experiment = await prisma.experiment.create({
      data: {
        id: uuidv4(), organizationId: org.id,
        authorId: randomFrom([owner.id, analyst.id, manager.id]),
        campaignId: randomFrom(campaigns).id,
        title: ed.title, country: ed.country,
        industry: "E-commerce",
        product: ed.product, category: ed.category,
        budget: ed.budget, actualSpend: ed.actualSpend,
        roas: ed.roas, cpa: ed.cpa, revenue: ed.revenue, profit: ed.profit,
        startDate, endDate,
        creativeType: ed.creativeType, audience: ed.audience, result: ed.result,
        lessonsLearned: ed.lessonsLearned, mistakes: ed.mistakes, recommendations: ed.recommendations,
        description: `Test of ${ed.product} in ${ed.country} using ${ed.creativeType} targeting ${ed.audience}. Budget: $${ed.budget.toLocaleString()}, ROAS: ${ed.roas}x, Result: ${ed.result}.`,
      },
    });

    const tags = [ed.country, ed.product, ed.result, ed.creativeType, ed.category];
    await prisma.experimentTag.createMany({
      data: tags.map((tag) => ({ id: uuidv4(), experimentId: experiment.id, tag })),
    });
    experiments.push(experiment);
  }

  console.log(`Created ${experiments.length} experiments`);

  const memoryData = [
    { title: "Always localize creatives for MENA markets", content: "Using European creatives in MENA markets results in 3-5x higher CPA. Every market needs localized content — Arabic-first for SA, EG, DZ; French/Arabic bilingual for MA, TN; Turkish for TR.", type: "LESSON" },
    { title: "Landing page speed directly impacts CPA", content: "A 4s load time vs 1.5s increases CPA by 27%. Target under 2s for mobile. 78% of MENA traffic is mobile — desktop-first design loses conversions.", type: "BEST_PRACTICE" },
    { title: "Don't scale budgets too fast", content: "Doubling budget overnight caused 40% increase in CPA in SA. Scale by max 20% every 3-4 days to maintain algorithmic stability. Let the learning phase complete.", type: "MISTAKE" },
    { title: "UGC outperforms studio content 3:1", content: "User-generated content consistently outperforms professional studio content across all MENA markets. Authentic, relatable content drives higher engagement and trust.", type: "INSIGHT" },
    { title: "Exclude past purchasers from retargeting", content: "Always create exclusion audiences. We wasted ~12% of TN retargeting budget on existing customers in the first 5 days before fixing it.", type: "MISTAKE" },
    { title: "Saudi Arabia is our highest potential market", content: "SA shows consistent ROAS above 4.5x with excellent scale potential for fitness tech and fashion. Vision 2030 driving massive digital adoption. Increase allocation by 30%.", type: "INSIGHT" },
    { title: "Test with small budget before expanding", content: "Always test a new market with $500-$1,000 before committing larger budgets. EG market entry cost us $2,400 before we learned the market needs a completely different approach.", type: "RECOMMENDATION" },
    { title: "In-Market audiences for electronics", content: "In-Market audiences convert 2.3x better than Affinity audiences for premium electronics in FR and SA. Start with In-Market, then expand to Affinity only if scale is needed.", type: "BEST_PRACTICE" },
    { title: "Retargeting is the most efficient channel in TN", content: "Website Visitors 30d retargeting audience in TN generates 6.8x ROAS. Always set up exclusion audiences and use 15s short video format.", type: "INSIGHT" },
    { title: "Creative refresh every 14 days", content: "Creative fatigue sets in after ~12-14 days across all markets. AE Summer campaign lost 60% CTR after 3 weeks without refresh. Maintain 3-4 active variants per ad group.", type: "BEST_PRACTICE" },
  ];

  for (const md of memoryData) {
    await prisma.memory.create({
      data: {
        id: uuidv4(), organizationId: org.id, authorId: owner.id,
        experimentId: randomFrom(experiments).id,
        title: md.title, content: md.content, type: md.type,
      },
    });
  }

  console.log("Created 10 marketing memories");
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
