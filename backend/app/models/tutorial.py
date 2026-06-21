from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Tutorial(Base):
    __tablename__ = "tutorials"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    topic: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True) # Full MD content
    difficulty_level: Mapped[str | None] = mapped_column(String(32), nullable=True, default="Easy")
    concept: Mapped[str] = mapped_column(Text, nullable=False)
    code_example: Mapped[str] = mapped_column(Text, nullable=False)
    complexity: Mapped[str] = mapped_column(String(128), nullable=False)
    practice_tips: Mapped[str] = mapped_column(Text, nullable=False)
    resource_link: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    video_links: Mapped[list[str]] = mapped_column(JSON, default=list)
    article_snippets: Mapped[list[dict[str, str]]] = mapped_column(JSON, default=list)

    problems = relationship("Problem", back_populates="tutorial")

