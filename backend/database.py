from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URL"))
db = client["codetracker"]

users_collection = db["users"]

# Create unique index on email so no duplicates
users_collection.create_index("email", unique=True)