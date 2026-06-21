from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from typing import Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import get_settings
from app.models.assessment import AssessmentAttempt
from app.models.onboarding import OnboardingSurvey
from app.models.problem import Problem
from app.models.roadmap import RoadmapDay, RoadmapPlan
from app.models.submission import Submission
from app.models.user import User
from app.services.company_engine import company_engine
from app.services.weakness_engine import weakness_engine

DEFAULT_TOPICS = [
    "Arrays",
    "Strings",
    "Recursion",
    "Hashing",
    "Binary Search",
    "Linked List",
    "Stacks",
    "Queues",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Greedy",
    "Backtracking",
]


@dataclass
class StrategyResult:
    provider: str
    focus_topics: list[str]
    feedback: str
    generation_trace: str


class RoadmapEngine:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _normalized_weekly_hours(self, weekly_hours: int | None) -> int:
        if not isinstance(weekly_hours, int):
            return 8
        return max(1, min(80, weekly_hours))

    def _default_topics(self, db: Session) -> list[str]:
        dynamic_topics = [
            topic
            for topic in db.scalars(select(Problem.topic).distinct().order_by(Problem.topic.asc())).all()
            if topic and topic.strip()
        ]
        return dynamic_topics or DEFAULT_TOPICS

    def _topic_cycle(self, db: Session, weak_topics: list[str]) -> list[str]:
        seen: set[str] = set()
        ordered: list[str] = []
        for topic in [*weak_topics, *self._default_topics(db)]:
            if topic in seen:
                continue
            seen.add(topic)
            ordered.append(topic)
        return ordered

    def _build_day(self, day_number: int, topic: str, weekly_hours: int) -> dict[str, object]:
        week_day = ((day_number - 1) % 7) + 1
        if week_day == 7:
            return {
                "task_type": "weekly-review",
                "topic": "Weekly Review",
                "problems_count": 0,
                "estimated_minutes": 60,
                "tutorial_title": "Weekly Review + Mock Interview",
            }

        problems_count = 2 if weekly_hours <= 8 else 3
        if week_day in {3, 6} and weekly_hours >= 12:
            problems_count = 4

        return {
            "task_type": "practice",
            "topic": topic,
            "problems_count": problems_count,
            "estimated_minutes": 90,
            "tutorial_title": f"{topic} Tutorial",
        }

    def _assessment_topic_priority(self, db: Session, user_id: int) -> list[str]:
        attempts = list(
            db.scalars(
                select(AssessmentAttempt)
                .where(AssessmentAttempt.user_id == user_id)
                .order_by(AssessmentAttempt.created_at.desc())
            ).all()
        )
        if not attempts:
            return []

        topic_score: dict[str, float] = {}
        topic_attempts: dict[str, int] = {}

        for attempt in attempts[:50]:
            problem = db.get(Problem, attempt.problem_id)
            if not problem:
                continue

            topic = problem.topic
            topic_attempts[topic] = topic_attempts.get(topic, 0) + 1

            fail_weight = 0.0 if attempt.status == "Accepted" else 1.0
            difficulty_weight = {
                "Easy": 1.0,
                "Medium": 1.4,
                "Hard": 1.8,
            }.get(problem.difficulty, 1.0)
            coverage_penalty = 1.0 / max(1, topic_attempts[topic])

            topic_score[topic] = topic_score.get(topic, 0.0) + (fail_weight * difficulty_weight) + coverage_penalty

        ranked = sorted(topic_score.items(), key=lambda item: item[1], reverse=True)
        return [topic for topic, _ in ranked if topic]

    def _sanitize_focus_topics(self, db: Session, topics: list[str], weak_topics: list[str]) -> list[str]:
        weak_lookup = {topic.lower(): topic for topic in weak_topics}
        default_lookup = {topic.lower(): topic for topic in self._default_topics(db)}

        normalized: list[str] = []
        seen: set[str] = set()
        for raw_topic in topics:
            key = raw_topic.strip().lower()
            if not key:
                continue
            canonical = weak_lookup.get(key) or default_lookup.get(key)
            if canonical and canonical not in seen:
                normalized.append(canonical)
                seen.add(canonical)
        return normalized

    def _build_ai_prompt(
        self,
        user: User,
        survey: OnboardingSurvey,
        weekly_hours: int,
        weak_topics: list[str],
        assessment_topics: list[str],
        company_weights: dict[str, float],
    ) -> str:
        company_priority = sorted(company_weights.items(), key=lambda item: item[1], reverse=True)
        weak_text = ", ".join(weak_topics[:10]) if weak_topics else "No strong weak signal yet"
        assessment_text = ", ".join(assessment_topics[:5]) if assessment_topics else "No assessment attempts"
        company_text = ", ".join(f"{topic}:{weight:.2f}" for topic, weight in company_priority[:8])
        companies = ", ".join(survey.target_companies) if survey.target_companies else "General interview prep"

        return (
            "You are an interview prep roadmap planner. Return STRICT JSON only with keys: "
            "focus_topics (array of 3 to 8 strings), rationale (string under 250 chars). "
            "Do not include markdown, comments, or extra fields.\n\n"
            f"User id: {user.id}\n"
            f"Current year: {survey.current_year}\n"
            f"Skill level: {survey.dsa_experience_level}\n"
            f"Preferred language: {survey.preferred_language}\n"
            f"Target companies: {companies}\n"
            f"Weekly study hours: {weekly_hours}\n"
            f"Goal timeline months: {survey.goal_timeline_months}\n"
            f"Weak topics from behavior: {weak_text}\n"
            f"Assessment weak topics: {assessment_text}\n"
            f"Company topic weights: {company_text if company_text else 'N/A'}\n"
            "Favor interview-relevant, weak, and company-priority topics first."
        )

    def _json_request(self, url: str, payload: dict[str, object], headers: dict[str, str]) -> dict[str, object]:
        request = Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", **headers},
            method="POST",
        )
        timeout = max(3, self.settings.roadmap_ai_timeout_seconds)
        with urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw)

    def _extract_json_block(self, text: str) -> dict[str, object]:
        stripped = text.strip()
        if stripped.startswith("```"):
            stripped = stripped.replace("```json", "").replace("```", "").strip()

        start = stripped.find("{")
        end = stripped.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("Model response does not include JSON object")

        return json.loads(stripped[start : end + 1])

    def _call_gemini(self, prompt: str) -> dict[str, object]:
        if not self.settings.gemini_api_key:
            raise ValueError("Gemini API key missing")

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.settings.gemini_model}:generateContent?key={self.settings.gemini_api_key}"
        )
        response = self._json_request(
            url,
            payload={"contents": [{"parts": [{"text": prompt}]}]},
            headers={},
        )
        candidates = response.get("candidates") or []
        if not candidates:
            raise ValueError("Gemini returned empty candidates")

        parts = (((candidates[0] or {}).get("content") or {}).get("parts") or [])
        text = "".join(str(part.get("text", "")) for part in parts)
        return self._extract_json_block(text)

    def _call_groq(self, prompt: str) -> dict[str, object]:
        if not self.settings.groq_api_key:
            raise ValueError("Groq API key missing")

        response = self._json_request(
            "https://api.groq.com/openai/v1/chat/completions",
            payload={
                "model": self.settings.groq_model,
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": "You produce strict JSON only."},
                    {"role": "user", "content": prompt},
                ],
            },
            headers={"Authorization": f"Bearer {self.settings.groq_api_key}"},
        )
        choices = response.get("choices") or []
        if not choices:
            raise ValueError("Groq returned empty choices")

        content = (((choices[0] or {}).get("message") or {}).get("content") or "")
        return self._extract_json_block(str(content))

    def _derive_strategy(
        self,
        db: Session,
        user: User,
        survey: OnboardingSurvey,
        weekly_hours: int,
        weak_topics: list[str],
        assessment_topics: list[str],
        company_weights: dict[str, float],
    ) -> StrategyResult:
        prompt = self._build_ai_prompt(
            user=user,
            survey=survey,
            weekly_hours=weekly_hours,
            weak_topics=weak_topics,
            assessment_topics=assessment_topics,
            company_weights=company_weights,
        )

        providers: list[tuple[str, Callable[[str], dict[str, object]]]] = [
            ("gemini", self._call_gemini),
            ("groq", self._call_groq),
        ]
        failures: list[str] = []

        for provider_name, provider_call in providers:
            try:
                payload = provider_call(prompt)
                raw_topics = payload.get("focus_topics")
                if not isinstance(raw_topics, list):
                    raise ValueError("focus_topics must be an array")

                clean_topics = self._sanitize_focus_topics(db, [str(item) for item in raw_topics], weak_topics)
                if not clean_topics:
                    raise ValueError("No valid focus topics from provider")

                rationale = str(payload.get("rationale") or "Roadmap personalized using AI topic prioritization.")
                return StrategyResult(
                    provider=provider_name,
                    focus_topics=clean_topics,
                    feedback=rationale[:280],
                    generation_trace=f"{provider_name} succeeded",
                )
            except (ValueError, KeyError, HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
                failures.append(f"{provider_name}: {exc}")

        fallback_topics = self._topic_cycle(db, [*assessment_topics[:5], *weak_topics[:6]])[:8]
        return StrategyResult(
            provider="rule-based",
            focus_topics=fallback_topics,
            feedback="AI providers unavailable. Generated roadmap using behavior, assessment, and company-priority rules.",
            generation_trace=" | ".join(failures) if failures else "No AI providers configured",
        )

    def generate_initial_roadmap(self, db: Session, user: User) -> RoadmapPlan:
        survey = db.scalar(select(OnboardingSurvey).where(OnboardingSurvey.user_id == user.id))
        if not survey:
            raise ValueError("Survey must be submitted before generating roadmap")

        company_weights = company_engine.get_company_weights(db, survey.target_companies)
        weakness = weakness_engine.compute_topic_weakness(db, user.id, company_weights)
        behavior_topics = [item.topic for item in weakness[:6]]
        assessment_topics = self._assessment_topic_priority(db, user.id)
        weak_topics = [*assessment_topics[:5], *behavior_topics]
        weekly_hours = self._normalized_weekly_hours(survey.weekly_study_hours)

        strategy = self._derive_strategy(
            user=user,
            survey=survey,
            weekly_hours=weekly_hours,
            weak_topics=weak_topics,
            assessment_topics=assessment_topics,
            company_weights=company_weights,
            db=db,
        )
        topic_cycle = self._topic_cycle(db, strategy.focus_topics)

        existing_plans = list(
            db.scalars(select(RoadmapPlan).where(RoadmapPlan.user_id == user.id, RoadmapPlan.is_active.is_(True))).all()
        )
        for existing_plan in existing_plans:
            existing_plan.is_active = False

        feedback_chunks = [strategy.feedback]
        if assessment_topics and strategy.provider == "rule-based":
            feedback_chunks.append(f"Assessment signals prioritized: {', '.join(assessment_topics[:3])}.")

        plan = RoadmapPlan(
            user_id=user.id,
            start_date=date.today(),
            week_number=1,
            is_active=True,
            generated_reason="initial",
            ai_provider=strategy.provider,
            generation_trace=strategy.generation_trace,
            ai_feedback=" ".join(feedback_chunks),
        )
        db.add(plan)
        db.flush()

        for day in range(1, 31):
            topic = topic_cycle[(day - 1) % len(topic_cycle)]
            spec = self._build_day(day, topic, weekly_hours)
            tutorial_link = self._pick_tutorial_link(db, topic)
            db.add(
                RoadmapDay(
                    plan_id=plan.id,
                    day_number=day,
                    week_number=((day - 1) // 7) + 1,
                    topic=str(spec["topic"]),
                    problems_count=int(spec["problems_count"]),
                    tutorial_title=str(spec["tutorial_title"]),
                    tutorial_link=tutorial_link,
                    estimated_minutes=int(spec["estimated_minutes"]),
                    task_type=str(spec["task_type"]),
                )
            )

        db.commit()
        db.refresh(plan)
        return plan

    def refresh_weekly(self, db: Session, user: User) -> tuple[RoadmapPlan, list[str]]:
        survey = db.scalar(select(OnboardingSurvey).where(OnboardingSurvey.user_id == user.id))
        if not survey:
            raise ValueError("Survey must be submitted before refreshing roadmap")

        company_weights = company_engine.get_company_weights(db, survey.target_companies)
        weakness = weakness_engine.compute_topic_weakness(db, user.id, company_weights)
        insights = weakness_engine.detect_behavior_patterns(weakness)

        plan = self.generate_initial_roadmap(db, user)
        plan.generated_reason = "weekly-refresh"
        plan.ai_feedback = " ".join(insights) if insights else plan.ai_feedback
        db.commit()
        db.refresh(plan)
        return plan, insights

    def mark_day_complete(self, db: Session, user_id: int, day_id: int) -> RoadmapDay:
        day = db.get(RoadmapDay, day_id)
        if not day:
            raise ValueError("Roadmap day not found")

        plan = db.get(RoadmapPlan, day.plan_id)
        if not plan or plan.user_id != user_id:
            raise ValueError("Roadmap day not found")

        day.is_completed = True
        db.commit()
        db.refresh(day)
        return day

    def mark_progress_for_problem(self, db: Session, user_id: int, problem_id: int) -> bool:
        plan = self.get_active_plan(db, user_id)
        if not plan:
            return False

        problem = db.get(Problem, problem_id)
        if not problem:
            return False

        topic = problem.topic.strip().lower()
        target_day = next(
            (
                day
                for day in sorted(plan.days, key=lambda item: item.day_number)
                if day.task_type == "practice" and not day.is_completed and day.topic.strip().lower() == topic
            ),
            None,
        )
        if not target_day:
            return False

        target_day.is_completed = True

        weekly_review_days = [day for day in plan.days if day.task_type == "weekly-review"]
        for review_day in weekly_review_days:
            week_practice_days = [
                item
                for item in plan.days
                if item.week_number == review_day.week_number and item.task_type == "practice"
            ]
            if week_practice_days and all(item.is_completed for item in week_practice_days):
                review_day.is_completed = True

        db.commit()
        return True

    def sync_progress_for_recent_accept(self, db: Session, user_id: int, problem_id: int | None = None) -> None:
        if problem_id is not None:
            self.mark_progress_for_problem(db, user_id, problem_id)
            return

        plan = self.get_active_plan(db, user_id)
        if not plan:
            return
        self._sync_completion_from_behavior(db, plan)

    def _sync_completion_from_behavior(self, db: Session, plan: RoadmapPlan) -> None:
        accepted_submissions = list(
            db.scalars(
                select(Submission)
                .where(Submission.user_id == plan.user_id, Submission.status == "Accepted")
                .order_by(Submission.created_at.asc())
            ).all()
        )

        topic_accepts: dict[str, int] = {}
        for submission in accepted_submissions:
            problem = db.get(Problem, submission.problem_id)
            if not problem:
                continue
            topic = problem.topic.strip()
            topic_accepts[topic] = topic_accepts.get(topic, 0) + 1

        updated = False
        days_sorted = sorted(plan.days, key=lambda day: day.day_number)
        for day in days_sorted:
            next_state = day.is_completed
            if day.task_type == "practice":
                available = topic_accepts.get(day.topic, 0)
                if available >= max(1, day.problems_count):
                    next_state = True
                    topic_accepts[day.topic] = available - max(1, day.problems_count)
                else:
                    next_state = False
            elif day.task_type == "weekly-review":
                prior_week_days = [
                    item
                    for item in days_sorted
                    if item.week_number == day.week_number and item.day_number < day.day_number and item.task_type == "practice"
                ]
                next_state = len(prior_week_days) > 0 and all(item.is_completed for item in prior_week_days)

            if day.is_completed != next_state:
                day.is_completed = next_state
                updated = True

        if updated:
            db.commit()

    def get_active_plan(self, db: Session, user_id: int) -> RoadmapPlan | None:
        plan = db.scalar(
            select(RoadmapPlan)
            .options(selectinload(RoadmapPlan.days))
            .where(RoadmapPlan.user_id == user_id, RoadmapPlan.is_active.is_(True))
            .order_by(RoadmapPlan.created_at.desc())
        )
        if plan:
            self._sync_completion_from_behavior(db, plan)
            db.refresh(plan)
        return plan

    def _pick_tutorial_link(self, db: Session, topic: str) -> str | None:
        candidate = db.scalar(select(Problem.tutorial_link).where(Problem.topic == topic, Problem.tutorial_link.is_not(None)))
        return candidate


roadmap_engine = RoadmapEngine()
