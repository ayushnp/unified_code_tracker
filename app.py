from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fetchers import leetcode, codeforces, hackerrank, geeksforgeeks
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stats/leetcode/{username}")
def leetcode_stats(username: str):
    return leetcode.get_stats(username)

@app.get("/stats/codeforces/{username}")
def codeforces_stats(username: str):
    return codeforces.get_stats(username)

@app.get("/stats/hackerrank/{username}")
def hackerrank_stats(username: str):
    return hackerrank.get_stats(username)

@app.get("/stats/geeksforgeeks/{username}")
def gfg_stats(username: str):
    return geeksforgeeks.get_stats(username)

@app.get("/stats/all")
def all_stats(lc: str = None, cf: str = None, hr: str = None):
    """Pass ?lc=username&cf=username&hr=username to get all at once"""
    result = {}
    if lc:
        result["leetcode"] = leetcode.get_stats(lc)
    if cf:
        result["codeforces"] = codeforces.get_stats(cf)
    if hr:
        result["hackerrank"] = hackerrank.get_stats(hr)
    return result