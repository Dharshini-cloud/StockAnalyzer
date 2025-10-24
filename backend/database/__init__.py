from pymongo import MongoClient
import certifi
from config import MONGO_URI, DB_NAME

# Global database connection
_client = None
_db = None

def get_database():
    global _client, _db
    if _db is None:
        try:
            _client = MongoClient(
                MONGO_URI,
                tls=True,
                tlsAllowInvalidCertificates=True,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=30000,
                connectTimeoutMS=30000,
                socketTimeoutMS=30000
            )
            _db = _client[DB_NAME]
            # Test connection
            _client.admin.command('ping')
            print("✅ Database connected successfully!")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            raise
    return _db

def get_client():
    if _client is None:
        get_database()
    return _client