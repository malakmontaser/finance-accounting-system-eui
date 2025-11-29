from flask import Flask, jsonify
from config import Config
from models import db
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)

    # simple health
    @app.route("/api/health")
    def health():
        return jsonify({"status":"ok"})

    # import blueprints (defined next)
    from routes.auth import auth_bp
    from routes.students import students_bp
    from routes.transactions import transactions_bp
    from routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(students_bp, url_prefix="/api/students")
    app.register_blueprint(transactions_bp, url_prefix="/api/transactions")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
