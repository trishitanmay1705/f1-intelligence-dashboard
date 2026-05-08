from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import f1

def create_application() -> FastAPI:

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/api/docs",    # Swagger UI
        redoc_url="/api/redoc",  # Alternative docs
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    
    application.include_router(
        f1.router,
        prefix="/api/v1"
    )

    return application


app = create_application()


# ── Basic Endpoints ────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "🏎️ F1 Intelligence Dashboard API",
        "version": settings.app_version,
        "status": "running",
        "docs": "/api/docs",
        "endpoints": {
            "season":       "/api/v1/f1/season/current",
            "drivers":      "/api/v1/f1/standings/drivers",
            "constructors": "/api/v1/f1/standings/constructors",
            "last_race":    "/api/v1/f1/results/last",
        }
    }


@app.get("/health")
async def health_check():
    """Azure will ping this to check if app is alive"""
    return {"status": "healthy"}