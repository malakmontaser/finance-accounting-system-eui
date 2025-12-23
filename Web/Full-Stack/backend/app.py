from flask import Flask, jsonify
from config import Config
from models import db
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS


def create_app(config_updates=None):
    """
    Application factory function that creates and configures the Flask app.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    if config_updates:
        app.config.update(config_updates)

    # Enable CORS for cross-origin requests
    CORS(app)

    # Initialize database
    db.init_app(app)

    # Initialize migrations
    Migrate(app, db)

    # Initialize JWT authentication
    JWTManager(app)

    # ========================================================================
    # Health Check Endpoint
    # ========================================================================
    @app.route("/api/health", methods=["GET"])
    def health():
        """Simple health check endpoint."""
        return jsonify({
            "status": "ok",
            "message": "Student Management and Finance System API is running"
        }), 200

    # ========================================================================
    # Register Blueprints
    # ========================================================================
    from routes.auth import auth_bp
    from routes.students import students_bp
    from routes.finance import finance_bp
    from routes.courses import courses_bp

    # Authentication routes
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # Student routes
    app.register_blueprint(students_bp, url_prefix="/api/students")

    # Finance department routes
    app.register_blueprint(finance_bp, url_prefix="/api/finance")

    # Course management routes
    app.register_blueprint(courses_bp, url_prefix="/api/courses")

    # ========================================================================
    # Error Handlers
    # ========================================================================
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors."""
        return jsonify({"error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
