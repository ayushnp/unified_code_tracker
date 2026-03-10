from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from bson import ObjectId
import secrets
from fetchers import leetcode, codeforces, hackerrank, geeksforgeeks
from database import users_collection, comments_collection
from auth import hash_password, verify_password, create_token, decode_token

# ── APP SETUP ─────────────────────────────────────────
app = FastAPI(
    title="CodeTracker API",
    description="Unified coding progress tracker",
    version="2.0.0",
)

security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── SCHEMAS ───────────────────────────────────────────
class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class PlatformUsernames(BaseModel):
    leetcode:      Optional[str] = ""
    codeforces:    Optional[str] = ""
    hackerrank:    Optional[str] = ""
    geeksforgeeks: Optional[str] = ""


class CompareRequest(BaseModel):
    leetcode:      Optional[str] = ""
    codeforces:    Optional[str] = ""
    hackerrank:    Optional[str] = ""
    geeksforgeeks: Optional[str] = ""

class CommentRequest(BaseModel):
    name:    str
    message: str

class CommentEditRequest(BaseModel):
    message:      str
    edit_token:   str

class CommentDeleteRequest(BaseModel):
    edit_token: str


# ── AUTH HELPER ───────────────────────────────────────
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ── AUTH ROUTES ───────────────────────────────────────
@app.post("/auth/signup", tags=["Auth"])
def signup(req: SignupRequest):
    if users_collection.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    share_id = str(uuid.uuid4())

    users_collection.insert_one({
        "email":        req.email,
        "password":     hash_password(req.password),
        "usernames":    {},
        "cached_stats": {},
        "last_updated": None,
        "share_id":     share_id,
    })
    token = create_token(req.email)
    return {"token": token, "email": req.email, "share_id": share_id}


@app.post("/auth/login", tags=["Auth"])
def login(req: LoginRequest):
    user = users_collection.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Wrong email or password")

    # Give old accounts a share_id if they don't have one
    if not user.get("share_id"):
        share_id = str(uuid.uuid4())
        users_collection.update_one({"email": req.email}, {"$set": {"share_id": share_id}})
    else:
        share_id = user["share_id"]

    token = create_token(req.email)
    return {
        "token":     token,
        "email":     req.email,
        "share_id":  share_id,
        "usernames": user.get("usernames", {}),  # ← pre-fill usernames on login
    }


# ── PLATFORM USERNAMES ────────────────────────────────
@app.post("/user/platforms", tags=["User"])
def save_platforms(req: PlatformUsernames, user=Depends(get_current_user)):
    users_collection.update_one(
        {"email": user["email"]},
        {"$set": {"usernames": req.dict()}}
    )
    return {"message": "Saved successfully"}


@app.get("/user/platforms", tags=["User"])
def get_platforms(user=Depends(get_current_user)):
    return user.get("usernames", {})


# ── CACHED DASHBOARD ─────────────────────────────────
# Fast — reads straight from MongoDB, no live fetching
@app.get("/user/dashboard/cached", tags=["User"])
def get_cached_dashboard(user=Depends(get_current_user)):
    return {
        "email":        user["email"],
        "usernames":    user.get("usernames", {}),
        "share_id":     user.get("share_id"),
        "stats":        user.get("cached_stats", {}),
        "last_updated": user.get("last_updated"),
        "from_cache":   True,
    }


# ── REFRESH DASHBOARD ─────────────────────────────────
# Slow — fetches live from all platforms, then updates MongoDB cache
@app.get("/user/dashboard/refresh", tags=["User"])
def refresh_dashboard(user=Depends(get_current_user)):
    usernames = user.get("usernames", {})

    if not any(usernames.values()):
        return {"message": "No platforms linked yet", "stats": {}}

    fetcher_map = {
        "leetcode":      leetcode,
        "codeforces":    codeforces,
        "hackerrank":    hackerrank,
        "geeksforgeeks": geeksforgeeks,
    }

    stats = {}
    for platform, fetcher in fetcher_map.items():
        username = (usernames.get(platform) or "").strip()
        if username:
            try:
                stats[platform] = fetcher.get_stats(username)
            except Exception as e:
                stats[platform] = {"error": str(e), "platform": platform}

    now = datetime.utcnow()

    users_collection.update_one(
        {"email": user["email"]},
        {"$set": {"cached_stats": stats, "last_updated": now}}
    )

    return {
        "email":        user["email"],
        "usernames":    usernames,
        "share_id":     user.get("share_id"),
        "stats":        stats,
        "last_updated": now,
        "from_cache":   False,
    }


# ── PUBLIC SHARE (no auth needed) ────────────────────
@app.get("/share/{share_id}", tags=["Share"])
def get_shared_dashboard(share_id: str):
    user = users_collection.find_one({"share_id": share_id})
    if not user:
        raise HTTPException(status_code=404, detail="Share link not found")
    return {
        "email":        user["email"],
        "usernames":    user.get("usernames", {}),
        "stats":        user.get("cached_stats", {}),
        "last_updated": user.get("last_updated"),
    }

@app.post("/compare", tags=["Compare"])
def compare_stats(req: CompareRequest, user=Depends(get_current_user)):
    """
    Fetch live stats for a friend's usernames and return
    both the current user's cached stats + friend's live stats.
    """
    friend_usernames = {
        "leetcode":      (req.leetcode      or "").strip(),
        "codeforces":    (req.codeforces    or "").strip(),
        "hackerrank":    (req.hackerrank    or "").strip(),
        "geeksforgeeks": (req.geeksforgeeks or "").strip(),
    }

    if not any(friend_usernames.values()):
        raise HTTPException(status_code=400, detail="Enter at least one friend username")

    fetcher_map = {
        "leetcode":      leetcode,
        "codeforces":    codeforces,
        "hackerrank":    hackerrank,
        "geeksforgeeks": geeksforgeeks,
    }

    # Fetch friend's stats live
    friend_stats = {}
    for platform, fetcher in fetcher_map.items():
        username = friend_usernames.get(platform, "")
        if username:
            try:
                friend_stats[platform] = fetcher.get_stats(username)
            except Exception as e:
                friend_stats[platform] = {"error": str(e), "platform": platform}

    # Return user's cached stats + friend's live stats
    my_cached = user.get("cached_stats", {})
    my_usernames = user.get("usernames", {})

    return {
        "me": {
            "email":     user["email"],
            "usernames": my_usernames,
            "stats":     my_cached,
        },
        "friend": {
            "usernames": friend_usernames,
            "stats":     friend_stats,
        }
    }
@app.post("/share/{share_id}/comments", tags=["Comments"])
def add_comment(share_id: str, req: CommentRequest):
    user = users_collection.find_one({"share_id": share_id})
    if not user:
        raise HTTPException(status_code=404, detail="Share link not found")

    if not req.name.strip() or not req.message.strip():
        raise HTTPException(status_code=400, detail="Name and message are required")

    if len(req.message) > 500:
        raise HTTPException(status_code=400, detail="Message too long (max 500 chars)")

    edit_token = secrets.token_urlsafe(24)  # secret given to commenter to edit/delete later

    comment = {
        "share_id":   share_id,
        "name":       req.name.strip()[:50],
        "message":    req.message.strip(),
        "edit_token": edit_token,
        "created_at": datetime.utcnow(),
        "edited":     False,
    }

    result = comments_collection.insert_one(comment)
    return {
        "id":         str(result.inserted_id),
        "name":       comment["name"],
        "message":    comment["message"],
        "edit_token": edit_token,   # ← give this to the commenter, store in their localStorage
        "created_at": comment["created_at"],
        "edited":     False,
    }


@app.get("/share/{share_id}/comments", tags=["Comments"])
def get_comments(share_id: str):
    user = users_collection.find_one({"share_id": share_id})
    if not user:
        raise HTTPException(status_code=404, detail="Share link not found")

    raw = list(comments_collection.find(
        {"share_id": share_id},
        {"edit_token": 0}           # never expose edit tokens in list
    ).sort("created_at", 1))

    comments = []
    for c in raw:
        comments.append({
            "id":         str(c["_id"]),
            "name":       c["name"],
            "message":    c["message"],
            "created_at": c.get("created_at"),
            "edited":     c.get("edited", False),
        })
    return {"comments": comments, "total": len(comments)}


@app.put("/comments/{comment_id}", tags=["Comments"])
def edit_comment(comment_id: str, req: CommentEditRequest):
    try:
        oid = ObjectId(comment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid comment ID")

    comment = comments_collection.find_one({"_id": oid})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment["edit_token"] != req.edit_token:
        raise HTTPException(status_code=403, detail="Invalid edit token")

    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if len(req.message) > 500:
        raise HTTPException(status_code=400, detail="Message too long (max 500 chars)")

    comments_collection.update_one(
        {"_id": oid},
        {"$set": {"message": req.message.strip(), "edited": True}}
    )
    return {"message": "Comment updated"}


@app.delete("/comments/{comment_id}", tags=["Comments"])
def delete_comment(comment_id: str, req: CommentDeleteRequest):
    try:
        oid = ObjectId(comment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid comment ID")

    comment = comments_collection.find_one({"_id": oid})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment["edit_token"] != req.edit_token:
        raise HTTPException(status_code=403, detail="Invalid edit token")

    comments_collection.delete_one({"_id": oid})
    return {"message": "Comment deleted"}


# ── DIRECT STATS (testing, no auth) ──────────────────
@app.get("/stats/leetcode/{username}",      tags=["Direct Stats"])
def lc(username: str):  return leetcode.get_stats(username)

@app.get("/stats/codeforces/{username}",    tags=["Direct Stats"])
def cf(username: str):  return codeforces.get_stats(username)

@app.get("/stats/hackerrank/{username}",    tags=["Direct Stats"])
def hr(username: str):  return hackerrank.get_stats(username)

@app.get("/stats/geeksforgeeks/{username}", tags=["Direct Stats"])
def gfg(username: str): return geeksforgeeks.get_stats(username)


import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
