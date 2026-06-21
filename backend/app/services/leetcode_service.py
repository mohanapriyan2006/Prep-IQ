import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class LeetCodeService:
    GRAPHQL_URL = "https://leetcode.com/graphql"
    
    USER_QUERY = """
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        profile {
          reputation
          ranking
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
      }
    }
    """
    
    @classmethod
    async def fetch_user_stats(cls, username: str) -> Optional[Dict[str, Any]]:
        """
        Fetch LeetCode stats using their internal GraphQL API.
        """
        payload = {
            "query": cls.USER_QUERY,
            "variables": {"username": username},
            "operationName": "userPublicProfile"
        }
        
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(cls.GRAPHQL_URL, json=payload, headers=headers)
                
                if response.status_code != 200:
                    logger.warning(f"LeetCode fetch failed for {username}: {response.status_code}")
                    return None
                    
                data = response.json()
                
                if "errors" in data or not data.get("data"):
                    logger.warning(f"LeetCode GraphQL error or user not found: {username}")
                    return None
                    
                matched_user = data["data"].get("matchedUser")
                if not matched_user:
                    return None
                    
                stats = matched_user.get("submitStats", {}).get("acSubmissionNum", [])
                
                result = {
                    "username": username,
                    "total_solved": 0,
                    "easy_solved": 0,
                    "medium_solved": 0,
                    "hard_solved": 0,
                    "contest_rating": None,
                    "global_ranking": None
                }
                
                for stat in stats:
                    difficulty = stat.get("difficulty", "")
                    count = stat.get("count", 0)
                    if difficulty == "All":
                        result["total_solved"] = count
                    elif difficulty == "Easy":
                        result["easy_solved"] = count
                    elif difficulty == "Medium":
                        result["medium_solved"] = count
                    elif difficulty == "Hard":
                        result["hard_solved"] = count
                        
                contest_data = data["data"].get("userContestRanking")
                if contest_data:
                    result["contest_rating"] = round(contest_data.get("rating", 0), 2)
                    result["global_ranking"] = contest_data.get("globalRanking")
                    
                return result
                
        except Exception as e:
            logger.error(f"Error fetching LeetCode stats for {username}: {e}")
            return None

leetcode_service = LeetCodeService()
