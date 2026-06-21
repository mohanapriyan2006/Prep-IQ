from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExternalStats(Base):
    __tablename__ = "external_stats"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, unique=True)
    
    leetcode_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    gfg_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    last_synced: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="external_stats")
