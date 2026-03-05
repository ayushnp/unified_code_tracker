from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import re, time

MONTHS = ["January","February","March","April","May","June",
          "July","August","September","October","November","December"]

def get_stats(username: str):
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--log-level=3")

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )

    try:
        driver.get(f"https://www.geeksforgeeks.org/profile/{username}?tab=activity")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(4)


        text = driver.find_element(By.TAG_NAME, "body").text

        def extract_int(pattern, default=0):
            m = re.search(pattern, text)
            return int(m.group(1).strip()) if m else default

        def extract(pattern, default="—"):
            m = re.search(pattern, text)
            return m.group(1).strip() if m else default

        coding_score    = extract_int(r"Coding Score\s*(\d+)")
        problems_solved = extract_int(r"Problems Solved\s*(\d+)")
        institute_rank  = extract(r"Institute Rank\s*([^\n]+)")
        institute_rank  = "—" if institute_rank in ["__", "_", ""] else institute_rank
        longest_streak  = extract_int(r"Longest Streak:\s*(\d+)")
        potd_streak     = extract_int(r"(\d+)\s*Day POTD Streak")
        potds_solved    = extract_int(r"POTDs Solved:\s*(\d+)")
        school          = extract_int(r"SCHOOL\s*\((\d+)\)")
        basic           = extract_int(r"BASIC\s*\((\d+)\)")
        easy            = extract_int(r"EASY\s*\((\d+)\)")
        medium          = extract_int(r"MEDIUM\s*\((\d+)\)")
        hard            = extract_int(r"HARD\s*\((\d+)\)")
        yearly          = extract_int(r"(\d+)\s*Submissions in Year")

        # ── Scrape monthly submission counts ──
        # Page shows each month name followed by a count
        # e.g. "January\n12\nFebruary\n0\n..."
        monthly = {}
        current_year = None

        # Find the year first
        year_match = re.search(r"Submissions in Year\s*\n?(\d{4})", text)
        if year_match:
            current_year = int(year_match.group(1))
        else:
            from datetime import datetime
            current_year = datetime.now().year

        # Extract month counts — GFG lists months then count below each
        lines = text.split("\n")
        for i, line in enumerate(lines):
            line = line.strip()
            if line in MONTHS:
                # Next non-empty line should be the count
                for j in range(i+1, min(i+4, len(lines))):
                    next_line = lines[j].strip()
                    if next_line.isdigit():
                        month_num = MONTHS.index(line) + 1
                        key = f"{current_year}-{month_num:02d}"
                        monthly[key] = int(next_line)
                        break

        return {
            "platform":        "geeksforgeeks",
            "username":        username,
            "coding_score":    coding_score,
            "total_solved":    problems_solved,
            "institute_rank":  institute_rank,
            "longest_streak":  longest_streak,
            "potd_streak":     potd_streak,
            "potds_solved":    potds_solved,
            "yearly_submissions": yearly,
            "school":          school,
            "basic":           basic,
            "easy":            easy,
            "medium":          medium,
            "hard":            hard,
            "monthly_submissions": monthly,  # { "2025-01": 12, "2025-11": 47, ... }
        }

    except Exception as e:
        return {"error": str(e), "platform": "geeksforgeeks"}
    finally:
        driver.quit()