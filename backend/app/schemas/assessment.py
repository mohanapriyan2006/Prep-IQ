from datetime import datetime

from pydantic import BaseModel, Field


class AssessmentProblem(BaseModel):
    id: int
    title: str
    difficulty: str
    topic: str
    description: str
    input_format: str | None = None
    output_format: str | None = None
    constraints: str | None = None
    examples: list[dict[str, str]] = []


class AssessmentSubmitRequest(BaseModel):
    problem_id: int
    language: str = Field(pattern="^(cpp|python|java)$")
    code: str
    session_id: int | None = None
    time_taken_seconds: int | None = None
    code: str = Field(min_length=1, max_length=100000)


class AssessmentSubmitResponse(BaseModel):
    attempt_id: int
    status: str
    passed: int
    total: int
    runtime_ms: int | None


class AssessmentSummaryResponse(BaseModel):
    attempts: int
    solved: int
    accuracy: float
    avg_runtime_ms: float
    difficulty_success_rate: dict[str, float]
    topic_accuracy: dict[str, float]
    last_attempt_at: datetime | None
