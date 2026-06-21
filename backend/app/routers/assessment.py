from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.assessment import AssessmentAttempt, AssessmentSession
from app.models.problem import Problem
from app.models.user import User
from app.schemas.assessment import (
    AssessmentProblem,
    AssessmentSubmitRequest,
    AssessmentSubmitResponse,
    AssessmentSummaryResponse,
)
from app.services.testcase_runner import testcase_runner
from app.services.assessment_engine import assessment_engine
from typing import Dict, Any

router = APIRouter(prefix="/assessment", tags=["assessment"])

@router.post("/start")
def start_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    session = assessment_engine.generate_dsa_test(db, current_user.id)
    return {
        "session_id": session.id,
        "type": session.type,
        "problems": session.metrics.get("problems", []),
        "duration_minutes": session.duration_minutes
    }

@router.post("/{session_id}/finalize")
def finalize_assessment(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    session = assessment_engine.finalize_dsa_test(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {
        "status": session.status,
        "score": session.total_score,
        "accuracy": session.accuracy,
        "metrics": session.metrics
    }
    
@router.get("/sessions")
def get_assessment_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Dict[str, Any]]:
    sessions = db.scalars(
        select(AssessmentSession)
        .where(AssessmentSession.user_id == current_user.id)
        .order_by(AssessmentSession.start_time.desc())
    ).all()
    
    return [
        {
            "id": s.id,
            "type": s.type,
            "status": s.status,
            "total_score": s.total_score,
            "accuracy": s.accuracy,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "duration_minutes": s.duration_minutes,
            "metrics": s.metrics or {},
        } for s in sessions
    ]

ASSESSMENT_TOPICS = {"Arrays", "Strings", "Recursion", "Hashing", "Binary Search", "Searching"}
ASSESSMENT_DISTRIBUTION = {"Easy": 5, "Medium": 3, "Hard": 1}


@router.get("/problems", response_model=list[AssessmentProblem])
def get_assessment_problems(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[AssessmentProblem]:
    problems = list(
        db.scalars(
            select(Problem)
            .where(Problem.topic.in_(ASSESSMENT_TOPICS))
            .order_by(Problem.id.asc())
        ).all()
    )

    buckets: dict[str, list[Problem]] = {"Easy": [], "Medium": [], "Hard": []}
    for problem in problems:
        if problem.difficulty in buckets:
            buckets[problem.difficulty].append(problem)

    selected: list[Problem] = []
    for difficulty, count in ASSESSMENT_DISTRIBUTION.items():
        selected.extend(buckets[difficulty][:count])

    return [
        AssessmentProblem(
            id=problem.id,
            title=problem.title,
            difficulty=problem.difficulty,
            topic=problem.topic,
            description=problem.description,
            input_format=problem.input_format,
            output_format=problem.output_format,
            constraints=problem.constraints,
            examples=problem.examples,
        )
        for problem in selected
    ]


@router.post("/submit", response_model=AssessmentSubmitResponse, status_code=status.HTTP_201_CREATED)
def submit_assessment(
    payload: AssessmentSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssessmentSubmitResponse:
    problem = db.get(Problem, payload.problem_id)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    result = testcase_runner.evaluate(
        language=payload.language,
        code=payload.code,
        visible_testcases=problem.visible_testcases,
        hidden_testcases=problem.hidden_testcases,
    )

    attempt = AssessmentAttempt(
        user_id=current_user.id,
        assessment_session_id=payload.session_id,
        problem_id=problem.id,
        language=payload.language,
        code=payload.code,
        status=result.status,
        runtime_ms=result.max_runtime_ms,
        passed_testcases=result.passed,
        total_testcases=result.total,
        time_taken_seconds=payload.time_taken_seconds,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return AssessmentSubmitResponse(
        attempt_id=attempt.id,
        status=attempt.status,
        passed=attempt.passed_testcases,
        total=attempt.total_testcases,
        runtime_ms=attempt.runtime_ms,
    )


@router.get("/summary", response_model=AssessmentSummaryResponse)
def assessment_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssessmentSummaryResponse:
    attempts = list(
        db.scalars(
            select(AssessmentAttempt)
            .where(AssessmentAttempt.user_id == current_user.id)
            .order_by(AssessmentAttempt.created_at.desc())
        ).all()
    )

    solved = sum(1 for item in attempts if item.status == "Accepted")
    total = len(attempts)
    accuracy = round((solved / total) * 100, 2) if total else 0.0
    runtime_values = [item.runtime_ms for item in attempts if item.runtime_ms is not None]
    avg_runtime_ms = round(sum(runtime_values) / len(runtime_values), 2) if runtime_values else 0.0

    diff_stats: dict[str, dict[str, int]] = defaultdict(lambda: {"attempts": 0, "solved": 0})
    topic_stats: dict[str, dict[str, int]] = defaultdict(lambda: {"attempts": 0, "solved": 0})

    for attempt in attempts:
        problem = db.get(Problem, attempt.problem_id)
        if not problem:
            continue
        diff_stats[problem.difficulty]["attempts"] += 1
        topic_stats[problem.topic]["attempts"] += 1
        if attempt.status == "Accepted":
            diff_stats[problem.difficulty]["solved"] += 1
            topic_stats[problem.topic]["solved"] += 1

    diff_success = {
        difficulty: round((values["solved"] / values["attempts"]) * 100, 2) if values["attempts"] else 0.0
        for difficulty, values in diff_stats.items()
    }
    topic_accuracy = {
        topic: round((values["solved"] / values["attempts"]) * 100, 2) if values["attempts"] else 0.0
        for topic, values in topic_stats.items()
    }

    return AssessmentSummaryResponse(
        attempts=total,
        solved=solved,
        accuracy=accuracy,
        avg_runtime_ms=avg_runtime_ms,
        difficulty_success_rate=diff_success,
        topic_accuracy=topic_accuracy,
        last_attempt_at=attempts[0].created_at if attempts else None,
    )
