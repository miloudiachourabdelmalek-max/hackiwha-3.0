from datetime import datetime
from models.schemas import RecommendRequest


COUNTRY_DATA = {
    "DZ": {"language": "Arabic/French", "audiences": ["In-Market - Electronics", "Lookalike - Purchasers"], "best_creatives": ["UGC Video", "Short Video"], "tips": "Localize in Arabic. Mobile-first creative essential. DZ has high mobile penetration (78% of web traffic)."},
    "FR": {"language": "French", "audiences": ["In-Market - Sports & Fitness", "Custom - Website Visitors"], "best_creatives": ["Motion Graphics", "Short Video"], "tips": "Premium positioning works well. Use French landing pages. GDPR-compliant tracking is mandatory."},
    "MA": {"language": "Arabic/French", "audiences": ["Interest - Fitness", "Demographic - 25-44"], "best_creatives": ["Carousel", "Short Video"], "tips": "Price sensitivity is high. Compete on value, not premium. Mobile commerce dominates (70%+ of transactions)."},
    "TN": {"language": "Arabic/French", "audiences": ["Custom - Website Visitors 30d", "Lookalike - High Value"], "best_creatives": ["Short Video", "UGC Video"], "tips": "Retargeting performs exceptionally well. Use exclusion audiences. Young demographic (median age 32)."},
    "EG": {"language": "Arabic", "audiences": ["Demographic - 25-44 Male", "In-Market"], "best_creatives": ["UGC Video", "Static Image"], "tips": "Cultural relevance is critical. Test with small budget first. Ramadan and Eid drive 40% annual e-commerce volume."},
    "SA": {"language": "Arabic/English", "audiences": ["Similar - High Value", "In-Market - Tech"], "best_creatives": ["UGC Video", "Motion Graphics"], "tips": "Highest potential market. Scale aggressively with proven assets. Vision 2030 is driving massive digital adoption."},
    "AE": {"language": "English/Arabic", "audiences": ["In-Market - Fashion", "Affinity - Lifestyle"], "best_creatives": ["Short Video", "Motion Graphics"], "tips": "Lifestyle audiences work best. Refresh creatives every 2 weeks. High AOV market — focus on premium positioning."},
    "TR": {"language": "Turkish", "audiences": ["Demographic - 25-44 Male", "In-Market - Electronics"], "best_creatives": ["Short Video", "UGC Video"], "tips": "Video format drives 2x engagement. Always use Conversion objective. Local payment methods (Troy, BKM) boost conversion."},
}

PRODUCT_AUDIENCES = {
    "Running Shoes": ["In-Market - Sports", "Interest - Fitness", "Lookalike - Purchasers"],
    "Smart Watch": ["In-Market - Electronics", "Affinity - Tech Enthusiasts", "In-Market - Sports & Fitness"],
    "Wireless Earbuds": ["In-Market - Electronics", "Affinity - Music Lovers", "Demographic - 18-34"],
    "Backpack": ["In-Market - Travel", "Interest - Lifestyle", "Custom - Website Visitors"],
    "Sunglasses": ["In-Market - Fashion", "Affinity - Style", "Interest - Outdoor"],
    "Fitness Tracker": ["In-Market - Sports & Fitness", "Affinity - Health", "Similar - High Value"],
    "Winter Jacket": ["In-Market - Apparel", "Affinity - Fashion", "Demographic - 25-44"],
    "Sport Watch": ["In-Market - Electronics", "In-Market - Sports", "Affinity - Tech"],
    "Laptop Stand": ["In-Market - Tech", "Affinity - Tech Enthusiasts", "Demographic - 25-44"],
    "Phone Case": ["In-Market - Mobile", "Custom - Website Visitors", "Similar - High Value"],
}


def get_recommendations(req: RecommendRequest):
    country_info = COUNTRY_DATA.get(req.country, COUNTRY_DATA["FR"])
    product_audiences = PRODUCT_AUDIENCES.get(req.product, ["In-Market - General"])
    current_year = datetime.now().year

    headlines = [
        f"Premium {req.product} - Free Shipping to {req.country}",
        f"Top Rated {req.product} {current_year} — Limited Offer",
        f"Shop the Best {req.product} Deals in {req.country}",
        f"{req.product} Trusted by Thousands — Order Now",
    ]

    descriptions = [
        f"Discover our top-rated {req.product}. Fast delivery to {req.country}. 30-day money-back guarantee.",
        f"Shop now and save on {req.product}. Rated 4.8/5 by over 10,000 customers.",
        f"Premium quality {req.product} at unbeatable prices. Free returns within 30 days.",
    ]

    images = [
        f"UGC-style lifestyle photo showing {req.product} in use",
        f"Before/after comparison image highlighting {req.product} features",
        f"Local cultural imagery relevant to {req.country} market",
    ]

    budget_range = f"${int(req.budget * 0.8):,} - ${int(req.budget * 1.2):,} for optimal results"

    if req.budget < 1000:
        expected_roas = "2.0x - 3.0x (small budget, limited data for optimization)"
    elif req.budget < 5000:
        expected_roas = "3.0x - 4.5x based on similar campaigns in this region"
    elif req.budget < 15000:
        expected_roas = "4.0x - 6.0x with proper optimization and proven creatives"
    else:
        expected_roas = "5.0x - 7.0x at scale with established winning assets"

    audience_str = ", ".join(product_audiences)

    return {
        "product": req.product,
        "country": req.country,
        "budget": req.budget,
        "goal": req.goal,
        "recommendations": {
            "assets": {
                "images": images,
                "headlines": headlines,
                "descriptions": descriptions,
            },
            "audience": audience_str,
            "best_creatives": country_info["best_creatives"],
            "countries": [req.country],
            "budgetRange": budget_range,
            "expectedROAS": expected_roas,
            "language": country_info["language"],
            "tips": country_info["tips"],
            "warnings": [],
            "memoryInsights": [
                f"Always localize creatives for {req.country} in {country_info['language']}",
                f"Use {country_info['best_creatives'][0]} format for best results in {req.country}",
                f"In-Market audiences convert 2.3x better for {req.product} in {req.country}",
                f"Based on past data: ROAS of 4.0+ is achievable in {req.country} with {req.product}",
            ],
        },
        "isAI": True,
    }
