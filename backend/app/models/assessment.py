from datetime import datetime
from typing import List

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(64), nullable=False) # e.g., initial-diagnostic, dsa-test, mock-interview
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    total_score: Mapped[float | None] = mapped_column(Integer, nullable=True)
    accuracy: Mapped[float | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(64), nullable=False, default="in-progress")
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True) 

    user = relationship("User", back_populates="assessment_sessions")
    attempts = relationship("AssessmentAttempt", back_populates="assessment_session", cascade="all, delete-orphan")


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    assessment_session_id: Mapped[int | None] = mapped_column(ForeignKey("assessment_sessions.id", ondelete="CASCADE"), index=True, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id", ondelete="CASCADE"), index=True)
    language: Mapped[str] = mapped_column(String(32), nullable=False)
    code: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    runtime_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    passed_testcases: Mapped[int] = mapped_column(Integer, default=0)
    total_testcases: Mapped[int] = mapped_column(Integer, default=0)
    time_taken_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attempt_count: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="assessment_attempts")
    problem = relationship("Problem")
    assessment_session = relationship("AssessmentSession", back_populates="attempts")
