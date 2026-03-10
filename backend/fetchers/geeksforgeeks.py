import httpx
import re
import json

def get_stats(username: str):
    try:
        r = httpx.get(
            f"https://www.geeksforgeeks.org/profile/{username}?tab=activity",
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
            timeout=20.0,
            follow_redirects=True,
        )

        if r.status_code != 200:
            return {"error": f"Profile not found (status {r.status_code})", "platform": "geeksforgeeks"}

        # GFG uses Next.js — stats are embedded in self.__next_f.push() chunks
        chunks = re.findall(r'self\.__next_f\.push\(\[(.*?)\]\)', r.text, re.DOTALL)

        user_data = None
        for chunk in chunks:
            if 'total_problems_solved' not in chunk:
                continue

            string_match = re.search(r'^\d+,"(.*)"$', chunk, re.DOTALL)
            if string_match:
                raw = string_match.group(1)
                unescaped = raw.replace('\\"', '"').replace('\\\\', '\\').replace('\\n', '\n')
            else:
                unescaped = chunk

            blob_match = re.search(
                r'\{[^{}]*"total_problems_solved"\s*:\s*\d+[^{}]*\}',
                unescaped
            )
            if blob_match:
                try:
                    user_data = json.loads(blob_match.group(0))
                    break
                except json.JSONDecodeError:
                    pass

        if not user_data:
            return {"error": "Could not parse profile data — GFG may have changed their page structure", "platform": "geeksforgeeks"}

        def safe_int(val, default=0):
            try:
                return int(val) if val is not None else default
            except (ValueError, TypeError):
                return default

        institute_rank = user_data.get("institute_rank") or "—"
        if institute_rank in ["", "__", "_", None]:
            institute_rank = "—"

        return {
            "platform":           "geeksforgeeks",
            "username":           username,
            "coding_score":       safe_int(user_data.get("score")),
            "total_solved":       safe_int(user_data.get("total_problems_solved")),
            "institute_rank":     institute_rank,
            "longest_streak":     safe_int(user_data.get("pod_solved_longest_streak")),
            "potd_streak":        safe_int(user_data.get("pod_solved_current_streak")),
            "potds_solved":       safe_int(user_data.get("pod_correct_submissions_count")),
            "monthly_score":      safe_int(user_data.get("monthly_score")),
            "yearly_submissions": 0,
            "school":             0,
            "basic":              0,
            "easy":               0,
            "medium":             0,
            "hard":               0,
        }

    except httpx.TimeoutException:
        return {"error": "GFG request timed out, try again", "platform": "geeksforgeeks"}
    except Exception as e:
        return {"error": str(e), "platform": "geeksforgeeks"}