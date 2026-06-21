from __future__ import annotations

import json
from urllib.request import Request, urlopen

from app.config import get_settings
from app.models.problem import Problem


class CodeReviewService:
    def __init__(self) -> None:
        self.settings = get_settings()

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

    def _review_prompt(
        self,
        problem: Problem,
        code: str,
        language: str,
        status: str,
        fallback: dict[str, object],
    ) -> str:
        return (
            "You are an expert coding interview reviewer. Return STRICT JSON only with keys: "
            "verdict, summary, time_complexity, space_complexity, optimal_solution, improvements, "
            "alternative_approach, correctness_analysis, complexity_analysis, maintainability_analysis, "
            "interview_readiness, next_steps, confidence. "
            "improvements and next_steps must be string arrays with 3 to 7 items each. confidence is integer 0-100.\n\n"
            f"Problem title: {problem.title}\n"
            f"Topic: {problem.topic}\n"
            f"Difficulty: {problem.difficulty}\n"
            f"Last execution status: {status}\n"
            f"Language: {language}\n"
            f"Code:\n{code}\n\n"
            "Baseline heuristic review context (can improve or correct this):\n"
            f"{json.dumps(fallback)}"
        )

    def _normalize_ai_review(self, payload: dict[str, object], fallback: dict[str, object], source: str) -> dict[str, object]:
        improvements = [str(item).strip() for item in (payload.get("improvements") or []) if str(item).strip()]
        next_steps = [str(item).strip() for item in (payload.get("next_steps") or []) if str(item).strip()]

        if not improvements:
            improvements = list(fallback["improvements"])
        if not next_steps:
            next_steps = list(fallback["next_steps"])

        confidence_raw = payload.get("confidence")
        try:
            confidence = int(confidence_raw)
        except (TypeError, ValueError):
            confidence = int(fallback["confidence"])

        return {
            "review_source": source,
            "verdict": str(payload.get("verdict") or fallback["verdict"]),
            "summary": str(payload.get("summary") or fallback["summary"]),
            "time_complexity": str(payload.get("time_complexity") or fallback["time_complexity"]),
            "space_complexity": str(payload.get("space_complexity") or fallback["space_complexity"]),
            "optimal_solution": str(payload.get("optimal_solution") or fallback["optimal_solution"]),
            "improvements": improvements[:7],
            "alternative_approach": str(payload.get("alternative_approach") or fallback["alternative_approach"]),
            "correctness_analysis": str(payload.get("correctness_analysis") or fallback["correctness_analysis"]),
            "complexity_analysis": str(payload.get("complexity_analysis") or fallback["complexity_analysis"]),
            "maintainability_analysis": str(payload.get("maintainability_analysis") or fallback["maintainability_analysis"]),
            "interview_readiness": str(payload.get("interview_readiness") or fallback["interview_readiness"]),
            "next_steps": next_steps[:7],
            "confidence": max(0, min(100, confidence)),
        }

    def _rule_based_review(self, problem: Problem, code: str, language: str, status: str) -> dict[str, object]:
        code_len = len(code.strip())
        loops = code.count("for") + code.count("while")
        map_usage = any(token in code for token in ["unordered_map", "HashMap", "dict(", "{}", "Map<"])

        complexity = "O(n)"
        if loops >= 2 and not map_usage:
            complexity = "O(n^2)"
        elif loops >= 3:
            complexity = "O(n^3)"

        optimal_hint = "Try hash-based lookup or two-pointer simplification where applicable."
        if problem.topic.lower() in {"binary search", "arrays"}:
            optimal_hint = "Use monotonic condition checks and reduce comparisons inside loops."
        if problem.topic.lower() in {"graphs", "trees"}:
            optimal_hint = "Prefer adjacency-list traversal and avoid repeated full scans."

        improvements: list[str] = []
        if code_len < 40:
            improvements.append("Implementation looks incomplete; add edge-case handling and return path.")
        if "print(" in code and language != "python":
            improvements.append("Avoid debug printing in final submission path.")
        if loops >= 2:
            improvements.append("Nested iteration detected; evaluate whether one-pass indexing can reduce runtime.")
        if not improvements:
            improvements.append("Code structure is clean. Add comments for tricky branches and corner cases.")

        alternative = "Use preprocessing + lookup table to trade small memory for faster execution."
        if problem.topic.lower() == "dynamic programming":
            alternative = "Try bottom-up tabulation if recursive state transitions are repeated."

        verdict = "Solution accepted and reasonably efficient."
        if status != "Accepted":
            verdict = "Solution is not accepted yet; validate constraints and boundary cases first."
        elif complexity != "O(n)":
            verdict = "Solution is correct but likely not optimal for larger constraints."

        return {
            "review_source": "rule-based",
            "verdict": verdict,
            "summary": f"{problem.topic} solution review generated using deterministic analysis.",
            "time_complexity": complexity,
            "space_complexity": "O(n)" if map_usage else "O(1) to O(n)",
            "optimal_solution": optimal_hint,
            "improvements": improvements,
            "alternative_approach": alternative,
            "correctness_analysis": "Re-check boundary cases, empty inputs, and duplicate handling before final submission.",
            "complexity_analysis": f"Current complexity estimate is {complexity}. Verify this against max constraints.",
            "maintainability_analysis": "Use smaller helper blocks and descriptive variable names to improve readability.",
            "interview_readiness": "Explain chosen data structures, complexity tradeoffs, and failure cases clearly.",
            "next_steps": [
                "Run custom edge-case tests beyond sample inputs.",
                "Validate complexity for worst-case constraints.",
                "Refactor repetitive branches into helper functions.",
            ],
            "confidence": 62 if status == "Accepted" else 48,
        }

    def review(self, problem: Problem, code: str, language: str, status: str) -> dict[str, object]:
        fallback = self._rule_based_review(problem, code, language, status)
        prompt = self._review_prompt(problem, code, language, status, fallback)
        providers: list[tuple[str, callable]] = [
            ("gemini", self._call_gemini),
            ("groq", self._call_groq),
        ]

        for provider_name, provider_call in providers:
            try:
                payload = provider_call(prompt)
                return self._normalize_ai_review(payload, fallback, provider_name)
            except Exception:
                continue

        return fallback

    def editorial(self, problem: Problem) -> dict[str, object]:
        topic = problem.topic
        if problem.editorial:
            approaches = problem.editorial.approaches or {}
            editorial_steps = [
                str(step).strip()
                for step in approaches.get("steps", [])
                if str(step).strip()
            ]
            if not editorial_steps:
                editorial_steps = [
                    "Read constraints and identify the limiting operation.",
                    "Model a deterministic state transition and test boundary cases.",
                    "Optimize redundant scans and memory-heavy operations.",
                ]

            code_payload = problem.editorial.solution_code or {}
            optimized_code = str(
                code_payload.get("python")
                or code_payload.get("cpp")
                or code_payload.get("java")
                or problem.editorial.content[:220]
            )

            concept = problem.editorial.content.strip() if problem.editorial.content else ""
            if not concept:
                concept = f"This problem focuses on core {topic} reasoning and efficient state transitions."

            return {
                "concept_explanation": concept,
                "step_by_step": editorial_steps,
                "optimized_code": optimized_code,
                "tutorial_topic": topic,
                "tutorial_link": problem.tutorial_link,
            }

        return {
            "concept_explanation": f"This problem focuses on core {topic} reasoning: identify invariant, then apply a deterministic traversal strategy.",
            "step_by_step": [
                "Read constraints and select data structure matching operation frequency.",
                "Build core transition/check function with clear base case.",
                "Run on sample input and verify boundary cases.",
                "Optimize by removing redundant scans and memory copies.",
            ],
            "optimized_code": "Use topic-specific optimized approach (one-pass/hash or binary-search/graph traversal) with explicit edge-case checks.",
            "tutorial_topic": topic,
            "tutorial_link": problem.tutorial_link,
        }


code_review_service = CodeReviewService()
