import httpx

def get_stats(username: str):
    query = """
    query($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum { difficulty count }
        }
        userCalendar {
          streak
          totalActiveDays
          submissionCalendar
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

    user = response.json()["data"]["matchedUser"]
    items = user["submitStatsGlobal"]["acSubmissionNum"]
    counts = {item["difficulty"]: item["count"] for item in items}
    calendar = user["userCalendar"]

    import json
    return {
        "platform": "leetcode",
        "username": username,
        "total_solved": counts.get("All", 0),
        "easy": counts.get("Easy", 0),
        "medium": counts.get("Medium", 0),
        "hard": counts.get("Hard", 0),
        "streak": calendar["streak"],
        "total_active_days": calendar["totalActiveDays"],
        # This is a JSON string of {timestamp: count} — we parse it
        "daily_submissions": json.loads(calendar["submissionCalendar"]),
    }