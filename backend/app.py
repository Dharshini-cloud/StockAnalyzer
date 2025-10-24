from flask import Flask, jsonify
from flask_cors import CORS
from config import DEBUG, PORT, HOST, JWT_SECRET
from database import get_database

# Import blueprints
from routes.auth_routes import auth_bp, jwt
from routes.watchlist_routes import watchlist_bp
from routes.notification_routes import notification_bp
from routes.stock_routes import stock_bp
from routes.analysis_routes import analysis_bp
from routes.portfolio_routes import portfolio_bp
from routes.profile_routes import profile_bp  # ✅ ADD THIS LINE

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['DEBUG'] = DEBUG
    app.config['JWT_SECRET_KEY'] = JWT_SECRET
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
    
    # CORS configuration
    CORS(app, 
         origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
    app.register_blueprint(profile_bp, url_prefix='/api')  # ✅ ADD THIS LINE
    
    # Health check route
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "message": "Stock Analyzer Backend is running"
        })
    
    # Root endpoint
    @app.route('/')
    def root():
        return jsonify({
            "message": "Stock Analyzer API",
            "version": "1.0.0",
            "endpoints": {
                "auth": "/api/auth",
                "stocks": "/api/stock",
                "watchlist": "/api/watchlist",
                "notifications": "/api/notifications",
                "portfolio": "/api/portfolio",
                "profile": "/api/user/profile"  # ✅ ADD THIS LINE
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host=HOST, port=PORT, debug=DEBUG)