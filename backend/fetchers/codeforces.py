import httpx
from collections import defaultdict
from datetime import datetime

def get_stats(username: str):
    info = httpx.get(
        "https://codeforces.com/api/user.info",
        params={"handles": username}
    ).json()

    if info["status"] != "OK":
        return {"error": "User not found", "platform": "codeforces"}

    user = info["result"][0]

    subs = httpx.get(
        "https://codeforces.com/api/user.status",
        params={"handle": username, "from": 1, "count": 10000}
    ).json()

    solved = set()
    daily = defaultdict(int)

    for s in subs.get("result", []):
        if s.get("verdict") == "OK":
            p = s["problem"]
            solved.add((p["contestId"], p["index"]))

            # Convert unix timestamp to date string
            date = datetime.utcfromtimestamp(s["creationTimeSeconds"]).strftime("%Y-%m-%d")
            daily[date] += 1

    return {
        "platform": "codeforces",
        "username": username,
        "total_solved": len(solved),
        "rating": user.get("rating", "unrated"),
        "rank": user.get("rank", "unranked"),
        "daily_submissions": dict(daily),
    }