from flask import Flask, jsonify

from config import Config
from app.extensions import db, bcrypt, jwt, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from app.auth.routes import auth_bp
    from app.player.routes import player_bp
    from app.coach.routes import coach_bp
    from app.admin.routes import admin_bp
    from app.common.routes import common_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(player_bp, url_prefix="/api/player")
    app.register_blueprint(coach_bp, url_prefix="/api/coach")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(common_bp, url_prefix="/api")

    @jwt.unauthorized_loader
    def unauthorized_callback(reason):
        return jsonify({"error": "Missing or invalid token", "detail": reason}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({"error": "Invalid token", "detail": reason}), 422

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token expired"}), 401

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app
