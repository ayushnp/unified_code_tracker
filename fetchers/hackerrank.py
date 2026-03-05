import httpx

def get_stats(username: str):
    # HackerRank has no official public API
    # This uses their unofficial profile endpoint
    response = httpx.get(
        f"https://www.hackerrank.com/rest/hackers/{username}/scores_elo",
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    )

    if response.status_code != 200:
        return {"error": "User not found or HackerRank blocked request", "platform": "hackerrank"}

    data = response.json()
    return {
        "platform": "hackerrank",
        "username": username,
        "scores": data,  # raw for now, we'll clean this up later
    }