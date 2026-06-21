from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("ProblemBookmark", back_populates="user", cascade="all, delete-orphan")
    platform_accounts = relationship("UserPlatformAccount", back_populates="user", cascade="all, delete-orphan")
    platform_stats = relationship("UserPlatformStat", back_populates="user", cascade="all, delete-orphan")
    survey = relationship("OnboardingSurvey", back_populates="user", uselist=False, cascade="all, delete-orphan")
    assessment_sessions = relationship("AssessmentSession", back_populates="user", cascade="all, delete-orphan")
    assessment_attempts = relationship("AssessmentAttempt", back_populates="user", cascade="all, delete-orphan")
    external_stats = relationship("ExternalStats", back_populates="user", cascade="all, delete-orphan")
    roadmap_plans = relationship("RoadmapPlan", back_populates="user", cascade="all, delete-orphan")
