from database import get_database
from bson import ObjectId
from datetime import datetime

db = get_database()
watchlist_collection = db.watchlist

def get_user_watchlist(user_id):
    try:
        watchlist = watchlist_collection.find_one({"user_id": user_id})
        return watchlist["stocks"] if watchlist else []
    except Exception as e:
        print(f"Error getting watchlist: {e}")
        return []

def add_to_watchlist(user_id, stock_symbol, stock_name):
    try:
        # Check if user has a watchlist
        watchlist = watchlist_collection.find_one({"user_id": user_id})
        
        stock_data = {
            "symbol": stock_symbol.upper(),
            "name": stock_name,
            "added_at": datetime.utcnow().isoformat()
        }
        
        if watchlist:
            # Check if stock already in watchlist
            if any(stock["symbol"] == stock_symbol.upper() for stock in watchlist.get("stocks", [])):
                return {"error": "Stock already in watchlist"}, False
            
            # Add to existing watchlist
            watchlist_collection.update_one(
                {"user_id": user_id},
                {"$push": {"stocks": stock_data}}
            )
        else:
            # Create new watchlist
            watchlist_collection.insert_one({
                "user_id": user_id,
                "stocks": [stock_data]
            })
        
        return {"message": f"{stock_symbol} added to watchlist"}, True
        
    except Exception as e:
        return {"error": f"Failed to add to watchlist: {str(e)}"}, False

def remove_from_watchlist(user_id, stock_symbol):
    try:
        result = watchlist_collection.update_one(
            {"user_id": user_id},
            {"$pull": {"stocks": {"symbol": stock_symbol.upper()}}}
        )
        
        if result.modified_count > 0:
            return {"message": f"{stock_symbol} removed from watchlist"}, True
        else:
            return {"error": "Stock not found in watchlist"}, False
            
    except Exception as e:
        return {"error": f"Failed to remove from watchlist: {str(e)}"}, False