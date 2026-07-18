"""Application configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/luna_wearable",
    )

    # Google Gemini & OpenRouter
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

    # Application
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))

    # CORS
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    ]

    # Sensor Simulator
    SENSOR_INTERVAL_MS: int = int(os.getenv("SENSOR_INTERVAL_MS", "1000"))
    ANOMALY_COOLDOWN_S: int = int(os.getenv("ANOMALY_COOLDOWN_S", "10"))

    # Rate Limiting
    RATE_LIMIT: str = os.getenv("RATE_LIMIT", "100/minute")

    @property
    def is_dev(self) -> bool:
        return self.APP_ENV == "development"


settings = Settings()
