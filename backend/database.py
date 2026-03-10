from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URL"))
db = client["codetracker"]

users_collection    = db["users"]
comments_collection = db["comments"]

# Indexes
users_collection.create_index("email", unique=True)
comments_collection.create_index("share_id")   # fast lookup by share_id