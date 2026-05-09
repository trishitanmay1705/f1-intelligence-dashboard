# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import f1
import os


def create_application() -> FastAPI:

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )

    # ✅ Allow requests from anywhere in production
    # When you know your Vercel URL you can restrict it
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(
        f1.router,
        prefix="/api/v1"
    )

    return application


app = create_application()


@app.get("/")
async def root():
    return {
        "message": "F1 Intelligence Dashboard API",
        "version": settings.app_version,
        "status": "running",
        "docs": "/api/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}