def analyze_campaign(req):
    roas = 0
    ctr = 0
    cost = 0
    revenue = 0
    impressions = 0
    clicks = 0
    conversions = 0
    conv_rate = 0
    cpa = 0

    if req.averages:
        roas = float(req.averages.get("roas") or 0)
        ctr = float(req.averages.get("ctr") or 0)
        conv_rate = float(req.averages.get("convRate") or 0)
        cpa = float(req.averages.get("cpa") or 0)
    if req.metrics:
        cost = float(req.metrics.get("cost") or 0)
        revenue = float(req.metrics.get("revenue") or 0)
        impressions = int(req.metrics.get("impressions") or 0)
        clicks = int(req.metrics.get("clicks") or 0)
        conversions = int(float(req.metrics.get("conversions") or 0))

    if roas >= 4:
        grade, sentiment = "A", "excellent"
    elif roas >= 3:
        grade, sentiment = "B+", "good"
    elif roas >= 2:
        grade, sentiment = "B", "average"
    elif roas >= 1.5:
        grade, sentiment = "C", "needs improvement"
    else:
        grade, sentiment = "D", "underperforming"

    strengths = []
    weaknesses = []
    recommendations = []

    if ctr > 3:
        strengths.append("Above-average click-through rate indicates strong ad relevance")
    elif ctr > 2:
        strengths.append("Healthy click-through rate — ads are resonating with the audience")
    else:
        weaknesses.append("Below-average click-through rate — ad creatives need improvement")
        recommendations.append("Test new headline and description combinations to improve CTR")

    if roas > 3:
        strengths.append("Strong return on ad spend — campaign is profitable and efficient")
    elif roas > 2:
        strengths.append("Positive ROAS — campaign is generating returns but has room for optimization")
    else:
        weaknesses.append("Low return on ad spend — targeting or creatives need optimization")
        recommendations.append("Review audience targeting and consider switching to higher-intent segments")

    if conv_rate > 3:
        strengths.append("High conversion rate — landing page and offer are well-aligned")
    elif conv_rate < 1:
        weaknesses.append("Low conversion rate — landing page or checkout flow needs improvement")
        recommendations.append("A/B test landing page variations, focus on mobile optimization")

    if cpa > 0 and cpa < 15:
        strengths.append(f"Low CPA (${cpa:.2f}) — efficient customer acquisition")
    elif cpa > 35:
        weaknesses.append(f"High CPA (${cpa:.2f}) — customer acquisition cost is too high")
        recommendations.append("Narrow audience targeting or increase bid adjustments for high-value segments")

    if cost > 0 and revenue < cost:
        net = revenue - cost
        weaknesses.append(f"Campaign is losing ${abs(net):,.0f} — spending more than it generates")
        recommendations.append("Consider pausing and restructuring with proven creatives from top performers")
    elif cost > 0 and revenue > cost:
        net = revenue - cost
        strengths.append(f"Generating ${net:,.0f} net profit from ${cost:,.0f} spend")

    if conversions > 200:
        strengths.append(f"High conversion volume ({conversions} conversions) provides strong statistical significance")
    elif conversions < 20:
        weaknesses.append(f"Low conversion volume ({conversions} conversions) — results may not be statistically reliable")
        recommendations.append("Increase budget slightly or extend campaign duration to gather more data")

    asset_types = set()
    if req.assets:
        for a in req.assets:
            asset_types.add(a.get("type", ""))

    if "VIDEO" in asset_types or "UGC Video" in str(asset_types):
        strengths.append("Video assets present — video formats drive 2x higher engagement in MENA markets")
    if len(asset_types) < 3:
        weaknesses.append(f"Limited asset diversity ({len(asset_types)} types) — campaigns perform better with 4+ asset types")
        recommendations.append("Add more asset types: headlines, descriptions, images, and at least one video")

    if not strengths:
        strengths.append("Campaign is running without critical issues")
    if not weaknesses:
        weaknesses.append("No major weaknesses detected — maintain current strategy")
    if not recommendations:
        recommendations = [
            "Test new ad creatives every 2 weeks to prevent ad fatigue",
            "Review audience targeting to improve conversion rates",
            "Consider reallocating budget to top-performing asset groups",
        ]

    country = req.campaign.get("country", "N/A")
    campaign_type = req.campaign.get("type", "campaign")
    name = req.campaign.get("name", "Campaign")

    return {
        "campaignId": req.campaignId,
        "analysis": {
            "grade": grade,
            "sentiment": sentiment,
            "headline": f"{name} is performing at a {sentiment} level",
            "summary": (
                f"This {campaign_type} campaign in {country} spent ${cost:,.0f} and generated "
                f"${revenue:,.0f} in revenue with a {roas:.1f}x ROAS. "
                f"It received {impressions:,} impressions, {clicks:,} clicks ({ctr:.2f}% CTR), "
                f"and {conversions} conversions ({conv_rate:.2f}% conv. rate)."
            ),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations,
        },
        "isAI": True,
    }
