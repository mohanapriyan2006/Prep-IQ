from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session
from urllib.parse import quote_plus

from app.database import get_db
from app.dependencies import get_current_user
from app.models.problem import Problem
from app.models.submission import Submission
from app.models.user import User
from app.schemas.roadmap import (
    RoadmapDayDetailResponse,
    RoadmapDayProblemItem,
    RoadmapDayRead,
    RoadmapRead,
    RoadmapRefreshResponse,
)
from app.services.roadmap_engine import roadmap_engine

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


def _to_response(plan) -> RoadmapRead:
    sorted_days = sorted(plan.days, key=lambda day: day.day_number)
    return RoadmapRead(
        id=plan.id,
        start_date=plan.start_date,
        week_number=plan.week_number,
        generated_reason=plan.generated_reason,
        ai_provider=plan.ai_provider,
        generation_trace=plan.generation_trace,
        ai_feedback=plan.ai_feedback,
        created_at=plan.created_at,
        days=[
            RoadmapDayRead(
                id=day.id,
                day_number=day.day_number,
                week_number=day.week_number,
                topic=day.topic,
                problems_count=day.problems_count,
                tutorial_title=day.tutorial_title,
                tutorial_link=day.tutorial_link,
                estimated_minutes=day.estimated_minutes,
                task_type=day.task_type,
                is_completed=day.is_completed,
            )
            for day in sorted_days
        ],
    )


@router.post("/generate", response_model=RoadmapRead)
def generate_roadmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoadmapRead:
    try:
        plan = roadmap_engine.generate_initial_roadmap(db, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return _to_response(plan)


@router.get("", response_model=RoadmapRead)
def get_roadmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoadmapRead:
    plan = roadmap_engine.get_active_plan(db, current_user.id)
    if not plan:
        raise HTTPException(status_code=404, detail="No roadmap found")
    return _to_response(plan)


@router.post("/refresh", response_model=RoadmapRefreshResponse)
def refresh_roadmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoadmapRefreshResponse:
    try:
        plan, insights = roadmap_engine.refresh_weekly(db, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return RoadmapRefreshResponse(roadmap=_to_response(plan), insights=insights)


@router.post("/day/{day_id}/complete", response_model=RoadmapDayRead)
def complete_roadmap_day(
    day_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoadmapDayRead:
    try:
        day = roadmap_engine.mark_day_complete(db, current_user.id, day_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return RoadmapDayRead(
        id=day.id,
        day_number=day.day_number,
        week_number=day.week_number,
        topic=day.topic,
        problems_count=day.problems_count,
        tutorial_title=day.tutorial_title,
        tutorial_link=day.tutorial_link,
        estimated_minutes=day.estimated_minutes,
        task_type=day.task_type,
        is_completed=day.is_completed,
    )


@router.get("/day/{day_id}/details", response_model=RoadmapDayDetailResponse)
def get_roadmap_day_details(
    day_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoadmapDayDetailResponse:
    plan = roadmap_engine.get_active_plan(db, current_user.id)
    if not plan:
        raise HTTPException(status_code=404, detail="No roadmap found")

    day = next((item for item in plan.days if item.id == day_id), None)
    if not day:
        raise HTTPException(status_code=404, detail="Roadmap day not found")

    accepted_problem_ids = {
        row[0]
        for row in db.execute(
            select(Submission.problem_id).where(
                and_(
                    Submission.user_id == current_user.id,
                    Submission.status == "Accepted",
                )
            )
        ).all()
    }

    candidates = list(
        db.scalars(
            select(Problem)
            .where(Problem.topic == day.topic)
            .order_by(Problem.id.asc())
        ).all()
    )
    problems = candidates[: max(1, day.problems_count)]

    continue_problem = next((item for item in problems if item.id not in accepted_problem_ids), None)
    if not continue_problem and problems:
        continue_problem = problems[0]

    status = "Pending"
    if day.is_completed:
        status = "Completed"
    elif continue_problem:
        status = "In Progress"

    topic_query = quote_plus(day.topic)

    return RoadmapDayDetailResponse(
        id=day.id,
        day_number=day.day_number,
        week_number=day.week_number,
        topic=day.topic,
        estimated_minutes=day.estimated_minutes,
        task_type=day.task_type,
        tutorial_title=day.tutorial_title,
        tutorial_link=day.tutorial_link,
        tutorial_path=f"/tutorials?topic={topic_query}",
        practice_path=f"/problems?topic={topic_query}",
        external_resource_link=day.tutorial_link,
        status=status,
        continue_problem_id=continue_problem.id if continue_problem else None,
        continue_problem_path=(
            f"/problems/{continue_problem.id}?roadmapDay={day.day_number}&source=roadmap"
            if continue_problem
            else None
        ),
        problems=[
            RoadmapDayProblemItem(
                id=item.id,
                title=item.title,
                difficulty=item.difficulty,
                topic=item.topic,
                tutorial_link=item.tutorial_link,
                problem_path=f"/problems/{item.id}",
                editorial_path=f"/problems/{item.id}?tab=editorial&roadmapDay={day.day_number}&source=roadmap",
            )
            for item in problems
        ],
    )
