from pydantic import BaseModel
from typing import List, Optional


class CampaignRequest(BaseModel):
    campaignId: str
    campaign: dict
    metrics: dict
    averages: dict
    assets: List[dict]


class RecommendRequest(BaseModel):
    organizationId: str
    product: str
    country: str
    budget: float
    goal: str


class ChatRequest(BaseModel):
    organizationId: str
    message: str


class SummaryRequest(BaseModel):
    organizationId: str
