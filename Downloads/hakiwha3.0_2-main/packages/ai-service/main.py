from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import CampaignRequest, RecommendRequest, ChatRequest, SummaryRequest
from agents.campaign_analyst import analyze_campaign
from agents.advisor import get_recommendations
from agents.chat_agent import handle_chat

app = FastAPI(title="AdMind AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "admind-ai"}


@app.post("/analyze/campaign")
def api_analyze_campaign(req: CampaignRequest):
    return analyze_campaign(req)


@app.post("/analyze/summary")
def api_analyze_summary(req: SummaryRequest):
    return {
        "headline": "Campaigns are performing well with room for optimization",
        "sentiment": "positive",
        "highlights": [
            "SA market delivering highest ROAS at 4.8x with Fitness Tracker",
            "UGC Video creatives outperforming static 3:1 across all markets",
            "Retargeting campaigns in TN showing exceptional 6.2x ROAS",
            "60% experiment win rate — strong data-driven decision making",
        ],
        "recommendations": [
            "Reallocate $3,000-$5,000 from AE and EG underperformers to SA and TN",
            "Refresh creatives in campaigns running longer than 2 weeks",
            "Set up Enhanced Conversions before next SA campaign",
            "Test Fitness Tracker in UAE market using SA winning assets",
        ],
    }


@app.post("/recommend")
def api_recommend(req: RecommendRequest):
    return get_recommendations(req)


@app.post("/chat")
def api_chat(req: ChatRequest):
    return handle_chat(req)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
