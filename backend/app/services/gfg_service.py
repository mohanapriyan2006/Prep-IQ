import httpx
import logging
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class GFGService:
    BASE_URLS = [
        "https://www.geeksforgeeks.org/profile/{}/",
        "https://www.geeksforgeeks.org/user/{}/",
        "https://auth.geeksforgeeks.org/profile/{}/practice/",
        "https://auth.geeksforgeeks.org/user/{}/practice/",
    ]
    
    @classmethod
    async def fetch_user_stats(cls, username: str) -> Optional[Dict[str, Any]]:
        """
        Scrape GFG public profile for stats.
        Includes problems solved, coding score, institution rank, etc.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                html = None
                for template in cls.BASE_URLS:
                    response = await client.get(template.format(username), follow_redirects=True)
                    if response.status_code == 200 and response.text:
                        html = response.text
                        break

                if not html:
                    logger.warning(f"GFG fetch failed for {username}: no valid profile page found")
                    return None

                soup = BeautifulSoup(html, "html.parser")
                
                stats = {
                    "username": username,
                    "problems_solved": 0,
                    "coding_score": 0,
                    "institution_rank": None,
                    "easy_solved": 0,
                    "medium_solved": 0,
                    "hard_solved": 0,
                }
                
                # Scraping logic could go here based on GFG's current HTML structure
                # This is a simplified placeholder as their HTML changes often.
                # E.g. finding divs with specific classes.
                
                score_cards = soup.find_all("div", class_="score_card_value")
                if len(score_cards) >= 1:
                    try:
                        stats["coding_score"] = int(score_cards[0].text.strip())
                    except ValueError:
                        pass
                if len(score_cards) >= 2:
                    try:
                        stats["problems_solved"] = int(score_cards[1].text.strip())
                    except ValueError:
                        pass

                if stats["problems_solved"] == 0:
                    text = soup.get_text(" ", strip=True)
                    fallback_total = cls._extract_first_int(text, [
                        r"Problem[s]?\s+Solved[^0-9]{0,40}(\d+)",
                        r"Total\s+Problems[^0-9]{0,40}(\d+)",
                        r'"totalProblemsSolved"\s*:\s*(\d+)',
                    ])
                    if fallback_total > 0:
                        stats["problems_solved"] = fallback_total

                stats["easy_solved"] = cls._extract_first_int(soup.get_text(" ", strip=True), [
                    r"Easy[^0-9]{0,40}(\d+)",
                    r'"easySolved"\s*:\s*(\d+)',
                ])
                stats["medium_solved"] = cls._extract_first_int(soup.get_text(" ", strip=True), [
                    r"Medium[^0-9]{0,40}(\d+)",
                    r'"mediumSolved"\s*:\s*(\d+)',
                ])
                stats["hard_solved"] = cls._extract_first_int(soup.get_text(" ", strip=True), [
                    r"Hard[^0-9]{0,40}(\d+)",
                    r'"hardSolved"\s*:\s*(\d+)',
                ])
                        
                return stats
        except Exception as e:
            logger.error(f"Error fetching GFG stats for {username}: {e}")
            return None

    @staticmethod
    def _extract_first_int(text: str, patterns: list[str]) -> int:
        import re

        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
            if not match:
                continue
            try:
                return int(match.group(1))
            except (TypeError, ValueError):
                continue
        return 0

gfg_service = GFGService()
