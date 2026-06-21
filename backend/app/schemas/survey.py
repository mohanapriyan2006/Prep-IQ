from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class SurveySubmitRequest(BaseModel):
    current_year: Literal["2nd", "3rd", "Final"]
    dsa_experience_level: Literal["Beginner", "Intermediate", "Advanced"]
    target_companies: list[str] = Field(default_factory=list, max_length=20)
    weekly_study_hours: int = Field(ge=1, le=80)
    preferred_language: Literal["cpp", "java", "python"]
    preparation_start_date: date
    goal_timeline_months: Literal[3, 6]
    weak_areas: list[str] = Field(default_factory=list, max_length=10)
    confidence_level: int | None = Field(default=None, ge=1, le=10)


class SurveyReadResponse(BaseModel):
    id: int
    current_year: str
    dsa_experience_level: str
    target_companies: list[str]
    weekly_study_hours: int
    preferred_language: str
    preparation_start_date: date
    goal_timeline_months: int
    weak_areas: list[str] | None = None
    confidence_level: int | None = None
    created_at: datetime
    updated_at: datetime
