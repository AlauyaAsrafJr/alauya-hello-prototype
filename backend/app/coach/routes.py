from datetime import date, datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.decorators import roles_required
from app.extensions import db
from app.models import (
    Coach,
    Player,
    Attendance,
    TrainingActivity,
    Participation,
    PerformanceFeedback,
    Report,
)

coach_bp = Blueprint("coach", __name__)


def _current_coach():
    user_id = int(get_jwt_identity())
    return Coach.query.filter_by(user_id=user_id).first()


@coach_bp.get("/profile")
@roles_required("coach")
def get_profile():
    coach = _current_coach()
    if not coach:
        return jsonify({"error": "Coach profile not found"}), 404
    return jsonify(coach.to_dict())


# ---- Manage Player Profile ----


@coach_bp.get("/players")
@roles_required("coach")
def list_players():
    q = request.args.get("q", "").strip()
    query = Player.query
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
    player = Player.query.get_or_404(player_id)
    return jsonify(player.to_dict())


@coach_bp.patch("/players/<int:player_id>")
@roles_required("coach")
def edit_player_profile(player_id):
    player = Player.query.get_or_404(player_id)
    data = request.get_json(force=True) or {}
    editable_fields = [
        "first_name",
        "last_name",
        "email",
        "contact_number",
        "team",
        "membership_status",
        "profile_photo",
    ]
    for field in editable_fields:
        if field in data:
            setattr(player, field, data[field])
    if "date_of_birth" in data and data["date_of_birth"]:
        player.date_of_birth = date.fromisoformat(data["date_of_birth"])
    db.session.commit()
    return jsonify(player.to_dict())


# ---- Track Participation: Record Attendance ----


@coach_bp.get("/attendance")
@roles_required("coach")
def list_attendance():
    query = Attendance.query
    player_id = request.args.get("player_id", type=int)
    on_date = request.args.get("date")
    if player_id:
        query = query.filter_by(player_id=player_id)
    if on_date:
        query = query.filter_by(date=date.fromisoformat(on_date))
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
    record = Attendance.query.get_or_404(attendance_id)
    data = request.get_json(force=True) or {}
    if "status" in data:
        record.status = data["status"]
    db.session.commit()
    return jsonify(record.to_dict())


# ---- Track Participation: Log / Edit Training Activity ----


@coach_bp.get("/training-activities")
@roles_required("coach")
def list_training_activities():
    activities = TrainingActivity.query.order_by(TrainingActivity.activity_date.desc()).all()
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

    activity = TrainingActivity(
        coach_id=coach.coach_id,
        activity_name=data["activity_name"],
        activity_date=date.fromisoformat(data["activity_date"]),
        duration=data.get("duration"),
        notes=data.get("notes"),
    )
    db.session.add(activity)
    db.session.flush()

    for player_id in data.get("participant_ids", []):
        db.session.add(
            Participation(player_id=player_id, activity_id=activity.activity_id, participation_status="joined")
        )
    db.session.commit()
    return jsonify(activity.to_dict()), 201


@coach_bp.patch("/training-activities/<int:activity_id>")
@roles_required("coach")
def edit_training_activity(activity_id):
    activity = TrainingActivity.query.get_or_404(activity_id)
    data = request.get_json(force=True) or {}
    editable_fields = ["activity_name", "duration", "notes"]
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
    records = Participation.query.filter_by(activity_id=activity_id).all()
    return jsonify([r.to_dict() for r in records])


@coach_bp.patch("/participation/<int:participation_id>")
@roles_required("coach")
def update_participation(participation_id):
    record = Participation.query.get_or_404(participation_id)
    data = request.get_json(force=True) or {}
    if "participation_status" in data:
        record.participation_status = data["participation_status"]
    db.session.commit()
    return jsonify(record.to_dict())


# ---- Performance Evaluation ----


@coach_bp.get("/performance-feedback")
@roles_required("coach")
def list_performance_feedback():
    player_id = request.args.get("player_id", type=int)
    query = PerformanceFeedback.query
    if player_id:
        query = query.filter_by(player_id=player_id)
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
    rating = int(data["rating"])
    if not 1 <= rating <= 5:
        return jsonify({"error": "rating must be between 1 and 5"}), 400

    feedback = PerformanceFeedback(
        player_id=data["player_id"],
        coach_id=coach.coach_id,
        comments=data["comments"],
        rating=rating,
    )
    db.session.add(feedback)
    db.session.commit()
    return jsonify(feedback.to_dict()), 201


# ---- Analytics & Reports ----


@coach_bp.get("/analytics")
@roles_required("coach")
def get_analytics():
    total_players = Player.query.count()
    total_activities = TrainingActivity.query.count()
    total_attendance = Attendance.query.count()
    present_total = Attendance.query.filter_by(status="present").count()
    attendance_rate = round(present_total / total_attendance * 100, 1) if total_attendance else 0

    feedback = PerformanceFeedback.query.all()
    avg_rating = round(sum(f.rating for f in feedback) / len(feedback), 2) if feedback else None

    participation_by_activity = (
        db.session.query(TrainingActivity.activity_name, db.func.count(Participation.participation_id))
        .join(Participation)
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
