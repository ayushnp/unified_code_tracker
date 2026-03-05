import httpx

def get_stats(username: str):
    # Get basic user info (rating, rank)
    info = httpx.get(
        "https://codeforces.com/api/user.info",
        params={"handles": username}
    ).json()

    if info["status"] != "OK":
        return {"error": "User not found", "platform": "codeforces"}

    user = info["result"][0]

    # Get all submissions to count solved problems
    subs = httpx.get(
        "https://codeforces.com/api/user.status",
        params={"handle": username, "from": 1, "count": 10000}
    ).json()

    # Count only unique accepted problems
    solved = set()
    for s in subs.get("result", []):
        if s.get("verdict") == "OK":
            p = s["problem"]
            solved.add((p["contestId"], p["index"]))

    return {
        "platform": "codeforces",
        "username": username,
        "total_solved": len(solved),
        "rating": user.get("rating", "unrated"),
        "rank": user.get("rank", "unranked"),
    }