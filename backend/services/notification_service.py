from database import get_database
from bson import ObjectId
from datetime import datetime

db = get_database()
notifications_collection = db.notifications

def get_user_notifications(user_id, unread_only=False):
    try:
        query = {"user_id": user_id}
        if unread_only:
            query["read"] = False
            
        notifications = list(notifications_collection.find(query).sort("created_at", -1))
        
        # Convert ObjectId to string for JSON serialization
        for notification in notifications:
            notification["_id"] = str(notification["_id"])
            
        return notifications, True
    except Exception as e:
        return [], False

def get_unread_notification_count(user_id):
    try:
        count = notifications_collection.count_documents({
            "user_id": user_id,
            "read": False
        })
        return count, True
    except Exception as e:
        return 0, False

def mark_notification_as_read(user_id, notification_id):
    try:
        result = notifications_collection.update_one(
            {"_id": ObjectId(notification_id), "user_id": user_id},
            {"$set": {"read": True, "read_at": datetime.utcnow()}}
        )
        return result.modified_count > 0, True
    except Exception as e:
        return False, False

def mark_all_notifications_as_read(user_id):
    try:
        result = notifications_collection.update_many(
            {"user_id": user_id, "read": False},
            {"$set": {"read": True, "read_at": datetime.utcnow()}}
        )
        return result.modified_count, True
    except Exception as e:
        return 0, False

def create_notification(user_id, title, message, type="info"):
    try:
        notification = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": type,
            "read": False,
            "created_at": datetime.utcnow()
        }
        
        result = notifications_collection.insert_one(notification)
        return str(result.inserted_id), True
    except Exception as e:
        return None, False