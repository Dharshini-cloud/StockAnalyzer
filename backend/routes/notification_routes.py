from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.notification_service import (
    get_user_notifications, 
    get_unread_notification_count,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    create_notification
)

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        user_id = get_jwt_identity()
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        notifications, success = get_user_notifications(user_id, unread_only)
        
        if success:
            return jsonify({"success": True, "data": notifications}), 200
        else:
            return jsonify({"success": False, "error": "Failed to fetch notifications"}), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to fetch notifications"}), 500

@notification_bp.route('/notifications/unread/count', methods=['GET'])
@jwt_required()
def get_unread_count():
    try:
        user_id = get_jwt_identity()
        count, success = get_unread_notification_count(user_id)
        
        if success:
            return jsonify({"success": True, "data": count}), 200
        else:
            return jsonify({"success": False, "error": "Failed to get unread count"}), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to get unread count"}), 500

@notification_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    try:
        user_id = get_jwt_identity()
        success, _ = mark_notification_as_read(user_id, notification_id)
        if success:
            return jsonify({"success": True, "message": "Notification marked as read"}), 200
        else:
            return jsonify({"success": False, "error": "Failed to mark notification as read"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to mark notification as read"}), 500

@notification_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    try:
        user_id = get_jwt_identity()
        # For now, return empty array - implement alert logic later
        return jsonify({"success": True, "data": []}), 200
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to get alerts"}), 500

@notification_bp.route('/alerts', methods=['POST'])
@jwt_required()
def create_alert():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        symbol = data.get('symbol')
        target_price = data.get('target_price')
        alert_type = data.get('alert_type', 'above')
        
        # Create notification for the alert
        notification_id, success = create_notification(
            user_id, 
            f"Price Alert Created for {symbol}",
            f"Alert when price goes {alert_type} ${target_price}",
            "alert"
        )
        
        if success:
            return jsonify({
                "success": True, 
                "message": "Alert created successfully",
                "alert_id": notification_id
            }), 201
        else:
            return jsonify({"success": False, "error": "Failed to create alert"}), 400
            
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to create alert"}), 500