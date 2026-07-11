import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admind:password@localhost:5432/admind")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
AI_PROVIDER = os.getenv("AI_PROVIDER", "mock")
