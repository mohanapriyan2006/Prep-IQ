import json
import re
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.platform import UserPlatformAccount, UserPlatformStat


class PlatformConnectorService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _http_json(self, url: str, *, method: str = "GET", payload: dict | None = None) -> dict:
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        headers = {
            "User-Agent": self.settings.connectors_user_agent,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        request = Request(url=url, method=method, data=data, headers=headers)
        with urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
            return json.loads(body)

    def _http_text(self, url: str) -> str:
        request = Request(url=url, method="GET", headers={"User-Agent": self.settings.connectors_user_agent})
        with urlopen(request, timeout=20) as response:
            return response.read().decode("utf-8", errors="ignore")

    def fetch_leetcode_stats(self, username: str) -> dict:
        query = {
            "operationName": "userPublicProfile",
            "variables": {"username": username},
            "query": """
            query userPublicProfile($username: String!) {
              matchedUser(username: $username) {
                submitStats {
                  acSubmissionNum {
                    difficulty
                    count
                  }
                }
                languageProblemCount {
                  languageName
                  problemsSolved
                }
              }
              recentAcSubmissionList(username: $username, limit: 15) {
                timestamp
              }
            }
            """,
        }

        try:
            payload = self._http_json("https://leetcode.com/graphql", method="POST", payload=query)
            data = payload.get("data", {})
            matched = data.get("matchedUser") or {}
            submissions = matched.get("submitStats", {}).get("acSubmissionNum", [])
            solved_by_diff = {item.get("difficulty", ""): int(item.get("count", 0)) for item in submissions}
            recent = data.get("recentAcSubmissionList") or []

            latest_submission = None
            if recent:
                latest_ts = max(int(item.get("timestamp", "0") or "0") for item in recent)
                if latest_ts > 0:
                    latest_submission = datetime.fromtimestamp(latest_ts, tz=timezone.utc)

            return {
                "easy_solved": solved_by_diff.get("Easy", 0),
                "medium_solved": solved_by_diff.get("Medium", 0),
                "hard_solved": solved_by_diff.get("Hard", 0),
                "total_solved": solved_by_diff.get("All", 0),
                "topics": [],
                "latest_submission_at": latest_submission,
            }
        except (HTTPError, URLError, TimeoutError, ValueError):
            return {
                "easy_solved": 0,
                "medium_solved": 0,
                "hard_solved": 0,
                "total_solved": 0,
                "topics": [],
                "latest_submission_at": None,
            }

    def fetch_gfg_stats(self, username: str) -> dict:
        encoded = quote(username)
        urls = [
            f"https://www.geeksforgeeks.org/user/{encoded}/",
            f"https://www.geeksforgeeks.org/user/{encoded}/practice/",
            f"https://auth.geeksforgeeks.org/user/{encoded}/",
            f"https://auth.geeksforgeeks.org/user/{encoded}/practice/",
        ]

        html = ""
        for url in urls:
            try:
                html = self._http_text(url)
                if html and "404" not in html[:4000]:
                    break
            except (HTTPError, URLError, TimeoutError):
                continue

        easy_patterns = [
            r"Easy[^0-9]{0,40}(\\d+)",
            r'"easySolved"\s*:\s*(\\d+)',
            r'"easy_count"\s*:\s*(\\d+)',
        ]
        medium_patterns = [
            r"Medium[^0-9]{0,40}(\\d+)",
            r'"mediumSolved"\s*:\s*(\\d+)',
            r'"medium_count"\s*:\s*(\\d+)',
        ]
        hard_patterns = [
            r"Hard[^0-9]{0,40}(\\d+)",
            r'"hardSolved"\s*:\s*(\\d+)',
            r'"hard_count"\s*:\s*(\\d+)',
        ]
        total_patterns = [
            r"Problem[s]?\s+Solved[^0-9]{0,40}(\\d+)",
            r'"totalProblemsSolved"\s*:\s*(\\d+)',
            r'"total_solved"\s*:\s*(\\d+)',
        ]

        easy = self._extract_from_patterns(html, easy_patterns)
        medium = self._extract_from_patterns(html, medium_patterns)
        hard = self._extract_from_patterns(html, hard_patterns)
        total = self._extract_from_patterns(html, total_patterns)

        if total == 0:
            total = easy + medium + hard

        topic_matches = re.findall(r"tagName\"\s*:\s*\"([^\"]+)\"", html)
        topics = sorted({topic.strip() for topic in topic_matches if topic.strip()})[:20]

        return {
            "easy_solved": easy,
            "medium_solved": medium,
            "hard_solved": hard,
            "total_solved": total,
            "topics": topics,
            "latest_submission_at": None,
        }

    @staticmethod
    def _extract_first_int(text: str, pattern: str) -> int:
        match = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
        if not match:
            return 0
        try:
            return int(match.group(1))
        except (TypeError, ValueError):
            return 0

    def _extract_from_patterns(self, text: str, patterns: list[str]) -> int:
        for pattern in patterns:
            value = self._extract_first_int(text, pattern)
            if value > 0:
                return value
        return 0

    def _fetch_for_platform(self, platform: str, username: str) -> dict:
        normalized = platform.lower().strip()
        if normalized == "leetcode":
            return self.fetch_leetcode_stats(username)
        if normalized in {"geeksforgeeks", "gfg"}:
            return self.fetch_gfg_stats(username)
        return {
            "easy_solved": 0,
            "medium_solved": 0,
            "hard_solved": 0,
            "total_solved": 0,
            "topics": [],
            "latest_submission_at": None,
        }

    def sync_user_platform_stats(self, db: Session, user_id: int) -> int:
        accounts = list(db.scalars(select(UserPlatformAccount).where(UserPlatformAccount.user_id == user_id)).all())
        synced = 0

        for account in accounts:
            stats_data = self._fetch_for_platform(account.platform, account.username)
            stat = db.scalar(
                select(UserPlatformStat).where(
                    UserPlatformStat.user_id == user_id,
                    UserPlatformStat.platform == account.platform,
                )
            )

            if not stat:
                stat = UserPlatformStat(user_id=user_id, account_id=account.id, platform=account.platform)
                db.add(stat)

            stat.account_id = account.id
            stat.easy_solved = stats_data["easy_solved"]
            stat.medium_solved = stats_data["medium_solved"]
            stat.hard_solved = stats_data["hard_solved"]
            stat.total_solved = stats_data["total_solved"]
            stat.topics = stats_data["topics"]
            stat.latest_submission_at = stats_data["latest_submission_at"]
            synced += 1

        db.commit()
        return synced


platform_connector_service = PlatformConnectorService()
