from database import get_database as get_db
from bson.objectid import ObjectId

def get_user_profile(user_id):
    try:
        db = get_db()
        users = db.users
        
        user = users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return {
                'success': False,
                'error': 'User not found'
            }
        
        profile_data = {
            'firstName': user.get('firstName', ''),
            'lastName': user.get('lastName', ''),
            'username': user.get('username', ''),
            'email': user.get('email', ''),
            'phone': user.get('phone', ''),
            'bio': user.get('bio', ''),
            'createdAt': user.get('createdAt'),
            'plan': user.get('plan', 'Premium')
        }
        
        return {
            'success': True,
            'data': profile_data
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to get profile: {str(e)}'
        }

def update_user_profile(user_id, profile_data):
    try:
        db = get_db()
        users = db.users
        
        # Check if user exists
        user = users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return {
                'success': False,
                'error': 'User not found'
            }
        
        # Prepare update fields
        update_fields = {}
        
        if 'firstName' in profile_data:
            update_fields['firstName'] = profile_data['firstName']
        if 'lastName' in profile_data:
            update_fields['lastName'] = profile_data['lastName']
        if 'username' in profile_data:
            # Check if username is already taken by another user
            existing_user = users.find_one({
                'username': profile_data['username'],
                '_id': {'$ne': ObjectId(user_id)}
            })
            if existing_user:
                return {
                    'success': False,
                    'error': 'Username already taken'
                }
            update_fields['username'] = profile_data['username']
        if 'email' in profile_data:
            # Check if email is already taken by another user
            existing_user = users.find_one({
                'email': profile_data['email'],
                '_id': {'$ne': ObjectId(user_id)}
            })
            if existing_user:
                return {
                    'success': False,
                    'error': 'Email already taken'
                }
            update_fields['email'] = profile_data['email']
        if 'phone' in profile_data:
            update_fields['phone'] = profile_data['phone']
        if 'bio' in profile_data:
            update_fields['bio'] = profile_data['bio']
        
        # Update user in database
        users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_fields}
        )
        
        # Get updated user data
        updated_user = users.find_one({'_id': ObjectId(user_id)})
        
        response_data = {
            'firstName': updated_user.get('firstName', ''),
            'lastName': updated_user.get('lastName', ''),
            'username': updated_user.get('username', ''),
            'email': updated_user.get('email', ''),
            'phone': updated_user.get('phone', ''),
            'bio': updated_user.get('bio', ''),
            'plan': updated_user.get('plan', 'Premium')
        }
        
        return {
            'success': True,
            'data': response_data,
            'message': 'Profile updated successfully'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to update profile: {str(e)}'
        }

def get_user_preferences(user_id):
    try:
        db = get_db()
        users = db.users
        
        user = users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return {
                'success': False,
                'error': 'User not found'
            }
        
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
        
        return {
            'success': True,
            'data': preferences
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to get preferences: {str(e)}'
        }

def update_user_preferences(user_id, data):
    try:
        db = get_db()
        users = db.users
        
        # Check if user exists
        user = users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return {
                'success': False,
                'error': 'User not found'
            }
        
        preferences = data.get('preferences', {})
        
        # Validate preferences
        valid_preferences = {}
        
        # Notification settings
        if 'emailNotifications' in preferences:
            valid_preferences['emailNotifications'] = bool(preferences['emailNotifications'])
        if 'priceAlerts' in preferences:
            valid_preferences['priceAlerts'] = bool(preferences['priceAlerts'])
        if 'analysisReports' in preferences:
            valid_preferences['analysisReports'] = bool(preferences['analysisReports'])
        if 'newsletter' in preferences:
            valid_preferences['newsletter'] = bool(preferences['newsletter'])
        
        # Display settings
        if 'theme' in preferences and preferences['theme'] in ['light', 'dark', 'auto']:
            valid_preferences['theme'] = preferences['theme']
        if 'defaultTimeframe' in preferences and preferences['defaultTimeframe'] in ['1D', '1W', '1M', '3M', '1Y']:
            valid_preferences['defaultTimeframe'] = preferences['defaultTimeframe']
        
        # Trading preferences
        if 'alertThreshold' in preferences:
            threshold = int(preferences['alertThreshold'])
            if 1 <= threshold <= 20:
                valid_preferences['alertThreshold'] = threshold
        if 'autoRefresh' in preferences:
            valid_preferences['autoRefresh'] = bool(preferences['autoRefresh'])
        if 'refreshInterval' in preferences and preferences['refreshInterval'] in [15, 30, 60, 300]:
            valid_preferences['refreshInterval'] = int(preferences['refreshInterval'])
        
        # Update preferences in database
        users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'preferences': valid_preferences}}
        )
        
        return {
            'success': True,
            'data': valid_preferences,
            'message': 'Preferences updated successfully'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to update preferences: {str(e)}'
        }