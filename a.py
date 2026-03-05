from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
driver.get("https://www.geeksforgeeks.org/profile/ayushkotayw8?tab=activity")

# Wait for page to fully load
WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.TAG_NAME, "body"))
)

import time
time.sleep(4)  # let JS render

# Print raw text so we can see the structure
print(driver.find_element(By.TAG_NAME, "body").text[:5000])

driver.quit()