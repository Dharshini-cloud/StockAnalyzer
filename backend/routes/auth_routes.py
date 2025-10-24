from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from services.auth_service import register_user, login_user, get_user_by_id

auth_bp = Blueprint('auth', __name__)
jwt = JWTManager()

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        print("📝 Registration attempt:", data)  # Debug log
        
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({"success": False, "error": "All fields are required"}), 400
        
        result, success = register_user(username, email, password)
        
        if success:
            print("✅ Registration successful:", username)
            return jsonify({"success": True, "data": result}), 201
        else:
            print("❌ Registration failed:", result.get("error"))
            return jsonify({"success": False, "error": result.get("error")}), 400
            
    except Exception as e:
        print("💥 Registration exception:", str(e))
        return jsonify({"success": False, "error": "Registration failed"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print("📝 Login attempt:", data.get('email'))  # Debug log
        
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({"success": False, "error": "Email and password are required"}), 400
        
        result, success = login_user(email, password)
        
        if success:
            print("✅ Login successful:", email)
            return jsonify({"success": True, "data": result}), 200
        else:
            print("❌ Login failed:", result.get("error"))
            return jsonify({"success": False, "error": result.get("error")}), 401
            
    except Exception as e:
        print("💥 Login exception:", str(e))
        return jsonify({"success": False, "error": "Login failed"}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = get_jwt_identity()
        user = get_user_by_id(current_user_id)
        
        if user:
            return jsonify({
                "success": True,
                "data": {
                    "username": user["username"],
                    "email": user["email"]
                }
            }), 200
        else:
            return jsonify({"success": False, "error": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to get user data"}), 500

@jwt.user_identity_loader
def user_identity_lookup(user):
    return user

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return get_user_by_id(identity)