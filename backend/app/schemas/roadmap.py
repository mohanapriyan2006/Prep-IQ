from datetime import date, datetime

from pydantic import BaseModel


class RoadmapDayRead(BaseModel):
    id: int
    day_number: int
    week_number: int
    topic: str
    problems_count: int
    tutorial_title: str | None = None
    tutorial_link: str | None = None
    estimated_minutes: int
    task_type: str
    is_completed: bool


class RoadmapRead(BaseModel):
    id: int
    start_date: date
    week_number: int
    generated_reason: str
    ai_provider: str
    generation_trace: str | None = None
    ai_feedback: str | None = None
    created_at: datetime
    days: list[RoadmapDayRead]


class RoadmapRefreshResponse(BaseModel):
    roadmap: RoadmapRead
    insights: list[str]


class RoadmapDayProblemItem(BaseModel):
    id: int
    title: str
    difficulty: str
    topic: str
    tutorial_link: str | None = None
    problem_path: str
    editorial_path: str


class RoadmapDayDetailResponse(BaseModel):
    id: int
    day_number: int
    week_number: int
    topic: str
    estimated_minutes: int
    task_type: str
    tutorial_title: str | None = None
    tutorial_link: str | None = None
    tutorial_path: str
    practice_path: str
    external_resource_link: str | None = None
    status: str
    continue_problem_id: int | None = None
    continue_problem_path: str | None = None
    problems: list[RoadmapDayProblemItem]
