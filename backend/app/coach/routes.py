import os
import uuid
from datetime import date, datetime

from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.decorators import roles_required
from app.extensions import db, bcrypt
from app.models import (
    Coach,
    Player,
    Attendance,
    TrainingActivity,
    Participation,
    PerformanceFeedback,
    PlayerHealthRecord,
    FeedbackCategory,
    ActivityType,
    Report,
    PlayerRequest,
    SystemUser,
)

coach_bp = Blueprint("coach", __name__)

ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def _current_coach():
    user_id = int(get_jwt_identity())
    return Coach.query.filter_by(user_id=user_id).first()


def _team_players_query(coach):
    """Players on the coach's own team only. A coach with no team assigned sees none."""
    if not coach.specialization:
        return Player.query.filter(Player.player_id == -1)
    return Player.query.filter_by(team=coach.specialization)


def _team_player_ids(coach):
    return {p.player_id for p in _team_players_query(coach).with_entities(Player.player_id).all()}


@coach_bp.get("/profile")
@roles_required("coach")
def get_profile():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    return jsonify(coach.to_dict())


@coach_bp.patch("/profile")
@roles_required("coach")
def update_profile():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    data = request.get_json(force=True) or {}
    # Coaches may only update limited, non-sensitive fields of their own profile.
    editable_fields = ["contact_number", "profile_photo"]
    for field in editable_fields:
        if field in data:
            setattr(coach, field, data[field])
    db.session.commit()
    return jsonify(coach.to_dict())


@coach_bp.post("/profile/photo")
@roles_required("coach")
def upload_profile_photo():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    file = request.files.get("photo")
    if not file or not file.filename:
        return jsonify({"error": "No photo file provided"}), 400
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_PHOTO_EXTENSIONS:
        return jsonify({"error": "Unsupported image type. Use JPG, PNG, WEBP, or GIF."}), 400

    upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "coaches")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"coach_{coach.coach_id}_{uuid.uuid4().hex[:8]}{ext}"
    file.save(os.path.join(upload_dir, filename))

    coach.profile_photo = f"/api/uploads/coaches/{filename}"
    db.session.commit()
    return jsonify(coach.to_dict())


# ---- Manage Player Profile ----


@coach_bp.get("/players")
@roles_required("coach")
def list_players():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    q = request.args.get("q", "").strip()
    query = _team_players_query(coach)
    if q:
        like = f"%{q}%"
        query = query.filter(
            db.or_(Player.first_name.ilike(like), Player.last_name.ilike(like), Player.email.ilike(like))
        )
    players = query.order_by(Player.last_name).all()
    return jsonify([p.to_dict() for p in players])


@coach_bp.get("/players/<int:player_id>")
@roles_required("coach")
def get_player(player_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    player = Player.query.get_or_404(player_id)
    if player.player_id not in _team_player_ids(coach):
        return jsonify({"error": "Player not found"}), 404
    return jsonify(player.to_dict())


@coach_bp.patch("/players/<int:player_id>")
@roles_required("coach")
def edit_player_profile(player_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    player = Player.query.get_or_404(player_id)
    if player.player_id not in _team_player_ids(coach):
        return jsonify({"error": "Player not found"}), 404
    data = request.get_json(force=True) or {}
    if data.get("year_level") not in (None, "") and not 1 <= int(data["year_level"]) <= 4:
        return jsonify({"error": "year_level must be between 1 and 4"}), 400
    # Team reassignment is an admin-only action, so coaches can't move a player off their roster.
    editable_fields = [
        "first_name",
        "last_name",
        "email",
        "contact_number",
        "membership_status",
        "profile_photo",
        "year_level",
    ]
    for field in editable_fields:
        if field in data:
            setattr(player, field, data[field])
    if "date_of_birth" in data and data["date_of_birth"]:
        player.date_of_birth = date.fromisoformat(data["date_of_birth"])
    db.session.commit()
    return jsonify(player.to_dict())


# ---- Add Player (requires admin approval) ----


@coach_bp.get("/player-requests")
@roles_required("coach")
def list_player_requests():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    requests_ = (
        PlayerRequest.query.filter_by(coach_id=coach.coach_id)
        .order_by(PlayerRequest.requested_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in requests_])


@coach_bp.post("/player-requests")
@roles_required("coach")
def create_player_request():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    if not coach.specialization:
        return jsonify({"error": "You don't have a team assigned yet"}), 400
    data = request.get_json(force=True) or {}
    required = ["username", "password", "first_name", "last_name", "email"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    if data.get("year_level") not in (None, "") and not 1 <= int(data["year_level"]) <= 4:
        return jsonify({"error": "year_level must be between 1 and 4"}), 400
    if SystemUser.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already taken"}), 409
    if PlayerRequest.query.filter_by(username=data["username"], status="pending").first():
        return jsonify({"error": "A pending request already uses that username"}), 409

    middle_initial = (data.get("middle_name") or "").strip()[:1].upper() or None
    player_request = PlayerRequest(
        coach_id=coach.coach_id,
        first_name=data["first_name"],
        middle_name=middle_initial,
        last_name=data["last_name"],
        email=data["email"],
        contact_number=data.get("contact_number"),
        date_of_birth=(date.fromisoformat(data["date_of_birth"]) if data.get("date_of_birth") else None),
        year_level=data.get("year_level") or None,
        team=coach.specialization,
        username=data["username"],
        password_hash=bcrypt.generate_password_hash(data["password"]).decode("utf-8"),
    )
    db.session.add(player_request)
    db.session.commit()
    return jsonify(player_request.to_dict()), 201


# ---- Player Health / Injury Monitoring ----


@coach_bp.get("/players/<int:player_id>/health")
@roles_required("coach")
def get_player_health(player_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    if player_id not in _team_player_ids(coach):
        return jsonify({"error": "Player not found"}), 404
    records = (
        PlayerHealthRecord.query.filter_by(player_id=player_id)
        .order_by(PlayerHealthRecord.reported_date.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in records])


@coach_bp.post("/players/<int:player_id>/health")
@roles_required("coach")
def log_player_health(player_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    if player_id not in _team_player_ids(coach):
        return jsonify({"error": "Player not found"}), 404
    data = request.get_json(force=True) or {}
    status = data.get("status")
    if status not in ("healthy", "injured", "recovering"):
        return jsonify({"error": "status must be healthy, injured, or recovering"}), 400

    record = PlayerHealthRecord(
        player_id=player_id,
        coach_id=coach.coach_id,
        status=status,
        injury_type=data.get("injury_type"),
        notes=data.get("notes"),
        expected_return_date=(
            date.fromisoformat(data["expected_return_date"]) if data.get("expected_return_date") else None
        ),
    )
    db.session.add(record)

    player = Player.query.get_or_404(player_id)
    player.health_status = status
    db.session.commit()
    return jsonify(record.to_dict()), 201


# ---- Track Participation: Record Attendance ----


@coach_bp.get("/attendance")
@roles_required("coach")
def list_attendance():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    query = Attendance.query.join(Player).filter(Player.player_id.in_(_team_player_ids(coach)))
    player_id = request.args.get("player_id", type=int)
    on_date = request.args.get("date")
    if player_id:
        query = query.filter(Attendance.player_id == player_id)
    if on_date:
        query = query.filter(Attendance.date == date.fromisoformat(on_date))
    records = query.order_by(Attendance.date.desc()).all()
    return jsonify([r.to_dict() for r in records])


@coach_bp.post("/attendance")
@roles_required("coach")
def record_attendance():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    data = request.get_json(force=True) or {}
    entries = data.get("records")
    session_date = data.get("date")
    if not entries or not session_date:
        return jsonify({"error": "date and records[] are required"}), 400

    team_player_ids = _team_player_ids(coach)
    invalid = [e["player_id"] for e in entries if e["player_id"] not in team_player_ids]
    if invalid:
        return jsonify({"error": "One or more players are not on your team"}), 400

    parsed_date = date.fromisoformat(session_date)
    created = []
    for entry in entries:
        att = Attendance(
            player_id=entry["player_id"],
            coach_id=coach.coach_id,
            date=parsed_date,
            status=entry["status"],
        )
        db.session.add(att)
        created.append(att)
    db.session.commit()
    return jsonify([a.to_dict() for a in created]), 201


@coach_bp.patch("/attendance/<int:attendance_id>")
@roles_required("coach")
def edit_attendance(attendance_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    record = Attendance.query.get_or_404(attendance_id)
    if record.player_id not in _team_player_ids(coach):
        return jsonify({"error": "Attendance record not found"}), 404
    data = request.get_json(force=True) or {}
    if "status" in data:
        record.status = data["status"]
    db.session.commit()
    return jsonify(record.to_dict())


# ---- Track Participation: Log / Edit Training Activity ----


@coach_bp.get("/activity-types")
@roles_required("coach")
def list_activity_types():
    coach = _current_coach()
    if not coach or not coach.specialization:
        return jsonify([])
    types = (
        ActivityType.query.filter_by(sport_name=coach.specialization)
        .order_by(ActivityType.name)
        .all()
    )
    return jsonify([t.to_dict() for t in types])


@coach_bp.post("/activity-types")
@roles_required("coach")
def create_activity_type():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    if not coach.specialization:
        return jsonify({"error": "You don't have a team assigned yet"}), 400
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    existing = ActivityType.query.filter(
        ActivityType.sport_name == coach.specialization,
        db.func.lower(ActivityType.name) == name.lower(),
    ).first()
    if existing:
        return jsonify(existing.to_dict()), 200
    activity_type = ActivityType(sport_name=coach.specialization, name=name)
    db.session.add(activity_type)
    db.session.commit()
    return jsonify(activity_type.to_dict()), 201


@coach_bp.patch("/activity-types/<int:activity_type_id>")
@roles_required("coach")
def update_activity_type(activity_type_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    activity_type = ActivityType.query.get_or_404(activity_type_id)
    if activity_type.sport_name != coach.specialization:
        return jsonify({"error": "Activity type not found"}), 404
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    existing = ActivityType.query.filter(
        ActivityType.sport_name == coach.specialization,
        db.func.lower(ActivityType.name) == name.lower(),
        ActivityType.activity_type_id != activity_type_id,
    ).first()
    if existing:
        return jsonify({"error": "That activity type already exists for this sport"}), 409
    activity_type.name = name
    db.session.commit()
    return jsonify(activity_type.to_dict())


@coach_bp.delete("/activity-types/<int:activity_type_id>")
@roles_required("coach")
def delete_activity_type(activity_type_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    activity_type = ActivityType.query.get_or_404(activity_type_id)
    if activity_type.sport_name != coach.specialization:
        return jsonify({"error": "Activity type not found"}), 404
    db.session.delete(activity_type)
    db.session.commit()
    return jsonify({"message": "Activity type removed"})


@coach_bp.get("/training-activities")
@roles_required("coach")
def list_training_activities():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    activities = (
        TrainingActivity.query.filter_by(coach_id=coach.coach_id)
        .order_by(TrainingActivity.activity_date.desc())
        .all()
    )
    return jsonify([a.to_dict() for a in activities])


@coach_bp.post("/training-activities")
@roles_required("coach")
def log_training_activity():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    data = request.get_json(force=True) or {}
    required = ["activity_name", "activity_date"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    participant_ids = data.get("participant_ids", [])
    team_player_ids = _team_player_ids(coach)
    invalid = [pid for pid in participant_ids if pid not in team_player_ids]
    if invalid:
        return jsonify({"error": "One or more participants are not on your team"}), 400

    activity = TrainingActivity(
        coach_id=coach.coach_id,
        activity_name=data["activity_name"],
        activity_date=date.fromisoformat(data["activity_date"]),
        duration=data.get("duration"),
        notes=data.get("notes"),
        activity_type=(data.get("activity_type") or "").strip() or None,
    )
    db.session.add(activity)
    db.session.flush()

    for player_id in participant_ids:
        db.session.add(
            Participation(player_id=player_id, activity_id=activity.activity_id, participation_status="joined")
        )
    db.session.commit()
    return jsonify(activity.to_dict()), 201


@coach_bp.patch("/training-activities/<int:activity_id>")
@roles_required("coach")
def edit_training_activity(activity_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    activity = TrainingActivity.query.get_or_404(activity_id)
    if activity.coach_id != coach.coach_id:
        return jsonify({"error": "Training activity not found"}), 404
    data = request.get_json(force=True) or {}
    editable_fields = ["activity_name", "duration", "notes", "activity_type"]
    for field in editable_fields:
        if field in data:
            setattr(activity, field, data[field])
    if "activity_date" in data and data["activity_date"]:
        activity.activity_date = date.fromisoformat(data["activity_date"])
    db.session.commit()
    return jsonify(activity.to_dict())


@coach_bp.get("/training-activities/<int:activity_id>/participation")
@roles_required("coach")
def get_activity_participation(activity_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    activity = TrainingActivity.query.get_or_404(activity_id)
    if activity.coach_id != coach.coach_id:
        return jsonify({"error": "Training activity not found"}), 404
    records = Participation.query.filter_by(activity_id=activity_id).all()
    return jsonify([r.to_dict() for r in records])


@coach_bp.patch("/participation/<int:participation_id>")
@roles_required("coach")
def update_participation(participation_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    record = Participation.query.get_or_404(participation_id)
    if record.activity.coach_id != coach.coach_id:
        return jsonify({"error": "Participation record not found"}), 404
    data = request.get_json(force=True) or {}
    if "participation_status" in data:
        record.participation_status = data["participation_status"]
    db.session.commit()
    return jsonify(record.to_dict())


# ---- Performance Evaluation ----


@coach_bp.get("/feedback-categories")
@roles_required("coach")
def list_feedback_categories():
    coach = _current_coach()
    if not coach or not coach.specialization:
        return jsonify([])
    categories = (
        FeedbackCategory.query.filter_by(sport_name=coach.specialization)
        .order_by(FeedbackCategory.name)
        .all()
    )
    return jsonify([c.to_dict() for c in categories])


@coach_bp.post("/feedback-categories")
@roles_required("coach")
def create_feedback_category():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    if not coach.specialization:
        return jsonify({"error": "You don't have a team assigned yet"}), 400
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    existing = FeedbackCategory.query.filter(
        FeedbackCategory.sport_name == coach.specialization,
        db.func.lower(FeedbackCategory.name) == name.lower(),
    ).first()
    if existing:
        return jsonify(existing.to_dict()), 200
    category = FeedbackCategory(sport_name=coach.specialization, name=name)
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@coach_bp.patch("/feedback-categories/<int:category_id>")
@roles_required("coach")
def update_feedback_category(category_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    category = FeedbackCategory.query.get_or_404(category_id)
    if category.sport_name != coach.specialization:
        return jsonify({"error": "Category not found"}), 404
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    existing = FeedbackCategory.query.filter(
        FeedbackCategory.sport_name == coach.specialization,
        db.func.lower(FeedbackCategory.name) == name.lower(),
        FeedbackCategory.category_id != category_id,
    ).first()
    if existing:
        return jsonify({"error": "That category already exists for this sport"}), 409
    category.name = name
    db.session.commit()
    return jsonify(category.to_dict())


@coach_bp.delete("/feedback-categories/<int:category_id>")
@roles_required("coach")
def delete_feedback_category(category_id):
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    category = FeedbackCategory.query.get_or_404(category_id)
    if category.sport_name != coach.specialization:
        return jsonify({"error": "Category not found"}), 404
    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category removed"})


@coach_bp.get("/performance-feedback")
@roles_required("coach")
def list_performance_feedback():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    player_id = request.args.get("player_id", type=int)
    query = PerformanceFeedback.query.filter(
        PerformanceFeedback.player_id.in_(_team_player_ids(coach))
    )
    if player_id:
        query = query.filter(PerformanceFeedback.player_id == player_id)
    records = query.order_by(PerformanceFeedback.feedback_date.desc()).all()
    return jsonify([r.to_dict() for r in records])


@coach_bp.post("/performance-feedback")
@roles_required("coach")
def submit_performance_feedback():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    data = request.get_json(force=True) or {}
    required = ["player_id", "comments", "rating"]
    missing = [f for f in required if data.get(f) in (None, "")]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    if data["player_id"] not in _team_player_ids(coach):
        return jsonify({"error": "Player is not on your team"}), 400
    rating = int(data["rating"])
    if not 1 <= rating <= 5:
        return jsonify({"error": "rating must be between 1 and 5"}), 400

    category = (data.get("category") or "").strip() or None
    if category and not FeedbackCategory.query.filter_by(
        sport_name=coach.specialization, name=category
    ).first():
        return jsonify({"error": "That category isn't set up for your team's sport"}), 400

    feedback = PerformanceFeedback(
        player_id=data["player_id"],
        coach_id=coach.coach_id,
        comments=data["comments"],
        rating=rating,
        category=category,
    )
    db.session.add(feedback)
    db.session.commit()
    return jsonify(feedback.to_dict()), 201


# ---- Analytics & Reports ----


@coach_bp.get("/analytics")
@roles_required("coach")
def get_analytics():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    team_player_ids = _team_player_ids(coach)

    total_players = len(team_player_ids)
    total_activities = TrainingActivity.query.filter_by(coach_id=coach.coach_id).count()

    attendance_query = Attendance.query.filter(Attendance.player_id.in_(team_player_ids))
    total_attendance = attendance_query.count()
    present_total = attendance_query.filter(Attendance.status == "present").count()
    attendance_rate = round(present_total / total_attendance * 100, 1) if total_attendance else 0

    feedback = PerformanceFeedback.query.filter(PerformanceFeedback.player_id.in_(team_player_ids)).all()
    avg_rating = round(sum(f.rating for f in feedback) / len(feedback), 2) if feedback else None

    participation_by_activity = (
        db.session.query(TrainingActivity.activity_name, db.func.count(Participation.participation_id))
        .join(Participation)
        .filter(TrainingActivity.coach_id == coach.coach_id)
        .group_by(TrainingActivity.activity_id)
        .all()
    )

    return jsonify(
        {
            "total_players": total_players,
            "total_activities": total_activities,
            "attendance_rate": attendance_rate,
            "average_rating": avg_rating,
            "participation_by_activity": [
                {"activity_name": name, "participants": count} for name, count in participation_by_activity
            ],
        }
    )


@coach_bp.get("/reports")
@roles_required("coach")
def list_reports():
    user_id = int(get_jwt_identity())
    reports = Report.query.filter_by(generated_by=user_id).order_by(Report.generated_date.desc()).all()
    return jsonify([r.to_dict() for r in reports])


@coach_bp.post("/reports")
@roles_required("coach")
def generate_report():
    user_id = int(get_jwt_identity())
    data = request.get_json(force=True) or {}
    report_type = data.get("report_type")
    if report_type not in ("attendance", "performance", "training"):
        return jsonify({"error": "report_type must be attendance, performance, or training"}), 400

    report = Report(
        report_type=report_type,
        generated_by=user_id,
        details=data.get("details", f"{report_type.title()} report generated by coach"),
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report.to_dict()), 201
