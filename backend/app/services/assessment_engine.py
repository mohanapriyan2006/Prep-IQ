import random
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func
from app.models.problem import Problem
from app.models.assessment import AssessmentSession, AssessmentAttempt
from datetime import datetime

class AssessmentEngine:
    """
    Manages generation and evaluation of DSA Assessment Tests.
    """
    
    @classmethod
    def generate_dsa_test(cls, db: Session, user_id: int) -> AssessmentSession:
        """
        Create a new assessment session featuring 9 problems 
        (5 Easy, 3 Medium, 1 Hard) from core topics.
        """
        core_topics = ["Arrays", "Strings", "Recursion", "Hashing", "Binary Search"]
        
        # Helper to fetch random problems
        def fetch_problems(difficulty: str, limit: int) -> List[Problem]:
            # This uses standard SQL random sorting, could be optimized later
            return db.scalars(
                select(Problem)
                .where(
                    and_(
                        Problem.difficulty == difficulty,
                        Problem.topic.in_(core_topics)
                    )
                )
                .order_by(func.random())
                .limit(limit)
            ).all()

        easy_problems = fetch_problems("Easy", 5)
        medium_problems = fetch_problems("Medium", 3)
        hard_problems = fetch_problems("Hard", 1)
        
        selected_problems = easy_problems + medium_problems + hard_problems
        
        session = AssessmentSession(
            user_id=user_id,
            type="dsa-test",
            status="in-progress",
            duration_minutes=90,
            metrics={
                "problems": [{"id": p.id, "title": p.title, "difficulty": p.difficulty, "topic": p.topic} for p in selected_problems]
            }
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return session
        
    @classmethod
    def finalize_dsa_test(cls, db: Session, session_id: int) -> AssessmentSession:
        """Calculate metrics and mark assessment as completed"""
        session = db.get(AssessmentSession, session_id)
        if not session or session.status == "completed":
            return session
            
        attempts = db.scalars(
            select(AssessmentAttempt).where(AssessmentAttempt.assessment_session_id == session_id)
        ).all()
        
        total_problems = len(session.metrics.get("problems", []))
        passed_problems = 0
        total_time = 0
        total_attempts = len(attempts)
        
        # Track by problem to prevent double counting
        problem_status = {}
        
        for attempt in attempts:
            pid = attempt.problem_id
            if attempt.time_taken_seconds:
                total_time += attempt.time_taken_seconds
                
            if pid not in problem_status or problem_status[pid] != "Accepted":
                problem_status[pid] = attempt.status
                
            # Update problem status if Accepted
            if attempt.status == "Accepted":
                problem_status[pid] = "Accepted"
                
        passed_problems = sum(1 for status in problem_status.values() if status == "Accepted")
        
        session.end_time = datetime.utcnow()
        session.status = "completed"
        session.total_score = passed_problems
        session.accuracy = (passed_problems / total_attempts * 100) if total_attempts > 0 else 0
        
        # Add detailed metrics to JSON
        metrics = session.metrics or {}
        metrics.update({
            "total_attempts": total_attempts,
            "completion_percentage": (passed_problems / total_problems * 100) if total_problems > 0 else 0,
            "average_time_per_problem": total_time / total_problems if total_problems > 0 else 0
        })
        session.metrics = metrics
        
        db.commit()
        db.refresh(session)
        
        return session

assessment_engine = AssessmentEngine()
