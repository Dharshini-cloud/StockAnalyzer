from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from database import get_database
from datetime import datetime
from bson import ObjectId

db = get_database()
users_collection = db.users
bcrypt = Bcrypt()

def register_user(username, email, password):
    try:
        print(f"🔧 Registering user: {username}, {email}")
        
        # Check if user already exists
        if users_collection.find_one({"email": email}):
            return {"error": "User with this email already exists"}, False
        
        if users_collection.find_one({"username": username}):
            return {"error": "Username already taken"}, False

        # Create new user
        hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
        user_data = {
            "username": username,
            "email": email,
            "password": hashed_pw,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = users_collection.insert_one(user_data)
        print(f"✅ User inserted with ID: {result.inserted_id}")
        
        # Create access token
        access_token = create_access_token(identity=str(result.inserted_id))
        
        return {
            "message": "User registered successfully",
            "access_token": access_token,
            "username": username,
            "user_id": str(result.inserted_id)
        }, True
        
    except Exception as e:
        print(f"💥 Registration error: {str(e)}")
        return {"error": f"Registration failed: {str(e)}"}, False

def login_user(email, password):
    try:
        print(f"🔧 Attempting login for: {email}")
        user = users_collection.find_one({"email": email})
        
        if not user:
            print("❌ User not found")
            return {"error": "Invalid email or password"}, False

        # Check password
        password_valid = bcrypt.check_password_hash(user["password"], password)
        if not password_valid:
            print("❌ Invalid password")
            return {"error": "Invalid email or password"}, False

        access_token = create_access_token(identity=str(user["_id"]))
        print(f"✅ Login successful for: {user['username']}")
        
        return {
            "message": "Login successful",
            "access_token": access_token, 
            "username": user["username"],
            "user_id": str(user["_id"])
        }, True
        
    except Exception as e:
        print(f"💥 Login error: {str(e)}")
        return {"error": f"Login failed: {str(e)}"}, False

def get_user_by_id(user_id):
    try:
        return users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception as e:
        print(f"💥 Error getting user by ID: {str(e)}")
        return None