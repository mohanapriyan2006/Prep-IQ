from datetime import datetime

from pydantic import BaseModel, ConfigDict


class Testcase(BaseModel):
    input: str
    expected_output: str


class ProblemBase(BaseModel):
    title: str
    difficulty: str
    topic: str
    tutorial_link: str | None = None
    topic_tags: list[str] = []
    is_premium: bool = False
    description: str
    input_format: str | None = None
    output_format: str | None = None
    constraints: str | None = None
    examples: list[dict[str, str]] = []
    company_tags: list[str] = []
    hints: list[str] = []


class ProblemCreate(ProblemBase):
    visible_testcases: list[Testcase] = []
    hidden_testcases: list[Testcase] = []


class ProblemRead(ProblemBase):
    id: int
    visible_testcases: list[Testcase] = []
    solved: bool = False
    is_bookmarked: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProblemListItem(BaseModel):
    id: int
    title: str
    difficulty: str
    topic: str
    topic_tags: list[str] = []
    company_tags: list[str] = []
    is_premium: bool = False
    solved: bool = False
    is_bookmarked: bool = False


class BookmarkResponse(BaseModel):
    problem_id: int
    bookmarked: bool


class CodeReviewRequest(BaseModel):
    language: str
    code: str
    status: str = "Unknown"


class CodeReviewResponse(BaseModel):
    review_source: str
    verdict: str
    summary: str
    time_complexity: str
    space_complexity: str
    optimal_solution: str
    improvements: list[str]
    alternative_approach: str
    correctness_analysis: str
    complexity_analysis: str
    maintainability_analysis: str
    interview_readiness: str
    next_steps: list[str]
    confidence: int


class EditorialResponse(BaseModel):
    concept_explanation: str
    step_by_step: list[str]
    optimized_code: str
    tutorial_topic: str | None = None
    tutorial_link: str | None = None
