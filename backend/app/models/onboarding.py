from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OnboardingSurvey(Base):
    __tablename__ = "onboarding_surveys"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    current_year: Mapped[str] = mapped_column(String(32), nullable=False)
    dsa_experience_level: Mapped[str] = mapped_column(String(32), nullable=False)
    target_companies: Mapped[list[str]] = mapped_column(JSON, default=list)
    weekly_study_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    preferred_language: Mapped[str] = mapped_column(String(32), nullable=False)
    preparation_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    goal_timeline_months: Mapped[int] = mapped_column(Integer, nullable=False)
    weak_areas: Mapped[list[str] | None] = mapped_column(JSON, nullable=True, default=list)
    confidence_level: Mapped[int | None] = mapped_column(Integer, nullable=True) # 1-10 string mapped to what they feel
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="survey")
