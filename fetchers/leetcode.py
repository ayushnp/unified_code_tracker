import httpx

def get_stats(username: str):
    query = """
    query($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum { difficulty count }
        }
      }
    }
    """
    response = httpx.post(
        "https://leetcode.com/graphql",
        json={"query": query, "variables": {"username": username}},
        headers={
            "Content-Type": "application/json",
            "Referer": "https://leetcode.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    )
    items = response.json()["data"]["matchedUser"]["submitStatsGlobal"]["acSubmissionNum"]
    counts = {item["difficulty"]: item["count"] for item in items}
    return {
        "platform": "leetcode",
        "username": username,
        "total_solved": counts.get("All", 0),
        "easy": counts.get("Easy", 0),
        "medium": counts.get("Medium", 0),
        "hard": counts.get("Hard", 0),
    }