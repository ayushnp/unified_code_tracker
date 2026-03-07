import httpx

def get_stats(username: str):
    try:
        response = httpx.get(
            f"https://www.hackerrank.com/rest/hackers/{username}/scores_elo",
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            timeout=30.0,          # increased from default 5s to 30s
            follow_redirects=True,
        )
    except httpx.ConnectTimeout:
        return {"error": "HackerRank connection timed out — try again", "platform": "hackerrank"}
    except httpx.RequestError as e:
        return {"error": f"Network error: {str(e)}", "platform": "hackerrank"}

    if response.status_code != 200:
        return {"error": "User not found", "platform": "hackerrank"}

    raw = response.json()

    active_tracks = []
    total_score = 0

    for track in raw:
        score = track.get("practice", {}).get("score", 0)
        if score > 0:
            active_tracks.append({
                "name": track["name"],
                "score": score,
                "rank": track["practice"]["rank"],
            })
            total_score += score

    return {
        "platform": "hackerrank",
        "username": username,
        "total_score": round(total_score, 2),
        "active_tracks": len(active_tracks),
        "breakdown": active_tracks,
    }