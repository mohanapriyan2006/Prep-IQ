from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import text
from sqlalchemy import select
import re

from app.config import get_cors_origins, get_settings
from app.database import Base, SessionLocal, engine
import app.models  # noqa: F401
from app.routers import (
    ai_router,
    analytics,
    assessment,
    auth,
    contests,
    execution,
    mock_router,
    platform_connectors,
    problems,
    roadmap,
    submissions,
    survey,
    tutorials,
    stats_router,
)
from app.services.contest_service import contest_service
from app.services.analysis_engine import analysis_engine
from app.models.user import User

settings = get_settings()
app = FastAPI(title=settings.app_name, debug=settings.app_debug)
scheduler = BackgroundScheduler(timezone="UTC")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(settings),
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def localhost_cors_fallback(request, call_next):
    response = await call_next(request)
    origin = request.headers.get("origin")
    if (
        origin
        and re.match(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$", origin)
        and "access-control-allow-origin" not in response.headers
    ):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response


@app.on_event("startup")
def on_startup() -> None:
    # For local bootstrap; replace with Alembic migrations in deployment.
    Base.metadata.create_all(bind=engine)

    # Backward-compatible patching for legacy databases that predate newer columns.
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS topic_tags JSON"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS company_tags JSON"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS hints JSON"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS visible_testcases JSON"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS hidden_testcases JSON"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS input_format TEXT"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS output_format TEXT"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS constraints TEXT"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS subtopic VARCHAR(128)"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS tutorial_link VARCHAR(1024)"))
        conn.execute(text("UPDATE problems SET topic_tags = COALESCE(topic_tags, '[]'::json)"))
        conn.execute(text("UPDATE problems SET company_tags = COALESCE(company_tags, '[]'::json)"))
        conn.execute(text("UPDATE problems SET hints = COALESCE(hints, '[]'::json)"))
        conn.execute(text("UPDATE problems SET visible_testcases = COALESCE(visible_testcases, '[]'::json)"))
        conn.execute(text("UPDATE problems SET hidden_testcases = COALESCE(hidden_testcases, '[]'::json)"))
        conn.execute(text("ALTER TABLE roadmap_plans ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(64) DEFAULT 'rule-based'"))
        conn.execute(text("ALTER TABLE roadmap_plans ADD COLUMN IF NOT EXISTS generation_trace TEXT"))
        conn.execute(text("UPDATE roadmap_plans SET ai_provider = 'rule-based' WHERE ai_provider IS NULL"))
        conn.execute(text("ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS video_links JSON"))
        conn.execute(text("ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS article_snippets JSON"))
        conn.execute(text("UPDATE tutorials SET video_links = COALESCE(video_links, '[]'::json)"))
        conn.execute(text("UPDATE tutorials SET article_snippets = COALESCE(article_snippets, '[]'::json)"))
        
        # PrepIQ Upgrade Patches
        conn.execute(text("ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS content TEXT"))
        conn.execute(text("ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(32) DEFAULT 'Easy'"))
        conn.execute(text("ALTER TABLE problems ADD COLUMN IF NOT EXISTS tutorial_id INTEGER"))
        conn.execute(text("ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS assessment_session_id INTEGER"))
        conn.execute(text("ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER"))
        conn.execute(text("ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1"))
        conn.execute(text("ALTER TABLE onboarding_surveys ADD COLUMN IF NOT EXISTS weak_areas JSON"))
        conn.execute(text("ALTER TABLE onboarding_surveys ADD COLUMN IF NOT EXISTS confidence_level INTEGER"))

    def sync_contests_job() -> None:
        db = SessionLocal()
        try:
            contest_service.sync_contests(db)
        finally:
            db.close()

    def weekly_ai_refresh_job() -> None:
        db = SessionLocal()
        try:
            users = list(db.scalars(select(User)).all())
            for user in users:
                analysis_engine.analyze_user(db, user.id, trigger="weekly", auto_refresh=True)
        finally:
            db.close()

    if not scheduler.running:
        scheduler.add_job(sync_contests_job, "cron", hour=settings.contest_sync_hour_utc, id="contest_daily_sync", replace_existing=True)
        scheduler.add_job(weekly_ai_refresh_job, "cron", day_of_week="mon", hour=3, id="weekly_ai_refresh", replace_existing=True)
        scheduler.start()
    sync_contests_job()


@app.on_event("shutdown")
def on_shutdown() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.app_env}


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(execution.router, tags=["execution"])
app.include_router(problems.router, prefix="/problems", tags=["problems"])
app.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
app.include_router(platform_connectors.router)
app.include_router(contests.router)
app.include_router(survey.router)
app.include_router(assessment.router)
app.include_router(roadmap.router)
app.include_router(analytics.router)
app.include_router(tutorials.router)
app.include_router(mock_router.router)
app.include_router(ai_router.router)
app.include_router(stats_router.router)
