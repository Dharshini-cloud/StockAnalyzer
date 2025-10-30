import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import get_database
from flask_socketio import SocketIO

# Import blueprints
from routes.auth_routes import auth_bp, jwt
from routes.watchlist_routes import watchlist_bp
from routes.notification_routes import notification_bp
from routes.stock_routes import stock_bp
from routes.analysis_routes import analysis_bp
from routes.portfolio_routes import portfolio_bp
from routes.profile_routes import profile_bp

socketio = SocketIO(cors_allowed_origins="*")
def create_app():
    app = Flask(__name__)
    
    # Configuration - Use environment variables for production
    app.config['DEBUG'] = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'fallback-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
    socketio.init_app(app)
    # Get frontend URL from environment or use default
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    
    # CORS configuration for production
    CORS(app, 
         origins=[
             "http://localhost:3000", 
             "http://127.0.0.1:3000",
             frontend_url  # This will be your Render frontend URL
         ],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Initialize JWT
    jwt.init_app(app)
    
    # Initialize database connection
    try:
        get_database()
        print("✅ Database initialized successfully!")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(watchlist_bp, url_prefix='/api')
    app.register_blueprint(notification_bp, url_prefix='/api')
    app.register_blueprint(stock_bp, url_prefix='/api')
    app.register_blueprint(analysis_bp, url_prefix='/api')
    app.register_blueprint(portfolio_bp, url_prefix='/api')
    app.register_blueprint(profile_bp, url_prefix='/api')
    
    # Health check route - Important for deployment
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "message": "Stock Analyzer Backend is running",
            "environment": "production" if os.environ.get('RENDER') else "development"
        })
    
    # Root endpoint
    @app.route('/')
    def root():
        return jsonify({
            "message": "Stock Analyzer API",
            "version": "1.0.0",
            "environment": "production" if os.environ.get('RENDER') else "development",
            "endpoints": {
                "auth": "/api/auth",
                "stocks": "/api/stock",
                "watchlist": "/api/watchlist",
                "notifications": "/api/notifications",
                "portfolio": "/api/portfolio",
                "profile": "/api/user/profile"
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    @socketio.on('connect')
    def handle_connect():
        print('Client connected')
    
    @socketio.on('disconnect') 
    def handle_disconnect():
        print('Client disconnected')
    
    return app

# For local development
if __name__ == '__main__':
    app = create_app()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)