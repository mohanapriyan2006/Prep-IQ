from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Editorial(Base):
    __tablename__ = "editorials"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id", ondelete="CASCADE"), index=True, unique=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    approaches: Mapped[dict | None] = mapped_column(JSON, nullable=True) # e.g. [{"name": "Brute Force", "complexity": "O(N^2)"}]
    solution_code: Mapped[dict | None] = mapped_column(JSON, nullable=True) # e.g. {"cpp": "...", "python": "..."}
    time_complexity: Mapped[str | None] = mapped_column(String(255), nullable=True)
    space_complexity: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Relationships
    problem = relationship("Problem", back_populates="editorial")
