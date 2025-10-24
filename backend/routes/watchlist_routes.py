from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.watchlist_service import get_user_watchlist, add_to_watchlist, remove_from_watchlist

watchlist_bp = Blueprint('watchlist', __name__)

@watchlist_bp.route('/watchlist', methods=['GET'])
@jwt_required()
def get_watchlist():
    try:
        user_id = get_jwt_identity()
        watchlist = get_user_watchlist(user_id)
        return jsonify({"success": True, "data": watchlist}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to fetch watchlist"}), 500

@watchlist_bp.route('/watchlist', methods=['POST'])
@jwt_required()
def add_stock_to_watchlist():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        symbol = data.get('symbol')
        name = data.get('name')
        
        if not all([symbol, name]):
            return jsonify({"success": False, "error": "Symbol and name are required"}), 400
        
        result, success = add_to_watchlist(user_id, symbol, name)
        
        if success:
            return jsonify({"success": True, "data": result}), 200
        else:
            return jsonify({"success": False, "error": result.get("error")}), 400
            
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to add to watchlist"}), 500

@watchlist_bp.route('/watchlist/<symbol>', methods=['DELETE'])
@jwt_required()
def remove_stock_from_watchlist(symbol):
    try:
        user_id = get_jwt_identity()
        
        if not symbol:
            return jsonify({"success": False, "error": "Symbol is required"}), 400
        
        result, success = remove_from_watchlist(user_id, symbol)
        
        if success:
            return jsonify({"success": True, "data": result}), 200
        else:
            return jsonify({"success": False, "error": result.get("error")}), 400
            
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to remove from watchlist"}), 500

@watchlist_bp.route('/watchlist/<symbol>/check', methods=['GET'])
@jwt_required()
def check_watchlist(symbol):
    try:
        user_id = get_jwt_identity()
        watchlist = get_user_watchlist(user_id)
        is_in_watchlist = any(stock['symbol'] == symbol for stock in watchlist)
        return jsonify({"success": True, "in_watchlist": is_in_watchlist}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to check watchlist"}), 500