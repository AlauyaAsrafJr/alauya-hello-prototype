from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

from app.extensions import db, bcrypt
from app.models import SystemUser, LoginHistory

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
def login():
    data = request.get_json(force=True) or {}
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = SystemUser.query.filter_by(username=username).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid username or password"}), 401
    if not user.is_active:
        return jsonify({"error": "This account has been deactivated"}), 403

    now = datetime.utcnow()
    user.last_login = now
    log = LoginHistory(
        user_id=user.user_id,
        login_time=now,
        ip_address=request.headers.get("X-Forwarded-For", request.remote_addr),
        device_info=request.headers.get("User-Agent"),
    )
    db.session.add(log)
    db.session.commit()

    token = create_access_token(
        identity=str(user.user_id), additional_claims={"role": user.role, "username": user.username}
    )
    profile = user.profile()

    return jsonify(
        {
            "access_token": token,
            "user": {
                "user_id": user.user_id,
                "username": user.username,
                "role": user.role,
                "display_name": user.display_name(),
                "profile": profile.to_dict() if profile else None,
            },
        }
    )


@auth_bp.post("/logout")
@jwt_required()
def logout():
    user_id = int(get_jwt_identity())
    last_log = (
        LoginHistory.query.filter_by(user_id=user_id, logout_time=None)
        .order_by(LoginHistory.login_time.desc())
        .first()
    )
    if last_log:
        last_log.logout_time = datetime.utcnow()
        db.session.commit()
    return jsonify({"message": "Logged out"})


@auth_bp.post("/change-password")
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get_or_404(user_id)
    data = request.get_json(force=True) or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    if not current_password or not new_password:
        return jsonify({"error": "Current and new password are required"}), 400
    if not bcrypt.check_password_hash(user.password_hash, current_password):
        return jsonify({"error": "Current password is incorrect"}), 401
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400
    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    return jsonify({"message": "Password updated"})


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = SystemUser.query.get_or_404(user_id)
    profile = user.profile()
    return jsonify(
        {
            "user_id": user.user_id,
            "username": user.username,
            "role": user.role,
            "display_name": user.display_name(),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "profile": profile.to_dict() if profile else None,
        }
    )
