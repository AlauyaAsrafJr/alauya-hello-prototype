from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.decorators import roles_required
from app.extensions import db, bcrypt
from app.models import (
    SystemUser,
    Player,
    Coach,
    Admin,
    Attendance,
    TrainingActivity,
    PerformanceFeedback,
    PlayerHealthRecord,
    LoginHistory,
    ArchivedRecord,
    Report,
    Statistic,
    Sport,
)

admin_bp = Blueprint("admin", __name__)


def _current_admin():
    user_id = int(get_jwt_identity())
    return Admin.query.filter_by(user_id=user_id).first()


@admin_bp.get("/profile")
@roles_required("admin")
def get_profile():
    admin = _current_admin()
    if not admin:
        return jsonify({"error": "Admin profile not found"}), 404
    return jsonify(admin.to_dict())


# ---- Manage System Users ----


@admin_bp.get("/users")
@roles_required("admin")
def list_users():
    role = request.args.get("role")
    query = SystemUser.query
    if role:
        query = query.filter_by(role=role)
    users = query.order_by(SystemUser.user_id).all()
    result = []
    for u in users:
        profile = u.profile()
        result.append(
            {
                "user_id": u.user_id,
                "username": u.username,
                "role": u.role,
                "is_active": u.is_active,
                "last_login": u.last_login.isoformat() if u.last_login else None,
                "display_name": u.display_name(),
                "email": getattr(profile, "email", None),
                "team": getattr(profile, "team", None) or getattr(profile, "specialization", None),
            }
        )
    return jsonify(result)


@admin_bp.post("/users")
@roles_required("admin")
def create_user():
    data = request.get_json(force=True) or {}
    required = ["username", "password", "role", "first_name", "last_name", "email"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    role = data["role"]
    if role not in ("player", "coach", "admin"):
        return jsonify({"error": "role must be player, coach, or admin"}), 400
    if SystemUser.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already taken"}), 409

    password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user = SystemUser(username=data["username"], password_hash=password_hash, role=role)
    db.session.add(user)
    db.session.flush()

    profile_kwargs = dict(
        user_id=user.user_id,
        first_name=data["first_name"],
        last_name=data["last_name"],
        email=data["email"],
    )
    if role == "player":
        profile = Player(contact_number=data.get("contact_number"), team=data.get("team"), **profile_kwargs)
    elif role == "coach":
        profile = Coach(contact_number=data.get("contact_number"), specialization=data.get("specialization"), **profile_kwargs)
    else:
        profile = Admin(**profile_kwargs)
    db.session.add(profile)
    db.session.commit()
    return jsonify({"message": "User created", "user_id": user.user_id}), 201


@admin_bp.post("/users/<int:user_id>/deactivate")
@roles_required("admin")
def deactivate_user(user_id):
    user = SystemUser.query.get_or_404(user_id)
    user.is_active = False
    db.session.commit()
    return jsonify({"message": f"User {user.username} deactivated"})


@admin_bp.post("/users/<int:user_id>/activate")
@roles_required("admin")
def activate_user(user_id):
    user = SystemUser.query.get_or_404(user_id)
    user.is_active = True
    db.session.commit()
    return jsonify({"message": f"User {user.username} activated"})


@admin_bp.post("/users/<int:user_id>/archive")
@roles_required("admin")
def archive_user(user_id):
    admin_user_id = int(get_jwt_identity())
    user = SystemUser.query.get_or_404(user_id)
    profile = user.profile()
    snapshot = {
        "user_id": user.user_id,
        "username": user.username,
        "role": user.role,
        "profile": profile.to_dict() if profile else None,
    }
    record = ArchivedRecord(
        record_type="user",
        record_id=user.user_id,
        archive_data=snapshot,
        archived_by=admin_user_id,
    )
    user.is_active = False
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@admin_bp.post("/users/<int:user_id>/reset-password")
@roles_required("admin")
def reset_password(user_id):
    user = SystemUser.query.get_or_404(user_id)
    new_password = "changeme"
    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    return jsonify({"message": "Password reset", "temporary_password": new_password})


@admin_bp.get("/players")
@roles_required("admin")
def access_all_player_data():
    players = Player.query.order_by(Player.last_name).all()
    return jsonify([p.to_dict() for p in players])


@admin_bp.get("/players/health-overview")
@roles_required("admin")
def player_health_overview():
    players = Player.query.order_by(Player.last_name).all()
    counts = {"healthy": 0, "injured": 0, "recovering": 0}
    for p in players:
        counts[p.health_status] += 1

    status_rank = {"injured": 0, "recovering": 1, "healthy": 2}
    entries = []
    for p in players:
        entry = p.to_dict()
        latest = (
            PlayerHealthRecord.query.filter_by(player_id=p.player_id)
            .order_by(PlayerHealthRecord.reported_date.desc())
            .first()
        )
        entry["latest_reported_date"] = latest.reported_date.isoformat() if latest else None
        entry["latest_injury_type"] = latest.injury_type if latest else None
        entries.append(entry)
    entries.sort(key=lambda e: status_rank.get(e["health_status"], 3))

    return jsonify({"counts": counts, "players": entries})


@admin_bp.get("/players/<int:player_id>/health")
@roles_required("admin")
def get_player_health_admin(player_id):
    Player.query.get_or_404(player_id)
    records = (
        PlayerHealthRecord.query.filter_by(player_id=player_id)
        .order_by(PlayerHealthRecord.reported_date.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records])


@admin_bp.get("/attendance")
@roles_required("admin")
def list_all_attendance():
    player_id = request.args.get("player_id", type=int)
    query = Attendance.query
    if player_id:
        query = query.filter_by(player_id=player_id)
    records = query.order_by(Attendance.date.desc()).all()
    return jsonify([r.to_dict() for r in records])


@admin_bp.get("/training-activities")
@roles_required("admin")
def list_all_training_activities():
    activities = TrainingActivity.query.order_by(TrainingActivity.activity_date.desc()).all()
    return jsonify([a.to_dict() for a in activities])


# ---- Analytics & Reports ----


@admin_bp.get("/analytics")
@roles_required("admin")
def get_analytics():
    total_players = Player.query.count()
    total_coaches = Coach.query.count()
    total_activities = TrainingActivity.query.count()
    total_attendance = Attendance.query.count()
    present_total = Attendance.query.filter_by(status="present").count()
    attendance_rate = round(present_total / total_attendance * 100, 1) if total_attendance else 0
    feedback = PerformanceFeedback.query.all()
    avg_rating = round(sum(f.rating for f in feedback) / len(feedback), 2) if feedback else None

    return jsonify(
        {
            "total_players": total_players,
            "total_coaches": total_coaches,
            "total_activities": total_activities,
            "attendance_rate": attendance_rate,
            "average_rating": avg_rating,
        }
    )


@admin_bp.get("/reports")
@roles_required("admin")
def list_reports():
    status = request.args.get("status")
    query = Report.query
    if status:
        query = query.filter_by(status=status)
    reports = query.order_by(Report.generated_date.desc()).all()
    return jsonify([r.to_dict() for r in reports])


@admin_bp.post("/reports")
@roles_required("admin")
def generate_report():
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True) or {}
    report_type = data.get("report_type")
    if report_type not in ("attendance", "performance", "training"):
        return jsonify({"error": "report_type must be attendance, performance, or training"}), 400
    report = Report(
        report_type=report_type,
        generated_by=user_id,
        details=data.get("details", f"{report_type.title()} report generated by admin"),
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report.to_dict()), 201


@admin_bp.post("/reports/<int:report_id>/approve")
@roles_required("admin")
def approve_report(report_id):
    user_id = int(get_jwt_identity())
    report = Report.query.get_or_404(report_id)
    report.status = "approved"
    report.approved_by = user_id
    report.approved_date = datetime.utcnow()
    db.session.commit()
    return jsonify(report.to_dict())


# ---- View System Statistics ----


@admin_bp.get("/statistics")
@roles_required("admin")
def get_system_statistics():
    return jsonify(
        {
            "total_users": SystemUser.query.count(),
            "total_players": Player.query.count(),
            "total_coaches": Coach.query.count(),
            "total_admins": Admin.query.count(),
            "active_users": SystemUser.query.filter_by(is_active=True).count(),
            "total_activities": TrainingActivity.query.count(),
            "total_attendance_records": Attendance.query.count(),
            "total_reports": Report.query.count(),
            "pending_reports": Report.query.filter_by(status="pending").count(),
            "archived_records": ArchivedRecord.query.count(),
        }
    )


@admin_bp.get("/login-history")
@roles_required("admin")
def get_login_history():
    user_id = request.args.get("user_id", type=int)
    query = LoginHistory.query
    if user_id:
        query = query.filter_by(user_id=user_id)
    logs = query.order_by(LoginHistory.login_time.desc()).limit(200).all()
    return jsonify([log.to_dict() for log in logs])


# ---- Retrieve Archived Records ----


@admin_bp.get("/archive")
@roles_required("admin")
def list_archived_records():
    record_type = request.args.get("record_type")
    query = ArchivedRecord.query
    if record_type:
        query = query.filter_by(record_type=record_type)
    records = query.order_by(ArchivedRecord.archived_at.desc()).all()
    return jsonify([r.to_dict() for r in records])


@admin_bp.post("/archive")
@roles_required("admin")
def archive_record():
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True) or {}
    required = ["record_type", "record_id", "archive_data"]
    missing = [f for f in required if data.get(f) in (None, "")]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    record = ArchivedRecord(
        record_type=data["record_type"],
        record_id=data["record_id"],
        archive_data=data["archive_data"],
        archived_by=user_id,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@admin_bp.post("/archive/<int:archive_id>/restore")
@roles_required("admin")
def restore_archived_record(archive_id):
    record = ArchivedRecord.query.get_or_404(archive_id)
    if record.record_type == "user":
        user = SystemUser.query.get(record.record_id)
        if user:
            user.is_active = True
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Record restored"})


@admin_bp.delete("/archive/<int:archive_id>")
@roles_required("admin")
def delete_archived_record(archive_id):
    record = ArchivedRecord.query.get_or_404(archive_id)
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Record permanently deleted"})


# ---- Manage Sports / Teams ----


@admin_bp.get("/sports")
@roles_required("admin")
def list_sports():
    sports = Sport.query.order_by(Sport.name).all()
    return jsonify([s.to_dict() for s in sports])


@admin_bp.post("/sports")
@roles_required("admin")
def create_sport():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    if Sport.query.filter(db.func.lower(Sport.name) == name.lower()).first():
        return jsonify({"error": "That sport already exists"}), 409
    sport = Sport(name=name)
    db.session.add(sport)
    db.session.commit()
    return jsonify(sport.to_dict()), 201


@admin_bp.delete("/sports/<int:sport_id>")
@roles_required("admin")
def delete_sport(sport_id):
    sport = Sport.query.get_or_404(sport_id)
    in_use = (
        Player.query.filter_by(team=sport.name).first()
        or Coach.query.filter_by(specialization=sport.name).first()
    )
    if in_use:
        return jsonify({"error": "This sport is still assigned to a player or coach and can't be removed"}), 400
    db.session.delete(sport)
    db.session.commit()
    return jsonify({"message": "Sport removed"})
