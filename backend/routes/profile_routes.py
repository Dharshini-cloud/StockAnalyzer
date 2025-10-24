from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from database import get_database

# ✅ DEFINE THE BLUEPRINT FIRST (this was missing)
profile_bp = Blueprint('profile', __name__)

# ✅ NOW YOU CAN USE profile_bp.route DECORATORS

@profile_bp.route('/user/profile', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_user_profile():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        print(f"📋 Getting profile for user ID: {current_user_id}")
        
        db = get_database()
        users = db.users
        
        user = users.find_one({'_id': ObjectId(current_user_id)})
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get user stats
        watchlist_count = db.watchlist.count_documents({'user_id': ObjectId(current_user_id)})
        portfolio_count = db.portfolio.count_documents({'user_id': ObjectId(current_user_id)})
        alerts_count = db.alerts.count_documents({'user_id': ObjectId(current_user_id), 'active': True})
        
        profile_data = {
            '_id': str(user['_id']),
            'firstName': user.get('firstName', ''),
            'lastName': user.get('lastName', ''),
            'username': user.get('username', ''),
            'email': user.get('email', ''),
            'phone': user.get('phone', ''),
            'bio': user.get('bio', ''),
            'plan': user.get('plan', 'Premium'),
            'createdAt': user.get('createdAt'),
            'stats': {
                'watchlistCount': watchlist_count,
                'portfolioCount': portfolio_count,
                'alertsCount': alerts_count
            }
        }
        
        print(f"✅ Profile retrieved for user: {user['username']}")
        
        return jsonify({
            'success': True,
            'data': profile_data
        })
        
    except Exception as e:
        print(f"❌ Profile retrieval error: {e}")
        return jsonify({'success': False, 'error': 'Failed to get profile'}), 500

@profile_bp.route('/user/profile', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_user_profile():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        print(f"🔄 Updating profile for user ID: {current_user_id}")
        
        data = request.get_json()
        print(f"📝 Profile update data: {data}")
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        db = get_database()
        users = db.users
        
        # Check if user exists
        user = users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Prepare update fields
        update_fields = {}
        
        # Validate and update fields
        if 'firstName' in data:
            update_fields['firstName'] = data['firstName'].strip()
        if 'lastName' in data:
            update_fields['lastName'] = data['lastName'].strip()
        if 'username' in data:
            new_username = data['username'].strip()
            if new_username != user.get('username'):
                # Check if username is already taken
                existing_user = users.find_one({
                    'username': new_username,
                    '_id': {'$ne': ObjectId(current_user_id)}
                })
                if existing_user:
                    return jsonify({'success': False, 'error': 'Username already taken'}), 400
            update_fields['username'] = new_username
        if 'email' in data:
            new_email = data['email'].strip().lower()
            if new_email != user.get('email'):
                # Check if email is already taken
                existing_user = users.find_one({
                    'email': new_email,
                    '_id': {'$ne': ObjectId(current_user_id)}
                })
                if existing_user:
                    return jsonify({'success': False, 'error': 'Email already taken'}), 400
            update_fields['email'] = new_email
        if 'phone' in data:
            update_fields['phone'] = data['phone'].strip()
        if 'bio' in data:
            update_fields['bio'] = data['bio'].strip()[:500]  # Limit bio to 500 chars
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No valid fields to update'}), 400
        
        # Update user in database
        result = users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': update_fields}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'No changes made'}), 400
        
        # Get updated user data
        updated_user = users.find_one({'_id': ObjectId(current_user_id)})
        
        # Get updated stats
        watchlist_count = db.watchlist.count_documents({'user_id': ObjectId(current_user_id)})
        portfolio_count = db.portfolio.count_documents({'user_id': ObjectId(current_user_id)})
        alerts_count = db.alerts.count_documents({'user_id': ObjectId(current_user_id), 'active': True})
        
        response_data = {
            '_id': str(updated_user['_id']),
            'firstName': updated_user.get('firstName', ''),
            'lastName': updated_user.get('lastName', ''),
            'username': updated_user.get('username', ''),
            'email': updated_user.get('email', ''),
            'phone': updated_user.get('phone', ''),
            'bio': updated_user.get('bio', ''),
            'plan': updated_user.get('plan', 'Premium'),
            'stats': {
                'watchlistCount': watchlist_count,
                'portfolioCount': portfolio_count,
                'alertsCount': alerts_count
            }
        }
        
        print(f"✅ Profile updated successfully for user: {updated_user['username']}")
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'data': response_data
        })
        
    except Exception as e:
        print(f"❌ Profile update error: {e}")
        return jsonify({'success': False, 'error': 'Failed to update profile'}), 500

@profile_bp.route('/user/preferences', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_user_preferences():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        print(f"⚙️ Getting preferences for user ID: {current_user_id}")
        
        db = get_database()
        users = db.users
        
        user = users.find_one({'_id': ObjectId(current_user_id)})
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Default preferences
        default_preferences = {
            'emailNotifications': True,
            'priceAlerts': True,
            'analysisReports': False,
            'newsletter': False,
            'theme': 'light',
            'defaultTimeframe': '1D',
            'alertThreshold': 5,
            'autoRefresh': True,
            'refreshInterval': 30
        }
        
        # Merge with user's existing preferences
        user_preferences = user.get('preferences', {})
        preferences = {**default_preferences, **user_preferences}
        
        print(f"✅ Preferences retrieved for user: {user['username']}")
        
        return jsonify({
            'success': True,
            'data': preferences
        })
        
    except Exception as e:
        print(f"❌ Preferences retrieval error: {e}")
        return jsonify({'success': False, 'error': 'Failed to get preferences'}), 500

@profile_bp.route('/user/preferences', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_user_preferences():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        print(f"⚙️ Updating preferences for user ID: {current_user_id}")
        
        data = request.get_json()
        print(f"📝 Preferences update data: {data}")
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        preferences = data.get('preferences', {})
        
        if not preferences:
            return jsonify({'success': False, 'error': 'No preferences data provided'}), 400
        
        db = get_database()
        users = db.users
        
        # Check if user exists
        user = users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get current preferences (merge with defaults)
        default_preferences = {
            'emailNotifications': True,
            'priceAlerts': True,
            'analysisReports': False,
            'newsletter': False,
            'theme': 'light',
            'defaultTimeframe': '1D',
            'alertThreshold': 5,
            'autoRefresh': True,
            'refreshInterval': 30
        }
        
        current_preferences = {**default_preferences, **user.get('preferences', {})}
        
        # Validate and prepare preferences
        update_preferences = {}
        
        # Notification settings
        if 'emailNotifications' in preferences:
            update_preferences['emailNotifications'] = bool(preferences['emailNotifications'])
        if 'priceAlerts' in preferences:
            update_preferences['priceAlerts'] = bool(preferences['priceAlerts'])
        if 'analysisReports' in preferences:
            update_preferences['analysisReports'] = bool(preferences['analysisReports'])
        if 'newsletter' in preferences:
            update_preferences['newsletter'] = bool(preferences['newsletter'])
        
        # Display settings
        if 'theme' in preferences and preferences['theme'] in ['light', 'dark', 'auto']:
            update_preferences['theme'] = preferences['theme']
        if 'defaultTimeframe' in preferences and preferences['defaultTimeframe'] in ['1D', '1W', '1M', '3M', '1Y']:
            update_preferences['defaultTimeframe'] = preferences['defaultTimeframe']
        
        # Trading preferences
        if 'alertThreshold' in preferences:
            try:
                threshold = int(preferences['alertThreshold'])
                if 1 <= threshold <= 20:
                    update_preferences['alertThreshold'] = threshold
            except (ValueError, TypeError):
                pass  # Keep existing value if invalid
        
        if 'autoRefresh' in preferences:
            update_preferences['autoRefresh'] = bool(preferences['autoRefresh'])
        
        if 'refreshInterval' in preferences:
            try:
                interval = int(preferences['refreshInterval'])
                if interval in [15, 30, 60, 300]:
                    update_preferences['refreshInterval'] = interval
            except (ValueError, TypeError):
                pass  # Keep existing value if invalid
        
        # Check if there are actually any changes
        if not update_preferences:
            return jsonify({
                'success': True,
                'message': 'Preferences are already up to date',
                'data': current_preferences
            })
        
        # Check if preferences are actually different from current
        has_changes = False
        for key, value in update_preferences.items():
            if current_preferences.get(key) != value:
                has_changes = True
                break
        
        if not has_changes:
            return jsonify({
                'success': True,
                'message': 'Preferences updated successfully',
                'data': update_preferences
            })
        
        # Merge with existing preferences
        final_preferences = {**current_preferences, **update_preferences}
        
        # Update preferences in database
        result = users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {'preferences': final_preferences}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Preferences updated successfully for user: {user['username']}")
            return jsonify({
                'success': True,
                'message': 'Preferences updated successfully',
                'data': final_preferences
            })
        else:
            # Even if no documents were modified, consider it success
            print(f"ℹ️ Preferences already up to date for user: {user['username']}")
            return jsonify({
                'success': True,
                'message': 'Preferences are already up to date',
                'data': final_preferences
            })
        
    except Exception as e:
        print(f"❌ Preferences update error: {e}")
        return jsonify({'success': False, 'error': 'Failed to update preferences'}), 500