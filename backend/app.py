"""FastAPI application entry point."""

import time
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db, close_db

logging.basicConfig(
    level=logging.INFO if settings.is_dev else logging.WARNING,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# Track when the app started
APP_START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Starting up — initializing database...")
    await init_db()
    logger.info("Database initialized.")
    yield
    logger.info("Shutting down — closing database...")
    await close_db()
    logger.info("Goodbye.")


app = FastAPI(
    title="Luna Wearable Intelligence",
    description="Real-time wearable sensor dashboard with AI-powered anomaly detection",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and mount routes
from routes.health import router as health_router
from routes.alerts import router as alerts_router
from routes.history import router as history_router
from routes.websocket import router as ws_router

app.include_router(health_router)
app.include_router(alerts_router)
app.include_router(history_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "name": "Luna Wearable Intelligence API",
        "version": "1.0.0",
        "status": "running",
        "uptime": round(time.time() - APP_START_TIME, 1),
    }
