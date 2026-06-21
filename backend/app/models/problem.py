from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, String, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    difficulty: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    subtopic: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tutorial_link: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    tutorial_id: Mapped[int | None] = mapped_column(ForeignKey("tutorials.id", ondelete="SET NULL"), nullable=True)
    topic_tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    input_format: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_format: Mapped[str | None] = mapped_column(Text, nullable=True)
    constraints: Mapped[str | None] = mapped_column(Text, nullable=True)
    examples: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    company_tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    hints: Mapped[list[str]] = mapped_column(JSON, default=list)
    visible_testcases: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list)
    hidden_testcases: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tutorial = relationship("Tutorial", back_populates="problems")
    editorial = relationship("Editorial", back_populates="problem", uselist=False, cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="problem", cascade="all, delete-orphan")
    bookmarks = relationship("ProblemBookmark", back_populates="problem", cascade="all, delete-orphan")
