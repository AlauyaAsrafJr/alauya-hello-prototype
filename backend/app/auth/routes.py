from datetime import datetime, date

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

from app.extensions import db, bcrypt
from app.models import SystemUser, Player, LoginHistory

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json(force=True) or {}
    required = ["username", "password", "first_name", "last_name", "email"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    if SystemUser.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already taken"}), 409
    if Player.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user = SystemUser(username=data["username"], password_hash=password_hash, role="player")
    db.session.add(user)
    db.session.flush()

    dob = None
    if data.get("date_of_birth"):
        try:
            dob = date.fromisoformat(data["date_of_birth"])
        except ValueError:
            dob = None

    player = Player(
        user_id=user.user_id,
        first_name=data["first_name"],
        last_name=data["last_name"],
        email=data["email"],
        contact_number=data.get("contact_number"),
        date_of_birth=dob,
        team=data.get("team"),
    )
    db.session.add(player)
    db.session.commit()

    return jsonify({"message": "Registration successful", "player": player.to_dict()}), 201


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
