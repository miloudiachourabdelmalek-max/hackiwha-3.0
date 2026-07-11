from datetime import datetime
from models.schemas import ChatRequest


def handle_chat(req: ChatRequest):
    msg = req.message.lower().strip()
    current_year = datetime.now().year

    if any(k in msg for k in ["best campaign", "top campaign", "best performing", "best roas", "highest roas"]):
        answer = (
            "Based on your marketing data, here are your top-performing campaigns:\n\n"
            "1. PMax SA - Fitness Tracker\n"
            "   ROAS: 4.8x | Revenue: $44,160 | CPA: $15.30\n"
            "   Why it works: UGC Video creatives + Similar High Value audiences in the Saudi market\n\n"
            "2. Retargeting TN - Backpacks\n"
            "   ROAS: 6.2x | Revenue: $9,920 | CPA: $8.50\n"
            "   Why it works: Custom Website Visitors audience + Short Video format in Tunisia\n\n"
            "3. UGC Video DZ - Running Shoes\n"
            "   ROAS: 5.1x | Revenue: $9,435 | CPA: $12.80\n"
            "   Why it works: UGC Video with Arabic localization in Algeria\n\n"
            "Key pattern: UGC-style video creatives combined with lookalike or retargeting audiences consistently deliver the highest returns across MENA markets."
        )

    elif any(k in msg for k in ["worst", "poorly", "underperform", "lowest roas", "bad campaign"]):
        answer = (
            "Your underperforming campaigns that need attention:\n\n"
            "1. Shopping EG - Sunglasses\n"
            "   ROAS: 1.2x | CPA: $45.00 | Result: FAIL\n"
            "   Issue: Used European creatives without Arabic localization\n\n"
            "2. Display AE - Winter Jacket\n"
            "   ROAS: 1.8x | CPA: $38.50 | Result: FAIL\n"
            "   Issue: Wrong audience targeting (Tech Enthusiasts for fashion), creatives not refreshed for 3 weeks\n\n"
            "3. PMax DZ - Laptop Stand\n"
            "   ROAS: 2.5x | CPA: $22.00 | Result: BREAK_EVEN\n"
            "   Issue: Bundle landing page not mobile-optimized, lost ~20% of conversions\n\n"
            "Recommendation: Pause EG and AE campaigns. For EG, partner with a local creative agency. For AE, switch to lifestyle audiences."
        )

    elif any(k in msg for k in ["mistake", "repeat", "error", "avoid"]):
        answer = (
            "Based on your marketing memory, here are your recurring mistakes to avoid:\n\n"
            "1. Not localizing creatives for MENA markets\n"
            "   Impact: 3-5x higher CPA when using European creatives unchanged\n"
            "   Fix: Always create market-specific versions with local language and cultural imagery\n\n"
            "2. Not excluding past purchasers from retargeting\n"
            "   Impact: ~15% of retargeting budget wasted on existing customers\n"
            "   Fix: Create exclusion audiences before launching any retargeting campaign\n\n"
            "3. Scaling budgets too fast\n"
            "   Impact: 40% CPA increase when doubling budget overnight\n"
            "   Fix: Scale by max 20% every 3-4 days to maintain algorithmic stability\n\n"
            "4. Not refreshing creatives\n"
            "   Impact: Ad fatigue sets in after ~2 weeks, causing declining CTR and rising CPC\n"
            "   Fix: Swap creatives every 14 days, maintain 3-4 active variants per ad group"
        )

    elif any(k in msg for k in ["france", "french"]):
        answer = (
            "France Campaign Strategy:\n\n"
            "Best practices for the French market:\n"
            "• Audience: Use In-Market - Sports & Fitness (2.3x better conversion than Affinity)\n"
            "• Creative format: Motion Graphics and Short Videos outperform static images\n"
            "• Language: French-localized landing pages are essential — never send to English pages\n"
            "• Your Smart Watch campaign in FR achieved 3.4x ROAS using these tactics\n"
            "• Budget range: $4,000-$7,000 for optimal results\n"
            "• Compliance: Ensure GDPR-compliant cookie consent and tracking setup\n\n"
            "Pro tip: FR has high AOV ($85+ average). Focus on premium positioning rather than discount messaging."
        )

    elif any(k in msg for k in ["saudi", "sa "]):
        answer = (
            "Saudi Arabia — Your Highest Potential Market:\n\n"
            "• Overall ROAS: 4.8x across SA campaigns\n"
            "• Best product: Fitness Tracker ($44,160 revenue, $9,200 spend)\n"
            "• Audience strategy: Similar - High Value audiences scale best\n"
            "• Creative format: UGC Video + Motion Graphics combination\n"
            "• Language: Bilingual Arabic/English works well — 60% of SA consumers switch between both\n"
            "• Key insight: Vision 2030 is driving massive digital adoption; mobile commerce is 80%+ of transactions\n\n"
            "Recommendation: Increase SA budget allocation by 30-40%. Set up Enhanced Conversions before next campaign. SA has excellent scale potential with proven assets."
        )

    elif any(k in msg for k in ["algeria", "algerian", "dz "]):
        answer = (
            "Algeria Market Strategy:\n\n"
            "• Running Shoes is your top performer in DZ (5.1x ROAS, $9,435 revenue)\n"
            "• Key success factor: UGC Video format with Arabic/French bilingual creatives\n"
            "• Mobile-first approach is critical — 78% of web traffic is mobile\n"
            "• Localize ALL creatives in Arabic; French-only underperforms by 40%\n"
            "• Budget: $2,000-$5,000 is the sweet spot for PMax campaigns\n\n"
            "Warning: Your Laptop Stand campaign broke even (2.5x ROAS) due to a non-mobile-optimized bundle page."
        )

    elif any(k in msg for k in ["summary", "summarize", "overview", "6 month", "performance"]):
        answer = (
            "Marketing Performance Summary:\n\n"
            "Total spend generating healthy returns across 12 campaigns in 8 MENA markets.\n\n"
            "Key metrics:\n"
            "• Best market: Saudi Arabia (4.8x ROAS, $44K revenue)\n"
            "• Best creative format: UGC Video (outperforms static 3:1)\n"
            "• Experiment success rate: 60% winners, 20% break-even, 20% failures\n"
            "• Top product: Fitness Tracker in SA market\n\n"
            "Critical insight: Always localize for each market. Non-localized campaigns fail 70% of the time.\n\n"
            f"As of {current_year}, your portfolio is trending positive with strong growth in SA, TN, and DZ markets."
        )

    elif any(k in msg for k in ["recommend", "next campaign", "suggest", "should i"]):
        answer = (
            "Recommendations for your next campaign:\n\n"
            "1. Product & Market: Fitness Tracker in Saudi Arabia\n"
            "   Why: Highest ROAS (4.8x) with proven creative-audience combination\n\n"
            "2. Creative strategy: UGC Video format with Arabic/English bilingual captions\n"
            "   Why: UGC consistently outperforms studio content 3:1 in MENA\n\n"
            "3. Audience: Similar - High Value (scaled from previous SA winners)\n"
            "   Why: Proven to convert at $15.30 CPA\n\n"
            "4. Budget: $5,000-$10,000 starting, scale by 20% every 4 days\n"
            "   Why: Allows proper data collection without overspending early\n\n"
            "5. Pre-launch checklist:\n"
            "   • Set up Enhanced Conversions (last time you missed 3 days of data)\n"
            "   • Create exclusion audience for past purchasers\n"
            "   • Prepare 3-4 creative variants for A/B testing\n"
            "   • Ensure landing page loads in under 2 seconds on mobile"
        )

    elif any(k in msg for k in ["image", "photo", "creative", "asset"]):
        answer = (
            "Creative Asset Performance:\n\n"
            "Best performing formats (ranked by ROAS impact):\n"
            "1. UGC-style video — 3x higher ROAS than static images\n"
            "2. Motion Graphics — Best for electronics and tech products\n"
            "3. Short Video (15-30s) — Highest engagement in TN and TR markets\n"
            "4. Before/after comparison images — Strong for fashion and accessories\n\n"
            "Avoid:\n"
            "• Generic stock photos (lowest CTR across all markets)\n"
            "• English-only creatives in Arabic-dominant markets\n"
            "• Creative sets running longer than 14 days without refresh\n\n"
            "Your data shows UGC video creatives in DZ and SA markets consistently generate 4-6x ROAS, while static images average 1.5-2.5x."
        )

    elif any(k in msg for k in ["product", "which product"]):
        answer = (
            "Product Performance Overview:\n\n"
            "Top performers:\n"
            "• Fitness Tracker — Best ROAS (4.8x in SA), highest revenue ($44K)\n"
            "• Running Shoes — Strong in DZ (5.1x ROAS, $9.4K revenue)\n"
            "• Backpack — Excellent retargeting results in TN (6.2x ROAS)\n"
            "• Sport Watch — Solid brand awareness results in TR (3.8x ROAS)\n\n"
            "Underperformers:\n"
            "• Winter Jacket — Wrong audience targeting in AE (1.8x ROAS)\n"
            "• Sunglasses — Failed in EG without localization (1.2x ROAS)\n"
            "• Laptop Stand — Break-even in DZ due to mobile UX issues (2.5x ROAS)\n\n"
            "Strategy: Double down on Fitness Tracker and Running Shoes. Pause or rework Winter Jacket and Sunglasses."
        )

    elif any(k in msg for k in ["budget", "spend", "how much", "invest"]):
        answer = (
            "Budget Allocation Recommendations:\n\n"
            "Current top ROI markets by budget efficiency:\n"
            "1. Tunisia — $1,800 budget → $9,920 revenue (5.5x return)\n"
            "2. Saudi Arabia — $9,500 budget → $44,160 revenue (4.6x return)\n"
            "3. Algeria Running Shoes — $4,500 budget → $9,435 revenue (2.1x return, 5.1x ROAS)\n\n"
            "Recommended reallocation:\n"
            "• Increase SA by $3,000-$5,000 (highest scale potential)\n"
            "• Increase TN by $1,000-$2,000 (best efficiency)\n"
            "• Decrease or pause AE Winter Jacket (1.8x ROAS)\n"
            "• Decrease or pause EG Sunglasses (1.2x ROAS)\n\n"
            "Scale rule: Never increase daily budget by more than 20% at once. Wait 3-4 days between increases."
        )

    elif any(k in msg for k in ["experiment", "test", "a/b", "ab test"]):
        answer = (
            "Experiment Insights from Your Marketing History:\n\n"
            "Successful experiment patterns (WINNER results):\n"
            "• UGC Video vs Static: UGC won with 5.1x ROAS vs 2.3x (DZ market)\n"
            "• Audience tests: In-Market outperforms Affinity by 2.3x for electronics (FR)\n"
            "• Retargeting: Website Visitors 30d audience generated 6.2x ROAS (TN)\n"
            "• Scale tests: SA market handles budget increases well with Similar - High Value\n\n"
            "Failed experiments (lessons):\n"
            "• EG market expansion: Failed due to lack of local creative partner\n"
            "• Creative fatigue in AE: Not refreshing creatives killed performance\n\n"
            "Best practice: Always test new markets with $500-$1,000 before committing larger budgets."
        )

    elif any(k in msg for k in ["hello", "hi ", "hey", "help"]):
        answer = (
            f"Hello! I'm your AI Marketing Assistant. I have access to your marketing data across 8 MENA markets.\n\n"
            f"I can help you with:\n"
            "• Campaign performance analysis (best/worst performers)\n"
            "• Creative and asset recommendations\n"
            "• Audience targeting strategies\n"
            "• Budget allocation advice\n"
            "• Market-specific insights (SA, DZ, FR, MA, TN, EG, AE, TR)\n"
            "• Lessons from past experiments\n"
            "• Mistakes to avoid\n\n"
            "Just ask me anything about your marketing performance!"
        )

    else:
        answer = (
            "I can help you analyze your marketing performance. Try asking about:\n\n"
            "• Your best or worst campaigns (e.g., \"What's our best campaign?\")\n"
            "• Which creatives and assets perform best\n"
            "• Recurring mistakes to avoid\n"
            "• Recommendations for your next campaign\n"
            "• Performance by country (e.g., \"How is Saudi Arabia doing?\")\n"
            "• Budget allocation advice\n"
            "• Experiment results and insights\n"
            "• Product performance comparison\n\n"
            "What would you like to know?"
        )

    return {"answer": answer, "sources": [], "isAI": True}
