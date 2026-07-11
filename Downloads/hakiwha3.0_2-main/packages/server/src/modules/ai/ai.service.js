const prisma = require("../../config/database");

const FLAGS = { DZ: "🇩🇿 Algeria", FR: "🇫🇷 France", MA: "🇲🇦 Morocco", TN: "🇹🇳 Tunisia", EG: "🇪🇬 Egypt", SA: "🇸🇦 Saudi Arabia", AE: "🇦🇪 UAE", TR: "🇹🇷 Turkey" };

function fmt(n) {
  return Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

async function analyzeCampaign(orgId, campaignId) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, organizationId: orgId },
    include: {
      metrics: { orderBy: { date: "desc" }, take: 30 },
      assetGroups: { include: { assets: true } },
    },
  });
  if (!campaign) return null;

  const agg = await prisma.campaignMetric.aggregate({
    where: { campaignId },
    _sum: { cost: true, revenue: true, clicks: true, impressions: true, conversions: true },
    _avg: { roas: true, cpa: true, ctr: true, convRate: true },
  });

  const roas = Number(agg._avg.roas) || 0;
  const ctr = Number(agg._avg.ctr) || 0;
  const cpa = Number(agg._avg.cpa) || 0;
  const cost = Number(agg._sum.cost) || 0;
  const revenue = Number(agg._sum.revenue) || 0;
  const clicks = Number(agg._sum.clicks) || 0;
  const impressions = Number(agg._sum.impressions) || 0;
  const conversions = Number(agg._sum.conversions) || 0;

  let grade, sentiment;
  if (roas >= 4) { grade = "A"; sentiment = "excellent"; }
  else if (roas >= 3) { grade = "B+"; sentiment = "good"; }
  else if (roas >= 2) { grade = "B"; sentiment = "decent"; }
  else if (roas >= 1.5) { grade = "C"; sentiment = "needs improvement"; }
  else { grade = "D"; sentiment = "underperforming"; }

  const strengths = [];
  const weaknesses = [];
  if (ctr > 3) strengths.push(`Strong CTR at ${ctr.toFixed(2)}% — above the 3% benchmark`);
  else if (ctr < 1.5) weaknesses.push(`Low CTR at ${ctr.toFixed(2)}% — below the 1.5% minimum threshold`);
  if (roas > 3) strengths.push(`Excellent ROAS of ${roas.toFixed(1)}x — well above the 3x target`);
  else if (roas < 2) weaknesses.push(`ROAS of ${roas.toFixed(1)}x is below the 2x break-even threshold`);
  if (cpa > 0 && cpa < 15) strengths.push(`Efficient CPA of $${cpa.toFixed(2)} — great cost management`);
  else if (cpa > 35) weaknesses.push(`High CPA of $${cpa.toFixed(2)} — consider tightening audience targeting`);
  if (conversions > 100) strengths.push(`High conversion volume (${conversions} total) — strong funnel`);
  if (revenue > cost * 2) strengths.push(`Revenue ($${fmt(revenue)}) is ${(revenue / cost).toFixed(1)}x the spend — very profitable`);
  if (revenue < cost) weaknesses.push(`Revenue ($${fmt(revenue)}) is below spend ($${fmt(cost)}) — campaign is losing money`);

  const assetTypes = [...new Set(campaign.assetGroups.flatMap((ag) => ag.assets.map((a) => a.type)))];
  if (assetTypes.includes("VIDEO") && assetTypes.includes("IMAGE")) {
    strengths.push("Good creative diversity with both video and image assets");
  } else if (!assetTypes.includes("VIDEO")) {
    weaknesses.push("No video assets — adding video could boost engagement by 20-40%");
  }

  const trend = campaign.metrics.length >= 7;
  let trendNote = "";
  if (trend) {
    const recent = campaign.metrics.slice(0, 7);
    const older = campaign.metrics.slice(7, 14);
    if (older.length > 0) {
      const recentRev = recent.reduce((s, m) => s + Number(m.revenue), 0);
      const olderRev = older.reduce((s, m) => s + Number(m.revenue), 0);
      if (recentRev > olderRev * 1.1) trendNote = "Revenue is trending upward over the last week — keep the momentum.";
      else if (recentRev < olderRev * 0.9) trendNote = "Revenue has declined in the last week — investigate what changed.";
      else trendNote = "Performance has been stable over the last week.";
    }
  }

  const recommendations = [];
  if (ctr < 2) recommendations.push("Test new ad headlines and descriptions to improve CTR — try urgency or social proof.");
  if (roas < 3) recommendations.push("Reallocate 20-30% of budget from this campaign to your best performers.");
  if (assetTypes.length < 3) recommendations.push("Add more asset variety — aim for 5+ headlines, 3+ descriptions, and image/video mix.");
  if (conversions < 50) recommendations.push("Consider switching to a Conversions optimization goal if not already set.");
  recommendations.push("Review search term reports weekly to add negative keywords and refine targeting.");

  const country = FLAGS[campaign.country] || campaign.country;

  return {
    campaignId: campaign.id,
    analysis: {
      grade,
      sentiment,
      headline: `${campaign.name} is performing at a ${sentiment} level (${grade})`,
      summary: `Your ${campaign.type.replace("_", " ").toLowerCase()} campaign in ${country} spent $${fmt(cost)} and generated $${fmt(revenue)} in revenue with a ${roas.toFixed(1)}x ROAS, ${fmt(clicks)} clicks from ${fmt(impressions)} impressions, and ${fmt(conversions)} conversions. ${trendNote}`,
      strengths: strengths.length > 0 ? strengths : ["Campaign is live and receiving impressions"],
      weaknesses: weaknesses.length > 0 ? weaknesses : ["No critical weaknesses detected"],
      recommendations,
    },
    isAI: true,
  };
}

async function recommend(orgId, params) {
  const { product, country, budget, goal } = params;

  const pastExperiments = await prisma.experiment.findMany({
    where: { organizationId: orgId, country },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const sameProductExperiments = pastExperiments.filter((e) =>
    e.product && e.product.toLowerCase().includes(product.toLowerCase().split(" ")[0])
  );

  const memories = await prisma.memory.findMany({
    where: { organizationId: orgId },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const warnings = [];
  const insights = [];

  if (sameProductExperiments.length > 0) {
    const fails = sameProductExperiments.filter((e) => e.result === "FAIL");
    const wins = sameProductExperiments.filter((e) => e.result === "WINNER");
    if (fails.length > 0) {
      fails.forEach((e) => {
        warnings.push(`Previous ${product} test in ${country} failed (ROAS: ${e.roas}x): ${e.mistakes || "No notes recorded"}`);
      });
    }
    if (wins.length > 0) {
      wins.forEach((e) => {
        insights.push(`Previous ${product} win in ${country} (ROAS: ${e.roas}x): ${e.lessonsLearned || "No notes"}`);
      });
    }
  } else {
    const countryFails = pastExperiments.filter((e) => e.result === "FAIL");
    if (countryFails.length > 0) {
      warnings.push(`No previous ${product} tests in ${country}, but ${countryFails.length} other campaign(s) failed in this country. Proceed with caution.`);
    }
  }

  const countryExp = pastExperiments.filter((e) => e.result === "WINNER");
  if (countryExp.length > 0) {
    const avgRoas = countryExp.reduce((s, e) => s + Number(e.roas || 0), 0) / countryExp.length;
    insights.push(`Winning campaigns in ${country} average ${avgRoas.toFixed(1)}x ROAS — aim for this benchmark.`);
  }

  const relevantMemories = memories.filter((m) => {
    const text = `${m.title} ${m.content}`.toLowerCase();
    return text.includes(country.toLowerCase()) || text.includes(product.toLowerCase().split(" ")[0]);
  });

  const countryData = {
    SA: { lang: "Arabic-first", audiences: ["In-Market - High Value Shoppers", "Similar - Top Converters", "Affinity - Tech Enthusiasts"], creatives: ["UGC Video", "Short Video"], tips: ["Vision 2030 driving digital adoption", "High mobile usage — optimize for mobile", "Weekend traffic peaks Fri-Sat"] },
    AE: { lang: "Arabic/English bilingual", audiences: ["In-Market - Fashion", "Affinity - Lifestyle", "Custom - Website Visitors 30d"], creatives: ["Motion Graphics", "Carousel"], tips: ["Premium positioning works well", "High AOV potential", "Test during Ramadan for 40% lift"] },
    FR: { lang: "French-first", audiences: ["In-Market - Fashion/Sports", "Affinity - Active Lifestyles", "Custom - Cart Abandoners"], creatives: ["Motion Graphics", "UGC Video"], tips: ["French-localized landing pages essential", "In-Market audiences convert 2.4x better", "Peak season: May-August for fashion"] },
    DZ: { lang: "Arabic/French bilingual", audiences: ["Interest - Fitness", "Demographic - 25-44", "Lookalike - Purchasers"], creatives: ["Carousel", "Static Image"], tips: ["Price-sensitive market — lead with entry-level", "Mobile-first is critical (78% traffic)", "Page load must be under 2s"] },
    MA: { lang: "Arabic/French bilingual", audiences: ["Interest - Fitness/Sports", "In-Market - Accessories", "Custom - Email Subscribers"], creatives: ["Carousel", "Short Video"], tips: ["Free shipping is the #1 conversion driver", "Products under $40 convert 3x better", "Installment payment options increase AOV"] },
    TN: { lang: "Arabic/French bilingual", audiences: ["Custom - Website Visitors 30d", "In-Market - Accessories", "Similar - Purchasers"], creatives: ["Short Video", "Static Image"], tips: ["Retargeting is most efficient channel (6.8x ROAS)", "Always set up exclusion audiences", "15s video format for best engagement"] },
    EG: { lang: "Arabic-first", audiences: ["Demographic - 25-44 Male", "Interest - Fitness", "In-Market - Electronics"], creatives: ["UGC Video", "Short Video"], tips: ["Arabic-first creatives are essential", "Local payment methods needed (Fawry)", "Ramadan period sees 40% higher engagement"] },
    TR: { lang: "Turkish-first", audiences: ["Demographic - 25-44 Male", "In-Market - Electronics", "Affinity - Tech Enthusiasts"], creatives: ["Short Video", "Motion Graphics"], tips: ["Video format drives 2.3x higher engagement", "Use Conversion objective, not Traffic", "Turkish-localized voiceover improves retention"] },
  };

  const cData = countryData[country] || { lang: "Localized", audiences: ["In-Market buyers"], creatives: ["UGC Video"], tips: ["Test with small budget first"] };

  let expectedRoas;
  if (budget < 1000) expectedRoas = "2.0x - 3.0x (small budget, limited data)";
  else if (budget < 5000) expectedRoas = "3.0x - 4.5x (optimal testing range)";
  else if (budget < 15000) expectedRoas = "4.0x - 6.0x (scale-ready budget)";
  else expectedRoas = "5.0x - 7.0x (full-scale budget with strong data)";

  const goalAdvice = {
    Conversions: "Set up Enhanced Conversions before launch. Use Target CPA bidding once you have 30+ conversions.",
    ROAS: "Start with Maximize Conversion Value bidding. Set a target ROAS once the learning phase completes (7-14 days).",
    "Brand Awareness": "Use Video or Display campaigns with broad targeting. Focus on viewability and reach metrics.",
    Traffic: "Use Search or Performance Max with Maximize Clicks bidding. Set a CPC cap to control costs.",
  };

  return {
    product,
    country,
    budget,
    goal,
    recommendations: {
      assets: {
        headlines: [
          `Premium ${product} — Free Shipping to ${FLAGS[country]?.split(" ")[1] || country}`,
          `Shop the Best ${product} Deals in ${country}`,
          `${product} Trusted by 10K+ Customers in ${country}`,
          `New Arrivals: ${product} — Limited Stock`,
          `Rated #1 in ${country} — Order Now`,
        ],
        descriptions: [
          `Discover our top-rated ${product}. Fast delivery to ${country}. Money-back guarantee.`,
          `Over 10,000 five-star reviews. See why ${country} customers love our ${product}.`,
          `Shop now and join thousands of happy customers across ${FLAGS[country]?.split(" ")[1] || country}.`,
        ],
        images: [
          "UGC-style product photos with real customers in local settings",
          "Before/after comparison images showing product quality",
          `Lifestyle imagery relevant to ${country} culture and aesthetics`,
          "Close-up product detail shots with clean backgrounds",
        ],
      },
      audience: cData.audiences.join(" > "),
      creatives: cData.creatives.join(", "),
      language: cData.lang,
      countries: [country, country === "SA" ? "AE" : country === "FR" ? "MA" : "SA"],
      budgetRange: `$${fmt(budget * 0.8)} - $${fmt(budget * 1.2)} for optimal results`,
      expectedROAS: expectedRoas,
      goalAdvice: goalAdvice[goal] || "Define clear KPIs before launch.",
      tips: cData.tips,
      warnings,
      memoryInsights: relevantMemories.slice(0, 3).map((m) => m.title),
      pastInsights: insights.slice(0, 3),
    },
    isAI: true,
  };
}

async function chat(orgId, message) {
  const lower = (message || "").toLowerCase().trim();
  const words = lower.split(/\s+/);

  // Gather data upfront
  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: orgId },
    include: { metrics: { orderBy: { date: "desc" }, take: 5 } },
  });

  const campaignAggs = await prisma.campaignMetric.groupBy({
    by: ["campaignId"],
    where: { campaign: { organizationId: orgId } },
    _sum: { cost: true, revenue: true, clicks: true, impressions: true, conversions: true },
    _avg: { roas: true, cpa: true, ctr: true },
  });

  const totalAgg = await prisma.campaignMetric.aggregate({
    where: { campaign: { organizationId: orgId } },
    _sum: { cost: true, revenue: true, clicks: true, impressions: true, conversions: true },
    _avg: { roas: true, cpa: true, ctr: true, convRate: true },
  });

  const experiments = await prisma.experiment.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  const memories = await prisma.memory.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });

  const totalCost = Number(totalAgg._sum.cost) || 0;
  const totalRevenue = Number(totalAgg._sum.revenue) || 0;
  const totalConversions = Number(totalAgg._sum.conversions) || 0;
  const totalClicks = Number(totalAgg._sum.clicks) || 0;
  const avgRoas = Number(totalAgg._avg.roas) || 0;
  const avgCpa = Number(totalAgg._avg.cpa) || 0;
  const avgCtr = Number(totalAgg._avg.ctr) || 0;

  // Helper: find matching campaign
  function findCampaign(keywords) {
    return campaigns.find((c) => {
      const name = c.name.toLowerCase();
      return keywords.some((k) => name.includes(k));
    });
  }

  function findCountryCampaigns(countryCode) {
    return campaigns.filter((c) => c.country === countryCode);
  }

  function getCampRevenue(campId) {
    const agg = campaignAggs.find((a) => a.campaignId === campId);
    return agg ? Number(agg._sum.revenue) : 0;
  }

  function getCampRoas(campId) {
    const agg = campaignAggs.find((a) => a.campaignId === campId);
    return agg ? Number(agg._avg.roas) : 0;
  }

  const sources = [];

  // === GREETING ===
  if (/^(hi|hello|hey|howdy|yo|sup|help|what's up|good morning|good evening)/.test(lower)) {
    return {
      answer: `Hey there! I'm your AdMind AI assistant. I have access to all your marketing data — ${campaigns.length} campaigns, ${experiments.length} experiments, and ${memories.length} memories across ${[...new Set(campaigns.map((c) => c.country))].length} countries.\n\nHere are some things I can help with:\n• **Campaign performance** — "Which campaign is the best?"\n• **Country analysis** — "How are we doing in Saudi Arabia?"\n• **Experiments** — "What experiments did we run?"\n• **Mistakes** — "What mistakes should I avoid?"\n• **Budget** — "Where should I allocate budget?"\n• **Assets** — "Which images or headlines work best?"\n• **Recommendations** — "Recommend a campaign for France"\n\nWhat would you like to know?`,
      sources: [],
    };
  }

  // === BEST CAMPAIGN ===
  if (words.some((w) => ["best", "top", "highest", "best-performing", "winning"].includes(w))) {
    const sorted = [...campaignAggs].sort((a, b) => Number(b._sum.revenue) - Number(a._sum.revenue));
    const top3 = sorted.slice(0, 3);
    const details = await Promise.all(top3.map(async (a) => {
      const c = await prisma.campaign.findUnique({ where: { id: a.campaignId }, select: { name: true, country: true, type: true, status: true } });
      sources.push({ type: "campaign", id: a.campaignId });
      return c ? `${c.name} (${FLAGS[c.country] || c.country})` : "Unknown";
    }));

    const answer = top3.map((a, i) => {
      const rev = fmt(a._sum.revenue);
      const cost2 = fmt(a._sum.cost);
      const roas2 = Number(a._avg.roas).toFixed(1);
      const conv = fmt(a._sum.conversions);
      return `**${i + 1}. ${details[i]}**\n   Revenue: $${rev} | Spend: $${cost2} | ROAS: ${roas2}x | Conversions: ${conv}`;
    }).join("\n\n");

    const totalRev = fmt(totalRevenue);
    const pct = totalRevenue > 0 ? ((Number(top3[0]?._sum.revenue) / totalRevenue) * 100).toFixed(0) : 0;
    return {
      answer: `Your top 3 campaigns by revenue:\n\n${answer}\n\nThese 3 generate **$${fmt(top3.reduce((s, a) => s + Number(a._sum.revenue), 0))}** (${pct}% of your total $${totalRev} revenue). Keep investing in what works!`,
      sources,
    };
  }

  // === WORST / UNDERPERFORMING ===
  if (words.some((w) => ["worst", "poorly", "underperform", "bad", "losing", "lowest"].includes(w))) {
    const sorted = [...campaignAggs].sort((a, b) => Number(a._sum.revenue) - Number(b._sum.revenue));
    const bottom3 = sorted.slice(0, 3);
    const details = await Promise.all(bottom3.map(async (a) => {
      const c = await prisma.campaign.findUnique({ where: { id: a.campaignId }, select: { name: true, country: true, type: true } });
      sources.push({ type: "campaign", id: a.campaignId });
      return c ? `${c.name} (${FLAGS[c.country] || c.country})` : "Unknown";
    }));

    const answer = bottom3.map((a, i) => {
      const rev = fmt(a._sum.revenue);
      const cost2 = fmt(a._sum.cost);
      const roas2 = Number(a._avg.roas).toFixed(1);
      const profit = Number(a._sum.revenue) - Number(a._sum.cost);
      return `**${i + 1}. ${details[i]}**\n   Revenue: $${rev} | Spend: $${cost2} | ROAS: ${roas2}x | ${profit >= 0 ? "Profit" : "Loss"}: $${fmt(Math.abs(profit))}`;
    }).join("\n\n");

    return {
      answer: `Your 3 weakest campaigns:\n\n${answer}\n\n**My recommendations:**\n• Review ad creatives — they may be fatigued\n• Check audience targeting — narrow down to high-intent segments\n• Consider pausing the worst performer and redirecting budget to your top campaigns`,
      sources,
    };
  }

  // === COUNTRY-SPECIFIC ===
  const countryMap = { saudi: "SA", "saudi arabia": "SA", uae: "AE", dubai: "AE", france: "FR", algeria: "DZ", algerian: "DZ", morocco: "MA", tunisia: "TN", tunisian: "TN", egypt: "EG", egyptian: "EG", turkey: "TR", turkish: "TR" };
  const matchedCountry = Object.keys(countryMap).find((k) => lower.includes(k));

  if (matchedCountry && !words.some((w) => ["best", "worst", "top"].includes(w))) {
    const code = countryMap[matchedCountry];
    const countryCampaigns = findCountryCampaigns(code);
    const countryAggs = campaignAggs.filter((a) => countryCampaigns.some((c) => c.id === a.campaignId));
    const countryExp = experiments.filter((e) => e.country === code);

    if (countryCampaigns.length === 0) {
      return { answer: `You don't have any campaigns in ${FLAGS[code] || matchedCountry} yet. Would you like me to recommend a strategy for entering this market?`, sources: [] };
    }

    const totalRev = countryAggs.reduce((s, a) => s + Number(a._sum.revenue), 0);
    const totalCost2 = countryAggs.reduce((s, a) => s + Number(a._sum.cost), 0);
    const totalConv = countryAggs.reduce((s, a) => s + Number(a._sum.conversions), 0);
    const avgRoas2 = totalCost2 > 0 ? (totalRev / totalCost2).toFixed(1) : "0";

    countryCampaigns.forEach((c) => sources.push({ type: "campaign", id: c.id }));

    let answer = `**${FLAGS[code] || matchedCountry} Performance Overview**\n\n`;
    answer += `📊 **${countryCampaigns.length} campaigns** | $${fmt(totalRev)} revenue | $${fmt(totalCost2)} spend | ${avgRoas2}x ROAS | ${fmt(totalConv)} conversions\n\n`;
    answer += `**Active campaigns:**\n`;
    countryCampaigns.forEach((c) => {
      const agg = countryAggs.find((a) => a.campaignId === c.id);
      const r = agg ? Number(agg._avg.roas).toFixed(1) : "0";
      answer += `• ${c.name} — ${c.status} — ${r}x ROAS\n`;
    });

    if (countryExp.length > 0) {
      const wins = countryExp.filter((e) => e.result === "WINNER").length;
      const fails = countryExp.filter((e) => e.result === "FAIL").length;
      answer += `\n🧪 **${countryExp.length} experiments** (${wins} winners, ${fails} failures)\n`;
      if (countryExp[0]?.lessonsLearned) {
        answer += `💡 **Latest lesson:** ${countryExp[0].lessonsLearned.substring(0, 150)}...`;
      }
    }

    return { answer, sources };
  }

  // === MISTAKES ===
  if (words.some((w) => ["mistake", "mistakes", "repeat", "error", "avoid", "wrong", "lesson"].includes(w))) {
    const mistakeMemories = memories.filter((m) => m.type === "MISTAKE");
    const failExps = experiments.filter((e) => e.result === "FAIL");

    let answer = "";
    if (mistakeMemories.length > 0) {
      answer += `**📝 Lessons from your Marketing Memory:**\n\n`;
      mistakeMemories.slice(0, 4).forEach((m, i) => {
        answer += `${i + 1}. **${m.title}**\n   ${m.content.substring(0, 150)}${m.content.length > 150 ? "..." : ""}\n\n`;
      });
    }
    if (failExps.length > 0) {
      answer += `**❌ Failed Experiments:**\n\n`;
      failExps.slice(0, 3).forEach((e, i) => {
        answer += `${i + 1}. **${e.title}** (${FLAGS[e.country] || e.country})\n   Mistakes: ${(e.mistakes || "No details").substring(0, 120)}\n\n`;
      });
    }
    if (!answer) answer = "No recorded mistakes yet. Keep experimenting and documenting!";

    return { answer, sources };
  }

  // === EXPERIMENTS / TESTS ===
  if (words.some((w) => ["experiment", "experiments", "test", "tests", "a/b", "ab test", "testing"].includes(w))) {
    const wins = experiments.filter((e) => e.result === "WINNER").length;
    const fails = experiments.filter((e) => e.result === "FAIL").length;
    const breakeven = experiments.filter((e) => e.result === "BREAK_EVEN").length;
    const totalBudget = experiments.reduce((s, e) => s + Number(e.budget || 0), 0);
    const totalProfit = experiments.reduce((s, e) => s + Number(e.profit || 0), 0);

    let answer = `**🧪 Experiment Summary**\n\n`;
    answer += `You've run **${experiments.length} experiments** across ${[...new Set(experiments.map((e) => e.country))].length} countries.\n\n`;
    answer += `• 🏆 Winners: ${wins} (${experiments.length > 0 ? Math.round((wins / experiments.length) * 100) : 0}% win rate)\n`;
    answer += `• ❌ Failed: ${fails}\n`;
    answer += `• ⚖️ Break-even: ${breakeven}\n`;
    answer += `• 💰 Total budget: $${fmt(totalBudget)} | Profit: $${fmt(totalProfit)}\n\n`;

    if (experiments.length > 0) {
      answer += `**Latest experiments:**\n`;
      experiments.slice(0, 4).forEach((e) => {
        const icon = e.result === "WINNER" ? "🏆" : e.result === "FAIL" ? "❌" : "⚖️";
        answer += `${icon} ${e.title} — ROAS: ${e.roas}x, Result: ${e.result}\n`;
      });
    }

    return { answer, sources };
  }

  // === BUDGET / SPEND / ALLOCATE ===
  if (words.some((w) => ["budget", "spend", "allocate", "invest", "money", "cost", "funding"].includes(w))) {
    const byCountry = {};
    campaignAggs.forEach((a) => {
      const camp = campaigns.find((c) => c.id === a.campaignId);
      if (!camp) return;
      if (!byCountry[camp.country]) byCountry[camp.country] = { revenue: 0, cost: 0, count: 0, roas: [] };
      byCountry[camp.country].revenue += Number(a._sum.revenue);
      byCountry[camp.country].cost += Number(a._sum.cost);
      byCountry[camp.country].count++;
      if (Number(a._sum.cost) > 0) byCountry[camp.country].roas.push(Number(a._sum.revenue) / Number(a._sum.cost));
    });

    let answer = `**💰 Budget Analysis**\n\n`;
    answer += `Total spend: **$${fmt(totalCost)}** → Revenue: **$${fmt(totalRevenue)}** → ROAS: **${avgRoas.toFixed(1)}x**\n\n`;
    answer += `**By country:**\n`;

    const sorted = Object.entries(byCountry).sort((a, b) => b[1].revenue - a[1].revenue);
    sorted.forEach(([code, data]) => {
      const avgR = data.roas.length > 0 ? (data.roas.reduce((s, r) => s + r, 0) / data.roas.length).toFixed(1) : "0";
      const emoji = Number(avgR) >= 3 ? "🟢" : Number(avgR) >= 2 ? "🟡" : "🔴";
      answer += `${emoji} ${FLAGS[code] || code}: $${fmt(data.cost)} spend → $${fmt(data.revenue)} revenue (${avgR}x ROAS, ${data.count} campaigns)\n`;
    });

    answer += `\n**Recommendation:**`;
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best && worst && best[0] !== worst[0]) {
      answer += ` Move 15-20% of budget from ${FLAGS[worst[0]] || worst[0]} (lower ROAS) to ${FLAGS[best[0]] || best[0]} (higher ROAS) for better returns.`;
    } else {
      answer += ` Your campaigns are fairly balanced. Consider testing a new market or increasing budget on your top performer.`;
    }

    return { answer, sources };
  }

  // === ASSETS / IMAGES / CREATIVES ===
  if (words.some((w) => ["image", "images", "creative", "creatives", "asset", "assets", "photo", "video", "headline", "description", "ad copy"].includes(w))) {
    const assets = await prisma.asset.findMany({
      where: { assetGroup: { campaign: { organizationId: orgId } } },
      include: { assetMetrics: true },
    });

    const typeCounts = {};
    assets.forEach((a) => {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    });

    let answer = `**🖼 Asset Overview**\n\n`;
    answer += `You have **${assets.length} assets** across your campaigns:\n\n`;
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      answer += `• ${type.replace("_", " ")}: ${count}\n`;
    });

    const bestAssets = await prisma.assetMetric.groupBy({
      by: ["assetId"],
      where: { campaign: { organizationId: orgId } },
      _sum: { revenue: true, clicks: true },
      _avg: { ctr: true, roas: true },
      orderBy: { _sum: { revenue: "desc" } },
      take: 3,
    });

    if (bestAssets.length > 0) {
      answer += `\n**Top performing assets by revenue:**\n`;
      for (const ba of bestAssets) {
        const asset = await prisma.asset.findUnique({ where: { id: ba.assetId }, select: { type: true, content: true } });
        if (asset) {
          const snippet = (asset.content || "").substring(0, 60);
          answer += `• **${asset.type}**: "${snippet}..." — $${fmt(ba._sum.revenue)} revenue, ${Number(ba._avg.ctr || 0).toFixed(2)}% CTR\n`;
          sources.push({ type: "asset", id: ba.assetId });
        }
      }
    }

    answer += `\n**💡 Tip:** Maintain 5+ headlines, 3+ descriptions, and a mix of image + video for best performance. Refresh creatives every 14 days to avoid fatigue.`;

    return { answer, sources };
  }

  // === SUMMARY / OVERVIEW / PERFORMANCE ===
  if (words.some((w) => ["summary", "overview", "performance", "how", "doing", "stats", "numbers", "report"].includes(w))) {
    const profit = totalRevenue - totalCost;
    const convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0;

    let answer = `**📊 Performance Overview**\n\n`;
    answer += `**Financial:**\n`;
    answer += `• Total Spend: $${fmt(totalCost)}\n`;
    answer += `• Total Revenue: $${fmt(totalRevenue)}\n`;
    answer += `• Net ${profit >= 0 ? "Profit" : "Loss"}: $${fmt(Math.abs(profit))}\n`;
    answer += `• ROAS: ${avgRoas.toFixed(2)}x\n\n`;
    answer += `**Traffic:**\n`;
    answer += `• Impressions: ${fmt(totalAgg._sum.impressions)}\n`;
    answer += `• Clicks: ${fmt(totalClicks)}\n`;
    answer += `• CTR: ${avgCtr.toFixed(2)}%\n`;
    answer += `• Conversions: ${fmt(totalConversions)}\n`;
    answer += `• Conv. Rate: ${convRate}%\n`;
    answer += `• CPA: $${avgCpa.toFixed(2)}\n\n`;
    answer += `**Portfolio:**\n`;
    answer += `• ${campaigns.length} campaigns across ${[...new Set(campaigns.map((c) => c.country))].length} countries\n`;
    answer += `• ${experiments.length} experiments (${experiments.filter((e) => e.result === "WINNER").length} winners)\n`;
    answer += `• ${memories.length} marketing memories documented\n`;

    return { answer, sources: campaigns.slice(0, 3).map((c) => ({ type: "campaign", id: c.id })) };
  }

  // === RECOMMEND / NEXT CAMPAIGN ===
  if (words.some((w) => ["recommend", "suggest", "next", "should i", "advice", "plan", "strategy"].includes(w))) {
    const sortedByRoas = [...campaignAggs].sort((a, b) => Number(b._avg.roas) - Number(a._avg.roas));
    const best = sortedByRoas[0];
    let bestCamp = null;
    if (best) bestCamp = await prisma.campaign.findUnique({ where: { id: best.campaignId }, select: { name: true, country: true, type: true } });

    const winners = experiments.filter((e) => e.result === "WINNER");

    let answer = `**🎯 Recommendations for your next move:**\n\n`;

    if (bestCamp) {
      answer += `1. **Scale what works:** ${bestCamp.name} (${FLAGS[bestCamp.country] || bestCamp.country}) has the best ROAS at ${Number(best._avg.roas).toFixed(1)}x. Consider increasing its budget by 20%.\n\n`;
    }

    if (winners.length > 0) {
      const latestWin = winners[0];
      answer += `2. **Apply past lessons:** Your experiment "${latestWin.title}" was a winner (ROAS: ${latestWin.roas}x). Apply those learnings: ${(latestWin.lessonsLearned || "N/A").substring(0, 100)}.\n\n`;
    }

    answer += `3. **Test new markets:** Based on your data, consider expanding to markets where you haven't tested yet.\n\n`;
    answer += `4. **Refresh creatives:** Rotate your top-performing ad creatives every 14 days to prevent fatigue.\n\n`;

    const failCountries = [...new Set(experiments.filter((e) => e.result === "FAIL").map((e) => e.country))];
    if (failCountries.length > 0) {
      answer += `5. **Revisit failed markets carefully:** ${failCountries.map((c) => FLAGS[c] || c).join(", ")} had failures. Review what went wrong before retrying.`;
    }

    return { answer, sources: best ? [{ type: "campaign", id: best.campaignId }] : [] };
  }

  // === HELLO / CONVERSATIONAL (fallback for short messages) ===
  if (words.length <= 2 && !lower.includes("?")) {
    return {
      answer: `I'm here to help! Try asking me something like:\n\n• "What's our best campaign?"\n• "How are we doing in Saudi Arabia?"\n• "What experiments have we run?"\n• "What mistakes should I avoid?"\n• "Where should I put more budget?"\n• "Give me a performance overview"`,
      sources: [],
    };
  }

  // === GENERAL FALLBACK — try to answer from data ===
  // Look for any campaign names mentioned
  const mentionedCampaign = campaigns.find((c) => {
    const words2 = c.name.toLowerCase().split(/\s+/);
    return words2.some((w) => w.length > 3 && lower.includes(w));
  });

  if (mentionedCampaign) {
    const agg = campaignAggs.find((a) => a.campaignId === mentionedCampaign.id);
    if (agg) {
      const roas2 = Number(agg._avg.roas).toFixed(1);
      const rev = fmt(agg._sum.revenue);
      const cost2 = fmt(agg._sum.cost);
      const conv = fmt(agg._sum.conversions);
      sources.push({ type: "campaign", id: mentionedCampaign.id });
      return {
        answer: `Here's what I know about **${mentionedCampaign.name}**:\n\n• Country: ${FLAGS[mentionedCampaign.country] || mentionedCampaign.country}\n• Type: ${mentionedCampaign.type.replace("_", " ")}\n• Status: ${mentionedCampaign.status}\n• Revenue: $${rev} | Spend: $${cost2}\n• ROAS: ${roas2}x | Conversions: ${conv}\n\nWhat would you like to know about this campaign?`,
        sources,
      };
    }
  }

  // Check for any memory that matches the query
  const matchingMemories = memories.filter((m) => {
    const text = `${m.title} ${m.content}`.toLowerCase();
    return words.some((w) => w.length > 3 && text.includes(w));
  });

  if (matchingMemories.length > 0) {
    let answer = `I found some relevant marketing memories:\n\n`;
    matchingMemories.slice(0, 3).forEach((m, i) => {
      answer += `**${m.title}** (${m.type})\n${m.content.substring(0, 150)}${m.content.length > 150 ? "..." : ""}\n\n`;
    });
    return { answer, sources: [] };
  }

  // Absolute fallback
  return {
    answer: `I understand you're asking about "${message}", but I'm not sure how to answer that from your data yet. Here's what I can help with:\n\n• **Campaigns** — "Which campaign performs best?" or ask about a specific campaign name\n• **Countries** — "How are we doing in [country]?"\n• **Experiments** — "What experiments have we run?" or "What won?"\n• **Mistakes** — "What mistakes should I avoid?"\n• **Budget** — "Where should I allocate budget?"\n• **Assets** — "Which creative assets perform best?"\n• **Performance** — "Give me an overview" or "How are we doing?"\n• **Strategy** — "Recommend my next campaign"\n\nTry rephrasing your question!`,
    sources: [],
  };
}

module.exports = { analyzeCampaign, recommend, chat };
