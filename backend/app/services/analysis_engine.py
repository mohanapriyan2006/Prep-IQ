from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session
import random
import random

from app.models.activity_log import ActivityLog
from app.models.mock_test import MockTestAttempt
from app.models.onboarding import OnboardingSurvey
from app.models.problem import Problem
from app.models.submission import Submission
from app.models.user import User
from app.models.user_metrics import TopicMetric, UserMetric
from app.services.analytics_engine import analytics_engine
from app.services.company_engine import company_engine
from app.services.roadmap_engine import roadmap_engine
from app.services.weakness_engine import weakness_engine


class AnalysisEngine:
    def log_activity(self, db: Session, user_id: int, action: str, metadata: dict | None = None) -> None:
        db.add(ActivityLog(user_id=user_id, action=action, event_metadata=metadata or {}))
        db.commit()

    def _trend(self, attempts: int, accepted: int, avg_runtime_ms: float) -> str:
        if attempts < 3:
            return "early"
        if accepted / max(1, attempts) >= 0.7 and avg_runtime_ms <= 1500:
            return "improving"
        if accepted / max(1, attempts) < 0.45:
            return "stuck"
        return "stable"

    def recompute_metrics(self, db: Session, user_id: int) -> None:
        submissions = list(db.scalars(select(Submission).where(Submission.user_id == user_id)).all())
        total = len(submissions)

        topic_stats: dict[str, dict[str, float]] = defaultdict(
            lambda: {
                "attempts": 0.0,
                "accepted": 0.0,
                "runtime_total": 0.0,
                "runtime_count": 0.0,
                "easy_attempts": 0.0,
                "easy_accepted": 0.0,
                "medium_attempts": 0.0,
                "medium_accepted": 0.0,
                "hard_attempts": 0.0,
                "hard_accepted": 0.0,
            }
        )

        for submission in submissions:
            problem = db.get(Problem, submission.problem_id)
            if not problem:
                continue
            topic = problem.topic
            stats = topic_stats[topic]
            stats["attempts"] += 1
            if submission.status == "Accepted":
                stats["accepted"] += 1

            if submission.runtime_ms is not None:
                stats["runtime_total"] += float(submission.runtime_ms)
                stats["runtime_count"] += 1

            level = problem.difficulty.lower()
            stats[f"{level}_attempts"] += 1
            if submission.status == "Accepted":
                stats[f"{level}_accepted"] += 1

        existing_user_metrics = {
            (item.topic): item
            for item in db.scalars(select(UserMetric).where(UserMetric.user_id == user_id)).all()
        }
        existing_topic_metrics = {
            (item.topic): item
            for item in db.scalars(select(TopicMetric).where(TopicMetric.user_id == user_id)).all()
        }

        for topic, stats in topic_stats.items():
            attempts = int(stats["attempts"])
            accepted = int(stats["accepted"])
            avg_runtime = stats["runtime_total"] / max(1.0, stats["runtime_count"])
            accuracy = round((accepted / max(1, attempts)) * 100, 2)
            trend = self._trend(attempts, accepted, avg_runtime)

            difficulty_success_rate = {
                "easy": round((stats["easy_accepted"] / max(1.0, stats["easy_attempts"])) * 100, 2),
                "medium": round((stats["medium_accepted"] / max(1.0, stats["medium_attempts"])) * 100, 2),
                "hard": round((stats["hard_accepted"] / max(1.0, stats["hard_attempts"])) * 100, 2),
            }

            user_metric = existing_user_metrics.get(topic)
            if not user_metric:
                user_metric = UserMetric(user_id=user_id, topic=topic)
                db.add(user_metric)
            user_metric.accuracy = accuracy
            user_metric.avg_time_ms = round(avg_runtime, 2)
            user_metric.attempts = attempts
            user_metric.solved = accepted
            user_metric.learning_trend = trend
            user_metric.difficulty_success_rate = difficulty_success_rate

            topic_metric = existing_topic_metrics.get(topic)
            if not topic_metric:
                topic_metric = TopicMetric(user_id=user_id, topic=topic)
                db.add(topic_metric)
            topic_metric.attempts = attempts
            topic_metric.accepted = accepted
            topic_metric.avg_runtime_ms = round(avg_runtime, 2)
            topic_metric.topic_frequency = round((attempts / max(1, total)) * 100, 2)

        db.commit()

    def store_mock_test(self, db: Session, user_id: int, payload: dict[str, object]) -> None:
        attempt = MockTestAttempt(
            user_id=user_id,
            mode=str(payload.get("mode") or "overall"),
            category=payload.get("category") if isinstance(payload.get("category"), str) else None,
            score=int(payload.get("score") or 0),
            accuracy=float(payload.get("accuracy") or 0.0),
            time_taken_minutes=int(payload.get("time_taken_minutes") or 0),
            completion_percent=float(payload.get("completion_percent") or 0.0),
            problem_ids=[int(item) for item in (payload.get("problem_ids") or [])],
            topics=[str(item) for item in (payload.get("topics") or [])],
            weak_areas=[str(item) for item in (payload.get("weak_areas") or [])],
            per_problem_time=payload.get("per_problem_time") if isinstance(payload.get("per_problem_time"), dict) else {},
        )
        db.add(attempt)
        db.commit()


    def detect_learning_patterns(self, db: Session, user_id: int) -> list[str]:
        metrics = db.scalars(select(TopicMetric).where(TopicMetric.user_id == user_id)).all()
        patterns = []
        for m in metrics:
            if m.avg_runtime_ms > 2000:
                patterns.append(f"You spend a longer time than average on {m.topic}. Consider timing your practice.")
            elif m.avg_runtime_ms < 800 and m.accepted > 3:
                patterns.append(f"You are a fast learner in {m.topic}! Try harder problems.")
        
        if not patterns:
            patterns.append("Your learning pattern is stable across topics.")
            
        return patterns[:3]

    def generate_smart_recommendations(self, db: Session, weak_topics: list[str], target_companies: list[str]) -> list[dict]:
        recommendations = []
        if not weak_topics:
            return recommendations
            
        for topic in weak_topics[:2]: # Top 2 weak topics
            company_context = f" for {target_companies[0]}" if target_companies else ""
            
            # Find a problem
            problems = list(db.scalars(select(Problem).where(Problem.topic == topic, Problem.difficulty == "Medium")).all())
            rec_prob = random.choice(problems) if problems else None
            
            if rec_prob:
                recommendations.append({
                    "title": f"Practice more {topic}",
                    "reason": f"You are weak at {topic}. Practicing this will improve your chances{company_context}.",
                    "action_item": f"Solve {rec_prob.title}",
                    "problem_id": rec_prob.id
                })
        
        return recommendations


    def detect_learning_patterns(self, db: Session, user_id: int) -> list[str]:
        metrics = db.scalars(select(TopicMetric).where(TopicMetric.user_id == user_id)).all()
        patterns = []
        for m in metrics:
            if m.avg_runtime_ms > 2000:
                patterns.append(f"You spend a longer time than average on {m.topic}. Consider timing your practice.")
            elif m.avg_runtime_ms < 800 and m.accepted > 3:
                patterns.append(f"You are a fast learner in {m.topic}! Try harder problems.")
        
        if not patterns:
            patterns.append("Your learning pattern is stable across topics.")
            
        return patterns[:3]

    def generate_smart_recommendations(self, db: Session, weak_topics: list[str], target_companies: list[str]) -> list[dict]:
        recommendations = []
        if not weak_topics:
            return recommendations
            
        for topic in weak_topics[:2]: # Top 2 weak topics
            company_context = f" for {target_companies[0]}" if target_companies else ""
            
            # Find a problem
            problems = list(db.scalars(select(Problem).where(Problem.topic == topic, Problem.difficulty == "Medium")).all())
            rec_prob = random.choice(problems) if problems else None
            
            if rec_prob:
                recommendations.append({
                    "title": f"Practice more {topic}",
                    "reason": f"You are weak at {topic}. Practicing this will improve your chances{company_context}.",
                    "action_item": f"Solve {rec_prob.title}",
                    "problem_id": rec_prob.id
                })
        
        return recommendations

    def analyze_user(self, db: Session, user_id: int, trigger: str, auto_refresh: bool = True) -> dict[str, object]:
        self.recompute_metrics(db, user_id)

        survey = db.scalar(select(OnboardingSurvey).where(OnboardingSurvey.user_id == user_id))
        companies = survey.target_companies if survey else []

        topic_strength = analytics_engine.topic_strength(db, user_id, companies)
        weak_topics = [item["topic"] for item in topic_strength if item.get("classification") == "weak"]

        company_weights = company_engine.get_company_weights(db, companies)
        weakness = weakness_engine.compute_topic_weakness(db, user_id, company_weights)
        readiness = company_engine.readiness_by_company(db, weakness)

        roadmap_refreshed = False
        refresh_error = None
        if auto_refresh and trigger in {"problem_submission", "mock_test_completion", "manual", "weekly", "login"}:
            try:
                plan = roadmap_engine.get_active_plan(db, user_id)
                if plan:
                    roadmap_engine.sync_progress_for_recent_accept(db, user_id)
                    user = db.get(User, user_id)
                    if user:
                        plan, _ = roadmap_engine.refresh_weekly(db, user)
                roadmap_refreshed = plan is not None
            except Exception as exc:  # noqa: BLE001
                refresh_error = str(exc)

        self.log_activity(
            db,
            user_id,
            "ai_analysis",
            {
                "trigger": trigger,
                "weak_topics": weak_topics[:5],
                "roadmap_refreshed": roadmap_refreshed,
                "refresh_error": refresh_error,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

        patterns = self.detect_learning_patterns(db, user_id)
        recommendations = self.generate_smart_recommendations(db, weak_topics, companies)

        return {
            "trigger": trigger,
            "topic_strength": topic_strength,
            "weak_topics": weak_topics,
            "readiness": readiness,
            "roadmap_refreshed": roadmap_refreshed,
            "refresh_error": refresh_error,
            "learning_patterns": patterns,
            "recommendations": recommendations,
        }


analysis_engine = AnalysisEngine()
